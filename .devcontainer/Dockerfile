# syntax=docker/dockerfile:1
#===============================================================================
# AgenticCoder Development Container
# Complete development environment with all dependencies
#===============================================================================

ARG VARIANT=20
FROM mcr.microsoft.com/devcontainers/javascript-node:${VARIANT}

# Metadata
LABEL maintainer="AgenticCoder Team"
LABEL description="AgenticCoder Development Environment"
LABEL version="2.0.0"

#-------------------------------------------------------------------------------
# System Dependencies
#-------------------------------------------------------------------------------
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get install -y --no-install-recommends \
        # Python 3.11 for MCP servers
        python3 \
        python3-pip \
        python3-venv \
        python3-dev \
        # Build tools
        build-essential \
        # Network tools
        curl \
        wget \
        # Azure CLI dependencies
        apt-transport-https \
        gnupg \
        lsb-release \
        ca-certificates \
        # Git LFS
        git-lfs \
        # Utilities
        jq \
        unzip \
        vim \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

#-------------------------------------------------------------------------------
# Azure CLI
#-------------------------------------------------------------------------------
RUN curl -sL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > /usr/share/keyrings/microsoft.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft.gpg] https://packages.microsoft.com/repos/azure-cli/ $(lsb_release -cs) main" > /etc/apt/sources.list.d/azure-cli.list \
    && apt-get update \
    && apt-get install -y azure-cli \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

#-------------------------------------------------------------------------------
# Azure Tools
#-------------------------------------------------------------------------------
# Azure Functions Core Tools v4
RUN curl https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > /usr/share/keyrings/microsoft.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft.gpg] https://packages.microsoft.com/repos/microsoft-ubuntu-$(lsb_release -cs)-prod $(lsb_release -cs) main" > /etc/apt/sources.list.d/azure-functions.list \
    && apt-get update \
    && apt-get install -y azure-functions-core-tools-4 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Azure Developer CLI (azd)
RUN curl -fsSL https://aka.ms/install-azd.sh | bash

# Bicep CLI
RUN az bicep install

#-------------------------------------------------------------------------------
# Node.js Global Tools
#-------------------------------------------------------------------------------
RUN npm install -g \
    npm@latest \
    pnpm@9 \
    yarn@latest \
    typescript@latest \
    ts-node \
    esbuild \
    vitest \
    prettier \
    eslint \
    @biomejs/biome \
    husky

#-------------------------------------------------------------------------------
# Python Environment for MCP Servers
#-------------------------------------------------------------------------------
RUN python3 -m pip install --upgrade pip setuptools wheel --break-system-packages \
    && python3 -m pip install --break-system-packages \
        # MCP SDK
        mcp \
        # Azure SDK
        azure-identity \
        azure-keyvault-secrets \
        azure-mgmt-resource \
        azure-mgmt-subscription \
        # Utilities
        python-dotenv \
        pydantic \
        httpx \
        aiohttp

#-------------------------------------------------------------------------------
# Environment Variables
#-------------------------------------------------------------------------------
ENV AZURE_CORE_USE_CLI=True
ENV NODE_ENV=development
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Path additions
ENV PATH="/home/vscode/.local/bin:${PATH}"

#-------------------------------------------------------------------------------
# Working Directory
#-------------------------------------------------------------------------------
WORKDIR /workspaces/AgenticCoder

#-------------------------------------------------------------------------------
# Health Check
#-------------------------------------------------------------------------------
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node --version && python3 --version && az --version | head -1

#-------------------------------------------------------------------------------
# Default Command
#-------------------------------------------------------------------------------
CMD ["sleep", "infinity"]
