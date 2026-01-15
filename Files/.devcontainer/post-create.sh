#!/usr/bin/env bash
set -euo pipefail

# Create Python venv for MCP servers and install deps if present
python3 -m venv /workspaces/AgenticCoder/.venv
source /workspaces/AgenticCoder/.venv/bin/activate
pip install --upgrade pip

for srv in azure-pricing-mcp azure-resource-graph-mcp microsoft-docs-mcp; do
  req=".github/mcp/${srv}/requirements.txt"
  if [ -f "${req}" ]; then
    echo "Installing MCP deps for ${srv}..."
    pip install -r "${req}" || true
  fi
done

deactivate

# Install npm dependencies if package.json present (skipped if absent)
if [ -f package.json ]; then
  npm install
fi

echo "Post-create completed. Add MCP requirements to enable full setup."
