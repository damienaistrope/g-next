# Deploying G-Next — Share with Anyone in Minutes

G-Next is a static web app. Once deployed, your friends just open a link — no installs, no terminal.

---

## Option 1: Vercel (Recommended — Free, < 5 min)

### One-time setup

1. **Push to GitHub**
   - Go to [github.com/new](https://github.com/new) and create a repo
   - In your project folder, run:
     ```bash
     git init
     git add .
     git commit -m "initial"
     git remote add origin https://github.com/YOUR_NAME/g-next.git
     git push -u origin main
     ```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com) → Sign up with GitHub (free)
   - Click **Add New Project** → import your `g-next` repo
   - Vercel auto-detects Vite — just click **Deploy**
   - Done! You'll get a URL like `https://g-next-abc123.vercel.app`

3. **Share the link** with your friends and coworkers ✓

### Every update
```bash
git add . && git commit -m "update" && git push
```
Vercel redeploys automatically.

---

## Option 2: Netlify (Also Free)

1. Run `npm run build` — this creates a `dist/` folder
2. Go to [netlify.com](https://netlify.com) → Sign up (free)
3. Drag and drop the `dist/` folder onto the Netlify dashboard
4. Done — you get a URL immediately

To update: just drag a new `dist/` folder.

---

## Option 3: GitHub Pages (Free, No Account Needed Beyond GitHub)

```bash
npm install --save-dev gh-pages
npx gh-pages -d dist
```

Your app will be at `https://YOUR_NAME.github.io/g-next/`

---

## Giving Friends the Best Experience

Once deployed, share the URL. On macOS, they can:

- **Bookmark it** — just use it in the browser
- **Add to Dock** — In Safari: File → Add to Dock (macOS Sonoma+).
  This creates a native-feeling app icon with no security warnings.
- **PWA on iPhone/iPad** — In Safari: Share → Add to Home Screen

---

## Google Calendar Sync (Optional)

If you want the Google Calendar sync feature to work after deploying:

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a project → enable **Authentication** → enable **Google** sign-in
3. Add your deployed URL to the authorized domains
4. Update `firebase-applet-config.json` with your project's config

---

## Gemini AI Features (Optional)

The app works great without AI. If you want AI-powered features:

1. Get a free API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. In Vercel: go to your project → Settings → Environment Variables
   - Add `VITE_GEMINI_API_KEY` = your key
3. Redeploy

> **Note:** This key is visible in the browser bundle. For personal/team use
> this is fine. For public apps, set up a backend proxy.
