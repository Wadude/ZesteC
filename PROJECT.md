# Zeste: Smart Grocery Notebook

> *One Zeste at a time.* (Mauritian Creole: one movement, one action at a time.)

**Status:** Closed test live at https://zestec-3af1d.web.app (tester code needed) · tour at `/demo/` · **Last updated:** 2026-10-15
**Working name:** Zeste (final name still open)

This file is the single source of truth for the project. If a decision changes, update it here.

---

## 1. Where we want to be (vision)

The everyday grocery companion for Mauritian households. It's as simple as a notes app, but built for shopping. It helps households:

1. **shop together** from one shared, always-up-to-date list
2. **stay on budget**, knowing what each shop and each store costs
3. **waste less** by knowing what's at home and planning meals
4. **pay less** through prices shared by the community, and deals from local shops

**Market:** Mauritius first (Rs, English/French/Kreol, local items and shops), built so it can grow beyond.
**Primary user:** a household where more than one person buys groceries. Sharing is what makes Zeste spread.
**Business (later):** free for households; premium extras; paid placements for shops once there's an audience.

---

## 2. Where we are (built and live)

| Area | What works today |
|------|------------------|
| **Lists** | Add items fast ("Diri 5kg", "2 eggs" fill in quantity and unit), tick, edit, swipe/✕ delete with Undo, drag to reorder ("My order") |
| **Categories** | 11 aisles in supermarket order, guessed automatically from English/French/Kreol names (local items included), changeable per item |
| **Quantities & prices** | pcs, pack, g, kg, ml, L; price per unit or total; line totals; estimated total of what's left to buy |
| **Several lists** | Tabs to switch, quick "+ New list", rename, delete |
| **Sharing** | Invite link via WhatsApp/SMS, live sync between phones, member list, leave, reset link |
| **Budget** | Monthly budget per list, "Done shopping" saves each shop (amount, store, date, items), progress bar (amber at 80%, red when over), per-store totals, average per shop, past months, manual/edit/delete shops |
| **Accounts** | Starts as guest instantly; Google sign-in keeps everything; works across devices |
| **Personal** | English / Français / Kreol Morisien; 6 colour themes (Green, Lagoon, Coral × light/dark); currency symbol (10 currencies) |
| **App** | Installable (home-screen icon), works offline and syncs later, auto-updates |
| **Closed test** | Tester code (enforced by the database rules); invite links let partners in; in-app feedback (🐞/💡/💬) readable in the Firebase console |
| **Showing it** | Animated tour in 3 languages at `/demo/`; vertical videos (EN/FR/Kreol) for WhatsApp/Reels |

Pulled forward from later phases: categories and aisle grouping, prices, spending history per month and store, multiple lists, languages, themes, currency.

---

## 3. Gaps to close before opening to the public

| Gap | Why it matters |
|-----|----------------|
| **Usage numbers** (privacy-friendly) | We can't yet measure the success questions: do people come back weekly, share lists, use Done shopping? |
| **Privacy policy + delete my account/data** | Required by Mauritius' Data Protection Act 2017, by Google sign-in for public apps, and by app stores |
| **Kreol wording check** | Written by Claude using the standard spelling; needs a native speaker's pass |
| **Restrict the API key** to the app's web addresses | Reduces abuse of the Firebase project |
| **Final name + domain** (e.g. a `.mu` domain) | Branding before any public push |
| **Error reporting** | See crashes testers don't report |

---

## 4. Roadmap: step by step

Each step ends with something testers can use. Order within a phase is decided by tester feedback.

**Every individual feature** from the original plans, with its status and milestone, is in [FEATURES.md](FEATURES.md).

| Phase | What | Gate to move on |
|-------|------|-----------------|
| **1. Closed test** *(now, 2–4 weeks)* | 20–50 testers, fix what they hit, add usage numbers, Kreol check, privacy page + account deletion, restrict API key | Testers use it weekly; ≥ 30% of lists shared; Done shopping used |
| **2. Habit & convenience** | Favourites / Quick Add from items bought often; "last time: Rs 45 at Winners" price hint; repeat a past shop or saved list ("weekly basics"); budget alerts (notifications); monthly report (spending by category and store, month vs month); **barcode scanning**; optional "plan by store" grouping if testers split shops | Weekly retention holds; testers ask for more |
| **3. Public launch** | Final name & domain, remove the tester gate (open beta), Google Play listing (the web app wrapped as an app; USD 25 one-time), simple landing page using the tour | 200–500 active households |
| **4. Waste & meals** | Pantry (what's at home) with expiry reminders; recipes from what you have; weekly meal plan that fills the list (recipe API, e.g. Spoonacular) | Clear demand for waste/meal features |
| **5. Prices & shops** | Community prices from "Done shopping" (Zeste already records item, price, store, date); compare prices across stores; deals; partnerships and paid placements for Mauritian shops (tiered pricing, MCB Juice) | Enough price data and users to show shops |
| **6. Business & scale** | Premium tier (e.g. advanced reports, unlimited history, extra themes); native apps if needed; receipt scanning (OCR); voice input; smart suggestions (AI); gamification; sustainability scores | Revenue or funding |

### Key scope decisions
- **Barcodes, not photo recognition.** Reliable, free, on-device. Photo recognition of loose items is expensive and error-prone.
- **Manual "Done shopping" before receipt scanning.** OCR on crumpled local receipts is hard; the manual flow already gives totals per shop.
- **Prices come from users.** Every Done shopping already records prices by store, which becomes the price-comparison data in Phase 5 with no extra effort for users.
- **Web app first.** Links open instantly on any phone, which is how sharing spreads. Wrap it for Google Play at launch; native only if a feature needs it.

---

## 5. Tech stack

| Layer | Choice |
|-------|--------|
| App | Progressive Web App: React + TypeScript + Vite, `vite-plugin-pwa` (offline + updates) |
| Auth | Firebase Auth: anonymous guest, linked to Google later |
| Database | Cloud Firestore with offline cache; security rules in `firestore.rules` |
| Hosting | Firebase Hosting (free plan) |
| Code | GitHub (private): https://github.com/Wadude/ZesteC |
| Demo | `scripts/demo/capture.mjs` (screenshots), `public/demo/` (tour), `scripts/demo/video.mjs` (videos) |

### Data model

```
testers/{uid}            code, joinedAt                    (closed test)
users/{uid}              name, photoURL                     (shown to list members)
invites/{code}           listId, createdBy
lists/{listId}           name, ownerId, memberIds[], inviteCode, monthlyBudget
lists/{id}/items/{id}    name, checked, quantity, unit, price, priceIsTotal, category,
                         order, createdAt, addedBy
lists/{id}/trips/{id}    total, date, store, itemCount, items[], enteredBy
feedback/{id}            kind, message, uid, screen, lang, appVersion, device
```

Language, theme, colour, currency and sort order are per-device settings.

---

## 6. Costs today

| Item | Cost |
|------|------|
| Firebase (Auth, Firestore, Hosting, free plan) | Free (comfortable for hundreds of households) |
| GitHub | Free |
| Domain (later) | ~Rs 500–1,500/year |
| Google Play (at launch) | USD 25 one-time |

---

## 7. Decision log

| Date | Decision |
|------|----------|
| 2025 | Bootstrapped solo build, no outside funding |
| 2026-10-14 | Pre-MVP = shared real-time list, manual budget, guest + Google, dark mode |
| 2026-10-14 | Stack: web app (PWA, React) + Firebase + GitHub, written with Claude's help |
| 2026-10-14 | Barcode before photo recognition; manual budget before OCR |
| 2026-10-15 | Working name **Zeste**; published at https://zestec-3af1d.web.app |
| 2026-10-15 | Added: prices, categories, multiple lists, languages (EN/FR/Kreol), themes, currency, full budget tracker |
| 2026-10-15 | Closed test with tester code (rules-enforced) + in-app feedback; demo tour and videos |
| 2026-10-16 | Bottom tabs (Lists · Budget · + · Household · Settings) and one + for all adding |
| 2026-10-16 | **Next update: Recipes** (confidential until launch). 3–5 local chefs, photos shot in-house, every recipe in EN/FR/Kreol, tags Halal · Vegetarian · "Dan 1 Zeste", cost per serving, "add ingredients to my list". Recipes replaces Household in the tab bar (Household moves into Settings/list) |
| *open* | Final app name and domain |
