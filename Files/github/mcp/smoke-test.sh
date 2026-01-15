#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
PY="${PYTHON:-python3}"
FAIL=0

check() {
  local name="$1"; shift
  echo "[SMOKE] ${name}..."
  if ${PY} -m "$@" 2>&1 | sed 's/^/  /'; then
    echo "[SMOKE] ${name} OK"
  else
    echo "[SMOKE] ${name} FAILED" >&2
    FAIL=1
  fi
}

# Use repo venv if present
if [ -d "${ROOT}/../../.venv" ]; then
  source "${ROOT}/../../.venv/bin/activate"
fi

check azure-pricing-mcp azure_pricing_mcp
check azure-resource-graph-mcp azure_resource_graph_mcp
check microsoft-docs-mcp microsoft_docs_mcp

if [ "$FAIL" -eq 0 ]; then
  echo "Smoke tests completed (stubs emit TODO messages)."
else
  echo "Smoke tests completed with failures." >&2
fi

exit "$FAIL"
