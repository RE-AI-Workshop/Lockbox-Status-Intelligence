#!/bin/bash
# Generic deploy smoke — status codes only, no business assertions.
# Copy to scripts/smoke-test.sh and replace the CHECKS list.
#
# Env:
#   BASE_URL   — deployed API origin (no trailing slash)
#   AUTH_HEADER — optional full Authorization header value
#
# Exit: 0 all passed, 1 at least one failed.
set -euo pipefail

: "${BASE_URL:?Set BASE_URL}"

FAIL=0

check() {
  local name="$1"
  local method="$2"
  local path="$3"
  local expect="$4"
  local url="${BASE_URL}${path}"
  local code
  if [[ -n "${AUTH_HEADER:-}" ]]; then
    if ! code=$(curl -sS -o /dev/null -w "%{http_code}" -X "$method" "$url" -H "Authorization: $AUTH_HEADER"); then
      code="000"
    fi
  else
    if ! code=$(curl -sS -o /dev/null -w "%{http_code}" -X "$method" "$url"); then
      code="000"
    fi
  fi
  if [[ "$code" == "$expect" ]]; then
    echo "PASS  $name ($code)"
  else
    echo "FAIL  $name (got $code, want $expect)"
    FAIL=1
  fi
}

# Replace these with your liveness routes. Do not assert business data here.
check "health" GET "/health" "200"

exit "$FAIL"
