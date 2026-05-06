#!/usr/bin/env bash
# Netlify build entrypoint for IdeaStudio Services.
# Installs the .NET version pinned in global.json (or DOTNET_VERSION),
# restores Blazor WASM AOT toolchain, publishes to ./publish/wwwroot.
set -euo pipefail

DOTNET_VERSION="${DOTNET_VERSION:-10.0.203}"
DOTNET_INSTALL_DIR="${HOME}/.dotnet"
PROJECT="IdeaStudio.Website/IdeaStudio.Website.csproj"
PUBLISH_DIR="publish"
FUNCTIONS_DIR="netlify/functions"

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

# Netlify Functions live in their own package (netlify/functions/package.json).
# When the site uses a custom build command, the function deps are not always
# auto-installed before esbuild bundles them, so install explicitly here.
echo "→ npm ci in ${FUNCTIONS_DIR} (puppeteer-core, @sparticuz/chromium-min, …)"
if [ -f "${FUNCTIONS_DIR}/package-lock.json" ]; then
  npm --prefix "${FUNCTIONS_DIR}" ci
else
  npm --prefix "${FUNCTIONS_DIR}" install
fi

echo "✓ Build complete."
echo "  Publish dir: ${PUBLISH_DIR}/wwwroot"
ls -lah "${PUBLISH_DIR}/wwwroot" | head -20
