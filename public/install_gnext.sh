#!/bin/bash
# G-Next macOS Installer

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
clear
echo -e "${CYAN}${BOLD}  G→Next Installer${NC}"
echo "────────────────────────────────"

[[ "$(uname)" != "Darwin" ]] && echo -e "${RED}macOS only.${NC}" && exit 1

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_SRC="$SCRIPT_DIR/G-Next.app"
APP_DST="/Applications/G-Next.app"

if [ ! -d "$APP_SRC" ]; then
  echo -e "${RED}G-Next.app not found in the same folder as this script.${NC}"
  exit 1
fi

echo " Installing G-Next.app to /Applications..."
[[ -d "$APP_DST" ]] && rm -rf "$APP_DST"
cp -r "$APP_SRC" "$APP_DST"
chmod +x "$APP_DST/Contents/MacOS/G-Next"

# Remove macOS quarantine flag — prevents "unverified developer" warning
xattr -cr "$APP_DST" 2>/dev/null
# Also add to Gatekeeper allowed list
spctl --add "$APP_DST" 2>/dev/null

echo -e "${GREEN}${BOLD}Done! G-Next is installed.${NC}"
echo " → Open Launchpad or Spotlight and search G-Next"
echo ""
