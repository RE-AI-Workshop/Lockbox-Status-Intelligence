#!/usr/bin/env bash
# TestRail helper functions for the backend service agent workflows.
# Source this file before calling any function:
#   source scripts/testrail-helpers.sh
#
# Required env vars (set in .env.local):
#   TESTRAIL_URL, TESTRAIL_USERNAME, TESTRAIL_API_KEY,
#   TESTRAIL_PROJECT_ID, JIRA_BASE_URL
# Suite IDs used by workflows:
#   TESTRAIL_UNIT_SUITE_ID, TESTRAIL_API_SUITE_ID,
#   TESTRAIL_REGRESSION_SUITE_ID, TESTRAIL_SMOKE_SUITE_ID

# Preflight check — call once at the start of any TestRail-enabled workflow step.
# Returns 0 if TestRail is configured and accessible, 1 otherwise.
testrail_preflight_check() {
  if [[ -z "${TESTRAIL_URL:-}" ]]; then
    echo "TESTRAIL_URL not set — skipping TestRail integration."
    return 1
  fi
  local field
  field=$(curl -s -u "$TESTRAIL_USERNAME:$TESTRAIL_API_KEY" \
    "$TESTRAIL_URL/index.php?/api/v2/get_case_fields" \
    | jq -r '.[] | select(.name == "automation_id") | .name')
  if [[ -z "$field" ]]; then
    echo "ERROR: automation_id custom field not found in TestRail." >&2
    echo "Create it: Administration > Customizations > Fields > Add Field (type: Text, system name: automation_id)" >&2
    return 1
  fi
  local project
  project=$(curl -s -u "$TESTRAIL_USERNAME:$TESTRAIL_API_KEY" \
    "$TESTRAIL_URL/index.php?/api/v2/get_project/$TESTRAIL_PROJECT_ID" \
    | jq -r '.id // empty')
  if [[ -z "$project" ]]; then
    echo "ERROR: TestRail project $TESTRAIL_PROJECT_ID not found or not accessible." >&2
    return 1
  fi
  echo "TestRail preflight OK: automation_id field exists, project $TESTRAIL_PROJECT_ID accessible."
}

# True when $1 is a numeric TestRail id (plan, suite, run).
testrail_is_id() {
  [[ "${1:-}" =~ ^[0-9]+$ ]]
}

# Create a test plan for a Jira ticket.
# Args: $1 = ticket key (e.g. DEMO-456), $2 = ticket title
# Prints: the new plan ID
testrail_create_plan() {
  local ticket_key="$1"
  local ticket_title="$2"
  local jira_url="${JIRA_BASE_URL:-https://<company>.atlassian.net}/browse/$ticket_key"
  local payload id
  payload=$(jq -n --arg k "$ticket_key" --arg t "$ticket_title" --arg u "$jira_url" \
    '{name: ($k + ": " + $t), description: ("Jira: " + $u)}') || return 1
  id=$(curl -s -u "$TESTRAIL_USERNAME:$TESTRAIL_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$payload" \
    "$TESTRAIL_URL/index.php?/api/v2/add_plan/$TESTRAIL_PROJECT_ID" \
    | jq -r '.id // empty')
  if ! testrail_is_id "$id"; then
    echo "ERROR: testrail_create_plan failed — TestRail did not return a numeric plan id." >&2
    return 1
  fi
  echo "$id"
}

# Add a test run to an existing plan.
# Args: $1 = plan ID, $2 = suite ID, $3 = run name
# Prints: the new run ID
testrail_add_plan_entry() {
  local plan_id="$1"
  local suite_id="$2"
  local run_name="$3"
  local payload
  payload=$(jq -n --argjson sid "$suite_id" --arg n "$run_name" \
    '{suite_id: $sid, name: $n, include_all: true}') || return 1
  curl -s -u "$TESTRAIL_USERNAME:$TESTRAIL_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$payload" \
    "$TESTRAIL_URL/index.php?/api/v2/add_plan_entry/$plan_id" \
    | jq -r '.runs[0].id'
}

# Close a test plan (marks it read-only in TestRail).
# Args: $1 = plan ID
testrail_close_plan() {
  local plan_id="$1"
  curl -s -u "$TESTRAIL_USERNAME:$TESTRAIL_API_KEY" \
    -H "Content-Type: application/json" \
    -X POST \
    "$TESTRAIL_URL/index.php?/api/v2/close_plan/$plan_id"
}

# Get plan summary stats (JSON).
# Args: $1 = plan ID
testrail_get_plan_stats() {
  local plan_id="$1"
  curl -s -u "$TESTRAIL_USERNAME:$TESTRAIL_API_KEY" \
    "$TESTRAIL_URL/index.php?/api/v2/get_plan/$plan_id"
}

# trcli config that maps JUnit skipped → TestRail Not Applicable (status 6).
# Override with TRCLI_CONFIG if the file is relocated (QA artifact / release).
testrail_trcli_config() {
  if [[ -n "${TRCLI_CONFIG:-}" ]]; then
    echo "$TRCLI_CONFIG"
    return
  fi
  local here
  here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  echo "$here/trcli-config.yml"
}

# Upload a JUnit XML file to a TestRail suite (creates cases + a plan entry run).
# Args: $1 = junit file path, $2 = suite ID, $3 = run title
# Honors TESTRAIL_PLAN_ID when set (attaches the run to the plan).
# Do not pre-create a run with testrail_add_plan_entry — trcli creates it atomically.
# JUnit skipped → Not Applicable (scripts/trcli-config.yml), not Retest.
testrail_upload_junit() {
  local junit_file="$1"
  local suite_id="$2"
  local run_title="$3"
  if [[ ! -f "$junit_file" ]]; then
    echo "WARNING: JUnit file not found: $junit_file — skipping TestRail upload." >&2
    return 1
  fi
  if ! testrail_is_id "$suite_id"; then
    echo "WARNING: suite id is missing or not numeric ('$suite_id') — skipping TestRail upload." >&2
    return 1
  fi
  local trcli_cmd
  trcli_cmd=$(command -v trcli 2>/dev/null || echo "$HOME/Library/Python/3.9/bin/trcli")
  if [[ ! -x "$trcli_cmd" ]]; then
    echo "WARNING: trcli not found — skipping TestRail upload. Install with: pip3 install trcli" >&2
    return 1
  fi
  local parse_args=(parse_junit -f "$junit_file" --suite-id "$suite_id" --title "$run_title")
  if [[ -n "${TESTRAIL_PLAN_ID:-}" ]]; then
    if ! testrail_is_id "$TESTRAIL_PLAN_ID"; then
      echo "WARNING: TESTRAIL_PLAN_ID is not numeric ('$TESTRAIL_PLAN_ID') — skipping TestRail upload." >&2
      return 1
    fi
    parse_args+=(--plan-id "$TESTRAIL_PLAN_ID")
  else
    parse_args+=(--close-run)
  fi
  local trcli_config
  trcli_config="$(testrail_trcli_config)"
  local trcli_args=(-y)
  if [[ -f "$trcli_config" ]]; then
    trcli_args+=(-c "$trcli_config")
  else
    echo "WARNING: trcli config not found at $trcli_config — JUnit skipped will map to Retest." >&2
  fi
  "$trcli_cmd" "${trcli_args[@]}" \
    -h "$TESTRAIL_URL" \
    -u "$TESTRAIL_USERNAME" \
    -k "$TESTRAIL_API_KEY" \
    --project "${TESTRAIL_PROJECT_NAME:-backend service - Automated}" \
    --project-id "$TESTRAIL_PROJECT_ID" \
    "${parse_args[@]}"
}
