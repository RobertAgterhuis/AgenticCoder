# syntax=docker/dockerfile:1
ARG VARIANT=20
FROM mcr.microsoft.com/devcontainers/javascript-node:${VARIANT}

# Install Python 3.11 and Azure CLI
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-pip python3-venv curl apt-transport-https gnupg lsb-release \
    && curl -sL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > /usr/share/keyrings/microsoft.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft.gpg] https://packages.microsoft.com/repos/azure-cli/ $(lsb_release -cs) main" > /etc/apt/sources.list.d/azure-cli.list \
    && apt-get update \
    && apt-get install -y azure-cli \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Global tools
RUN npm i -g npm@latest pnpm@9 yarn@latest

ENV AZURE_CORE_USE_CLI=True
