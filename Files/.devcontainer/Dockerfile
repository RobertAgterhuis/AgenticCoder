# AgenticCoder devcontainer base
# Ubuntu 22.04 with common tooling; see post-create.sh for language setup.
FROM mcr.microsoft.com/devcontainers/base:ubuntu-22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       python3 \
       python3-pip \
       python3-venv \
       nodejs \
       npm \
       git \
       curl \
       ca-certificates \
       unzip \
       build-essential \
       jq \
       powershell \
    && rm -rf /var/lib/apt/lists/*

# Install Bicep CLI (Linux x64)
RUN curl -Lo /usr/local/bin/bicep https://github.com/Azure/bicep/releases/latest/download/bicep-linux-x64 \
    && chmod +x /usr/local/bin/bicep

# Install Azure CLI (scripted install)
RUN curl -sL https://aka.ms/InstallAzureCLIDeb | bash

# Default workdir
WORKDIR /workspaces/AgenticCoder

# Optional: preload npm/pip cache steps can be added later
