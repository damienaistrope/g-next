/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from 'jszip';

/**
 * Shell script template for the G-Next macOS installer.
 * Uses the active deployment URL rather than any hardcoded host.
 */
const INSTALL_SH_TEMPLATE = `#!/bin/bash

# ==============================================================================
# G-Next Focus Workspace — macOS Setup Tool
# ==============================================================================

RED='\\033[0;31m'
GREEN='\\033[0;32m'
CYAN='\\033[0;36m'
BOLD='\\033[1m'
NC='\\033[0m'

clear
echo -e "\${CYAN}\${BOLD}"
echo '   ____  _   _           _   '
echo '  / ___|| \\\\ | | _____  _| |_ '
echo ' | |  _ |  \\\\| |/ _ \\\\ \\\\/ / __|'
echo ' | |_| || |\\\\  |  __/>  <| |_ '
echo '  \\\\____||_| \\\\_|\\\\___/_/\\\\_\\\\\\\\__|'
echo -e "  Focus Workspace — macOS Installer     "
echo -e "\${NC}"
echo "------------------------------------------------------------"

HOST_URL="__HOST_URL__"

# Check macOS
if [ "$(uname)" != "Darwin" ]; then
    echo -e "\${RED}Error: This installer is for macOS only.\${NC}"
    echo "Access G-Next directly in your browser: \$HOST_URL"
    exit 1
fi
echo " -> macOS $(sw_vers -productVersion) detected ✓"

# Save URL for the app launcher
echo "\$HOST_URL" > "\$HOME/.gnext_host_url"

# Build app using osacompile
APP_PATH="/Applications/G-Next.app"
echo " -> Building G-Next.app..."
osacompile -o "\$APP_PATH" -e "do shell script \\"open \\\\\\"\${HOST_URL}\\\\\\"\\""
chmod +x "\$APP_PATH"

echo ""
echo "------------------------------------------------------------"
echo -e "\${GREEN}\${BOLD}G-Next installed to /Applications/G-Next.app!\${NC}"
echo " -> Server: \$HOST_URL"
echo "------------------------------------------------------------"
`;

const LAUNCHER_COMMAND_TEMPLATE = `#!/bin/bash

# G-Next Desktop Launcher
HOST_URL="__HOST_URL__"

CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [ ! -f "\$CHROME_BIN" ]; then
    open "\$HOST_URL"
    exit 0
fi

"\$CHROME_BIN" --app="\$HOST_URL" --window-size=1200,820 \\
    --disable-extensions --no-default-browser-check \\
    --user-data-dir="\$HOME/Library/Application Support/G-Next-App" &
`;

/**
 * Creates and downloads a ZIP containing installer scripts configured
 * to point to the current deployment URL.
 */
export async function downloadDynamicInstallerZip(customUrlOverride?: string) {
  let targetUrl = customUrlOverride?.trim();

  if (!targetUrl) {
    const loc = window.location;
    let folderPath = loc.pathname;
    if (/\.[a-zA-Z0-9]+$/.test(folderPath)) {
      folderPath = folderPath.substring(0, folderPath.lastIndexOf('/'));
    }
    if (folderPath && !folderPath.endsWith('/')) {
      folderPath += '/';
    }
    targetUrl = loc.origin + folderPath;
    if (targetUrl.endsWith('/')) {
      targetUrl = targetUrl.slice(0, -1);
    }
  }

  console.log('[InstallerGenerator] Target URL:', targetUrl);

  const processedInstallSh = INSTALL_SH_TEMPLATE.replaceAll('__HOST_URL__', targetUrl);
  const processedLauncherCommand = LAUNCHER_COMMAND_TEMPLATE.replaceAll('__HOST_URL__', targetUrl);

  const zip = new JSZip();
  zip.file('install_gnext.sh', processedInstallSh, { unixPermissions: '755' });
  zip.file('gnext_launcher.command', processedLauncherCommand, { unixPermissions: '755' });

  const contentBlob = await zip.generateAsync({
    type: 'blob',
    platform: 'UNIX',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(contentBlob);
  link.download = 'G-Next_macOS_Installer.zip';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }, 100);
}
