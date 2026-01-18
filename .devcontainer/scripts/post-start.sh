#!/bin/bash
#===============================================================================
# AgenticCoder - Post Start Script
# Runs every time the container starts
#===============================================================================

echo "🔄 AgenticCoder Post-Start"
echo "=========================="

#-------------------------------------------------------------------------------
# Validate Environment
#-------------------------------------------------------------------------------
echo ""
echo "🔍 Validating environment..."

# Check Node
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found"
    exit 1
fi
echo "✓ Node.js $(node --version)"

# Check npm
echo "✓ npm $(npm --version)"

# Check TypeScript
if command -v tsc &> /dev/null; then
    echo "✓ TypeScript $(tsc --version | awk '{print $2}')"
fi

# Check Python
echo "✓ Python $(python3 --version | awk '{print $2}')"

# Check Azure CLI
if command -v az &> /dev/null; then
    echo "✓ Azure CLI $(az version --query '\"azure-cli\"' -o tsv)"
fi

#-------------------------------------------------------------------------------
# Check Build Status
#-------------------------------------------------------------------------------
echo ""
echo "📦 Checking build status..."
if [ -d "dist" ] && [ -f "dist/index.js" ]; then
    echo "✓ TypeScript build exists"
else
    echo "⚠ Build not found, running npm run build..."
    npm run build || echo "Build pending - fix TypeScript errors first"
fi

#-------------------------------------------------------------------------------
# Check Config
#-------------------------------------------------------------------------------
echo ""
echo "⚙️ Checking configuration..."
if [ -f ".agenticcoder/config.json" ]; then
    echo "✓ Config file exists"
else
    echo "⚠ Config file not found"
    mkdir -p .agenticcoder
fi

#-------------------------------------------------------------------------------
# Check .env
#-------------------------------------------------------------------------------
if [ -f ".env" ]; then
    echo "✓ Environment file exists"
else
    echo "⚠ .env not found - using defaults"
fi

#-------------------------------------------------------------------------------
# Azure Status
#-------------------------------------------------------------------------------
echo ""
echo "☁️ Azure status..."
if az account show &>/dev/null; then
    ACCOUNT=$(az account show --query name -o tsv)
    echo "✓ Logged in as: $ACCOUNT"
else
    echo "⚠ Not logged in to Azure"
fi

#-------------------------------------------------------------------------------
# Summary
#-------------------------------------------------------------------------------
echo ""
echo "=========================="
echo "✅ Environment Ready!"
echo ""
echo "Available commands:"
echo "  npm run dev      - Start development"
echo "  npm run build    - Build TypeScript"
echo "  npm test         - Run tests"
echo "  npm run lint     - Run linter"
echo ""
