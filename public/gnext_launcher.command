#!/bin/bash
# ==============================================================================
# G-Next Desktop Launcher — Double-click this to launch G-Next
# ==============================================================================

GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

SAVED_URL_FILE="$HOME/.gnext_host_url"

HOST_URL=""
if [ -f "$SAVED_URL_FILE" ]; then
    HOST_URL=$(cat "$SAVED_URL_FILE" | xargs)
fi

if [ -z "$HOST_URL" ]; then
    HOST_URL=$(osascript -e 'tell application "System Events" to text returned of (display dialog "Enter your G-Next server URL:" default answer "http://localhost:3000" with title "G-Next Launcher" buttons {"Cancel","Launch"} default button "Launch")' 2>/dev/null)
    if [ $? -ne 0 ] || [ -z "$HOST_URL" ]; then exit 0; fi
    echo "$HOST_URL" > "$SAVED_URL_FILE"
fi

clear
echo -e "${CYAN}${BOLD}   G-Next Workspace Launcher${NC}"
echo -e " -> Target: $HOST_URL"
echo "------------------------------------"

CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [ ! -f "$CHROME_BIN" ]; then
    CHROME_BIN="$HOME/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
fi

if [ -f "$CHROME_BIN" ]; then
    echo -e "[+] Launching in Chrome standalone mode..."
    "$CHROME_BIN" \
        --app="$HOST_URL" \
        --window-size=1200,820 \
        --disable-extensions \
        --no-default-browser-check \
        --user-data-dir="$HOME/Library/Application Support/G-Next-App" &
else
    echo -e "[+] Opening in default browser..."
    open "$HOST_URL"
fi

echo -e "\n${GREEN}${BOLD}[OK] G-Next launched!${NC}"
sleep 2
exit 0
