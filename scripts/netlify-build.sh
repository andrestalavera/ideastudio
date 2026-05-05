#!/usr/bin/env bash
# Netlify build entrypoint for IdeaStudio Services.
# Installs the .NET version pinned in global.json (or DOTNET_VERSION),
# restores Blazor WASM AOT toolchain, publishes to ./publish/wwwroot.
set -euo pipefail

DOTNET_VERSION="${DOTNET_VERSION:-10.0.203}"
DOTNET_INSTALL_DIR="${HOME}/.dotnet"
PROJECT="src/IdeaStudio.Website/IdeaStudio.Website.csproj"
PUBLISH_DIR="publish"

echo "→ Installing .NET ${DOTNET_VERSION} → ${DOTNET_INSTALL_DIR}"
curl -sSL https://dot.net/v1/dotnet-install.sh -o /tmp/dotnet-install.sh
chmod +x /tmp/dotnet-install.sh
/tmp/dotnet-install.sh --version "${DOTNET_VERSION}" --install-dir "${DOTNET_INSTALL_DIR}"

export PATH="${DOTNET_INSTALL_DIR}:${PATH}"
export DOTNET_ROOT="${DOTNET_INSTALL_DIR}"

echo "→ dotnet --version"
dotnet --version

echo "→ Ensuring wasm-tools workload is installed (required for Blazor WASM AOT)"
if dotnet workload list 2>/dev/null | grep -q '^wasm-tools'; then
  echo "  wasm-tools already present — skipping install"
else
  dotnet workload install wasm-tools --skip-manifest-update
fi

echo "→ dotnet publish ${PROJECT} -c Release -o ${PUBLISH_DIR}"
dotnet publish "${PROJECT}" -c Release -o "${PUBLISH_DIR}"

echo "✓ Build complete."
echo "  Publish dir: ${PUBLISH_DIR}/wwwroot"
ls -lah "${PUBLISH_DIR}/wwwroot" | head -20
