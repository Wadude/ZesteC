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
- [ ] Step 4: guest mode + Google login
- [ ] Step 5: sharing with invite codes and real-time sync
- [ ] Step 6: budget tracker + dark mode setting
- [ ] Step 7: installable app (PWA) and first testers

## Firebase

Project: `zestec-3af1d`. After changing `firestore.rules`, deploy them with:

```bash
npx firebase deploy --only firestore:rules
```
