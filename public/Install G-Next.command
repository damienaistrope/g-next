#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# G→Next Installer
# Double-click this file to install G-Next to your Applications folder.
# ─────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_SRC="$SCRIPT_DIR/G-Next.app"
APP_DST="/Applications/G-Next.app"

# ── Pretty header ─────────────────────────────────────────────────────────────
clear
echo ""
echo "  ┌─────────────────────────────┐"
echo "  │   G→Next Installer          │"
echo "  └─────────────────────────────┘"
echo ""

# ── Sanity checks ─────────────────────────────────────────────────────────────
if [ "$(uname)" != "Darwin" ]; then
  echo "  ✗  This installer is for macOS only."
  read -p "  Press Enter to close..." && exit 1
fi

if [ ! -d "$APP_SRC" ]; then
  echo "  ✗  G-Next.app not found next to this installer."
  echo "     Make sure both files are in the same folder."
  read -p "  Press Enter to close..." && exit 1
fi

# ── Install ───────────────────────────────────────────────────────────────────
echo "  Installing G-Next.app to /Applications ..."
echo ""

# Remove old version if present
if [ -d "$APP_DST" ]; then
  rm -rf "$APP_DST"
fi

# Copy app
cp -r "$APP_SRC" "$APP_DST"
chmod +x "$APP_DST/Contents/MacOS/G-Next"

# Strip the quarantine attribute — this is what prevents the security warning
xattr -cr "$APP_DST" 2>/dev/null
# Also register with Gatekeeper
spctl --add "$APP_DST" 2>/dev/null

echo "  ✓  Installed to /Applications/G-Next.app"
echo ""

# ── Ask to launch ──────────────────────────────────────────────────────────────
read -p "  Open G-Next now? [Y/n] " ANSWER
if [[ "$ANSWER" != "n" && "$ANSWER" != "N" ]]; then
  open "$APP_DST"
fi

echo ""
echo "  Done! G-Next is in your Applications folder."
echo "  Find it any time with Spotlight (⌘ Space → type G-Next)."
echo ""
sleep 2
