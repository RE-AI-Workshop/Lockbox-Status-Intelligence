#!/usr/bin/env bash
# Generic Newman runner. Configure collection paths and additional env keys in PROJECT.md.
set -euo pipefail
: "${BASE_URL:?Set BASE_URL}"
COLLECTION="${1:?Usage: run-api-suites.sh <collection.json> [report-dir]}"
REPORT_DIR="${2:-test-results}"
mkdir -p "$REPORT_DIR"
command -v newman >/dev/null || { echo "newman is required" >&2; exit 2; }
args=(run "$COLLECTION" --env-var "baseUrl=$BASE_URL" --reporters cli,junit --reporter-junit-export "$REPORT_DIR/newman.xml")
[[ -n "${FIXTURE_ADMIN_AUTH:-}" ]] && args+=(--env-var "fixtureAdminAuth=$FIXTURE_ADMIN_AUTH")
[[ -n "${STANDARD_CALLER_AUTH:-}" ]] && args+=(--env-var "standardCallerAuth=$STANDARD_CALLER_AUTH")
newman "${args[@]}"
