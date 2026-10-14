# Zeste

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
