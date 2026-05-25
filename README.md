<div align="center">
  <h1>G→Next Focus Workspace</h1>
  <p>A macOS-style productivity app with task management, focus timer, and Google Calendar sync.</p>
</div>

---

## Quick Start

**Prerequisites:** Node.js 18+

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure your API key:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your GEMINI_API_KEY
   # Get a free key at: https://aistudio.google.com/apikey
   ```

3. **Run locally:**
   ```bash
   npm run dev
   # Opens at http://localhost:3000
   ```

---

## macOS App Installation

After running `npm run dev` (or deploying), you can install G-Next as a native-feeling macOS app.

### Option A — Download from the app (recommended)
1. Open G-Next in your browser
2. Click **Download** in the menu bar
3. Choose your preferred installer format

### Option B — Manual install
1. Download `G-Next_macOS.zip` from the Releases section
2. Unzip and drag `G-Next.app` to `/Applications`
3. Double-click `G-Next.app` — it will ask for your server URL on first launch

### Option C — ISO Disk Image
1. Download `G-Next_macOS_Installer.dmg`
2. Double-click to mount it in Finder
3. Run `install_gnext.sh` from the mounted volume

---

## Build & Deploy

```bash
# Build for production (also regenerates the installer DMG)
npm run build

# Preview the production build
npm run preview
```

### Deploy to Vercel / Netlify
```bash
npm run build
# Deploy the `dist/` folder
```
After deploying, update `APP_URL` in your `.env.local` to the production URL.

---

## Google Calendar Sync (Optional)

To enable Google Calendar sync:
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Google Authentication**
3. Copy your Firebase config into `firebase-applet-config.json`

---

## Project Structure

```
src/
  App.tsx                   Main app
  components/
    MacMenuBar.tsx          macOS-style menu bar
    FocusWidget.tsx         Pomodoro timer widget
    DmgDownloadModal.tsx    macOS installer download UI
    SettingsModal.tsx       Settings panel
    OnboardingModal.tsx     First-run onboarding
    MarketingLanding.tsx    Landing page
  lib/
    installerGenerator.ts   Dynamic installer ZIP builder
    dmgBase64.ts            Pre-built DMG (auto-generated)
    firebaseAuth.ts         Google OAuth
    googleCalendar.ts       Calendar API
  data.ts                   Default tasks/lists
  types.ts                  TypeScript types
scripts/
  generate-dmg.js           Builds the macOS installer ISO
public/
  G-Next.app/               macOS app bundle
  G-Next_macOS_Installer.dmg  Pre-built installer ISO
  install_gnext.sh          Shell-based installer
  gnext_launcher.command    Standalone launcher
```
