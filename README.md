# Zeste

Live: https://zestec-3af1d.web.app

*One Zeste at a time.* A shared grocery list and budget app for households, built as an installable web app.

See [PROJECT.md](PROJECT.md) for the vision, scope, roadmap and decisions.

## Run it locally

Requires [Node.js](https://nodejs.org) 20 or later.

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## Status

- [x] Step 2: single shopping list (add, tick, edit, delete with undo), saved in the browser
- [x] Step 3: Firebase: lists saved online (guest account behind the scenes), offline cache, security rules
- [x] Step 4: Google login (links the guest account), Settings screen, light/dark/system theme
- [x] Step 5: sharing with invite links, live sync, multiple lists, members, leave and reset link
- [x] Step 6: budget tracker (Done shopping, monthly budget, shops, per-store totals) + themes
- [x] Step 7: installable app (PWA): icon, Add to Home screen, works offline, auto-updates
- [ ] Step 8: publish online and invite first testers

## Firebase

Project: `zestec-3af1d`. After changing `firestore.rules`, deploy them with:

```bash
npx firebase deploy --only firestore:rules
```

## Publish a new version

```bash
npm run build
npx firebase deploy --only hosting
```

Phones pick up the new version automatically the next time Zeste is opened.

## App icons

Icons are drawn in `scripts/make-icons.mjs`. After changing it, run `node scripts/make-icons.mjs`.

## Private testing

Zeste is closed: new people must enter a tester code (or open a list invite link).
This is enforced by `firestore.rules`, not just the screen.

- **Tester codes** are in `firestore.rules` → `testerCodes()`. Add or change codes there, then
  `npx firebase deploy --only firestore:rules`. Removing a code doesn't lock out people who already used it.
- **Feedback** from the in-app 💬 button lands in Firestore → `feedback` (readable only in the
  Firebase console).
- **Opening up later:** remove the testers check from `allowed()` in the rules and the access screen.

## Demo walkthrough

`public/demo/` is an animated tour built from real screenshots (English, French, Kreol), served at `/demo/`.
After changing the app, refresh the screenshots with `node scripts/demo/capture.mjs` (needs Microsoft Edge),
then build and deploy. Captions are in `public/demo/index.html`.
