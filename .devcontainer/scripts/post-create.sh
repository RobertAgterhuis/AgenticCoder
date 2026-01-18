#!/bin/bash
#===============================================================================
# AgenticCoder - Post Create Script
# Runs once when the container is created
#===============================================================================

set -e

echo "🚀 AgenticCoder Post-Create Setup"
echo "=================================="

#-------------------------------------------------------------------------------
# Install Node Dependencies
#-------------------------------------------------------------------------------
echo ""
echo "📦 Installing Node.js dependencies..."
npm ci

#-------------------------------------------------------------------------------
# Build TypeScript
#-------------------------------------------------------------------------------
echo ""
echo "🔨 Building TypeScript..."
npm run build || echo "Build failed - will be fixed in GAP-02"

#-------------------------------------------------------------------------------
# Setup Git Hooks
#-------------------------------------------------------------------------------
echo ""
echo "🪝 Setting up Git hooks..."
npx husky install || true

#-------------------------------------------------------------------------------
# Initialize Config
#-------------------------------------------------------------------------------
echo ""
echo "⚙️ Initializing configuration..."
if [ ! -f ".agenticcoder/config.json" ]; then
    mkdir -p .agenticcoder
    echo '{"version": "1.0.0", "initialized": true}' > .agenticcoder/config.json
    echo "Created default config.json"
fi

#-------------------------------------------------------------------------------
# Setup Python Virtual Environment (for MCP servers)
#-------------------------------------------------------------------------------
echo ""
echo "🐍 Setting up Python environment..."
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    source .venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt 2>/dev/null || echo "No requirements.txt found"
fi

#-------------------------------------------------------------------------------
# Copy Environment Template
#-------------------------------------------------------------------------------
echo ""
echo "📋 Setting up environment..."
if [ ! -f ".env" ] && [ -f ".devcontainer/.env.example" ]; then
    cp .devcontainer/.env.example .env
    echo "Created .env from template - please fill in your values"
fi

#-------------------------------------------------------------------------------
# Azure CLI Login Check
#-------------------------------------------------------------------------------
echo ""
echo "☁️ Checking Azure CLI..."
if az account show &>/dev/null; then
    echo "✓ Azure CLI already logged in"
    az account show --query "{name:name, id:id}" -o table
else
    echo "⚠ Azure CLI not logged in"
    echo "Run: az login"
fi

#-------------------------------------------------------------------------------
# Summary
#-------------------------------------------------------------------------------
echo ""
echo "=================================="
echo "✅ Post-Create Setup Complete!"
echo ""
echo "Next steps:"
echo "  1. Copy .env.example to .env and fill in values"
echo "  2. Run 'az login' if not already logged in"
echo "  3. Run 'npm test' to verify setup"
echo "  4. Run 'npm run dev' to start development"
echo ""
