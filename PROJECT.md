# Smart Grocery Notebook

> *One Zeste at a time.* (Mauritian Creole: one movement, one action at a time.)

**Status:** Pre-MVP live for testing at https://zestec-3af1d.web.app · **Last updated:** 2026-10-15
**Working name:** TBD. Candidates: Zeste, CartNote, Listly, ShopKeep (earlier list: Savr, SmartCart, BudgetBite)

This file is the single source of truth for the project. If a decision changes, update it here.

---

## 1. Vision

A grocery app that feels as simple as Google Keep, but is built for shopping. Long term it helps households:

- shop together from one shared list
- stay within a grocery budget
- waste less food and plan meals
- find better prices, with price data shared by the users themselves

**Starting market:** Mauritius (prices in MUR). Design for growth beyond Mauritius later, but don't build for it yet.

**Platform:** installable web app (PWA) for Android and iPhone; native store app later if needed.

**Primary user:** a household (couple, family, flatmates) where more than one person buys groceries. The shared list is what makes the app spread: one person invites the rest of the household.

---

## 2. Pre-MVP (Day 1): four features only

| # | Feature | Done when… |
|---|---------|------------|
| 1 | **Shared shopping list with real-time sync** | Two phones on the same list see each other's adds, edits and check-offs within a couple of seconds. The list keeps working offline and syncs when back online. |
| 2 | **Basic budget tracker** | A list can have a budget (MUR). After shopping, the user types in the amount spent. The app shows spent vs. budget for the month. |
| 3 | **Guest mode + Google login** | The app works immediately without signing in. Signing in with Google later keeps all existing lists. |
| 4 | **Dark mode** | Follows the phone's setting by default, with a manual override in Settings. |

### List basics included in feature 1
- Add an item (name, optional quantity, optional category)
- Tap an item to edit it, tick it to mark it bought, swipe to delete with **Undo**
- Bought items move to the bottom, greyed out
- Invite household members to a list with a link or short code

### Deliberately NOT in the pre-MVP
Audio cues, drag-and-drop reordering, customizable Quick Add, notifications, voice input, receipt scanning, barcode scanning, photo recognition, prices or deals, ads, premium tier.

**Why:** each one adds build time without proving the core idea. The core idea is: *do households actually use a shared grocery list with a budget?*

---

## 3. Roadmap

| Phase | Scope | Gate to move on |
|-------|-------|-----------------|
| **Pre-MVP** | The 4 features above | 20–50 real testers use it weekly |
| **Phase 2** | Categories and aisle grouping, Quick Add for frequent items, budget alerts, spending history and monthly report, **barcode scanning** | Weekly retention holds; testers ask for more |
| **Phase 3** | Pantry with expiry reminders, recipes from what you have, weekly meal plan that fills the list (needs a recipe API, e.g. Spoonacular) | Clear demand for the waste and meal-planning features |
| **Phase 4** | User-submitted prices, local deals, partnerships with Mauritian shops, store ads | **200–500 active users** to show shops |
| **Later** | Receipt scanning (OCR), AI suggestions, voice input, gamification, sustainability scores, health and fitness syncing, community, premium plan | Revenue or funding |

### Key scope decisions
- **Barcodes, not photo recognition.** Barcode scanning is reliable, free and on-device. Recognising arbitrary grocery items from photos is expensive and error-prone.
- **Manual budget entry before receipt scanning.** OCR on crumpled local receipts is hard. Prove that people care about the budget feature first.
- **Prices come from users.** Shoppers submit prices instead of the app depending on store data from day one. This also gives a concrete pitch to shops.

---

## 4. Tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| App | **Progressive Web App (PWA)**: React + TypeScript, built with Vite | Works on Android *and* iPhone, installs to the home screen, works offline. No app store needed. |
| Auth | **Firebase Auth**: anonymous (guest) + Google | Guest accounts can be *linked* to Google later without losing data |
| Database | **Cloud Firestore** | Real-time sync and built-in offline support, no custom sync code |
| Hosting | **Firebase Hosting** (free Spark plan) | MUR 0 at pre-MVP scale; new versions go live in about a minute |
| Code | **GitHub** repository | Version history and backup |

**Why a web app first:** sharing is the core feature, and sharing happens through links. A "Join our list" link sent on WhatsApp opens straight away, with no install step. It also reaches iPhone users without a Mac or Apple's USD 99/year fee.

**Native store app later:** if testers want one (or barcode scanning needs it), build a Flutter or React Native app on the *same* Firebase backend in Phase 2–3.

**Previously considered:** Flutter (strong option, but the app-store install hurts link-based sharing at this stage), FlutterFlow, React Native/Expo, other no-code builders (real-time sharing and guest upgrade too limited).

### Data model (draft)

```
users/{uid}
  displayName, photoUrl, themeMode ("system" | "light" | "dark"), createdAt

lists/{listId}
  name, ownerId, memberIds: [uid], inviteCode,
  monthlyBudget (MUR, optional), createdAt, updatedAt

lists/{listId}/items/{itemId}
  name, quantity (optional), category (optional),
  checked: bool, addedBy: uid, createdAt, updatedAt

lists/{listId}/spending/{entryId}
  amount (MUR), date, note (optional), enteredBy: uid
```

**Security rule (core):** only users in `memberIds` can read or write a list and its sub-collections.

---

## 5. Screens (pre-MVP)

1. **Welcome**: "Continue as guest" / "Sign in with Google"
2. **My lists**: all lists the user belongs to, plus a "New list" button
3. **List**: items, add bar at the bottom, tick / edit / swipe-to-delete, share button, budget summary at the top
4. **Budget**: monthly budget, "Add what I spent", spent vs. budget bar, entries this month
5. **Settings**: theme (System / Light / Dark), account (sign in with Google / sign out)

---

## 6. Monetization (not before Phase 4)

- **Users:** freemium. Free with light, non-intrusive ads; a premium tier removes ads and unlocks advanced features (to be defined later).
- **Shops:** paid placements once there's an audience to show them. Earlier idea: MUR 10,000/week minimum. **Revisit with tiers**, since small shops won't pay that without proof of results. Payments via MCB Juice locally, with Stripe as an option.

---

## 7. Validation plan

1. Use the pre-MVP in my own household.
2. Recruit 20–50 testers (friends, family, local Facebook groups) by sharing the web app link (WhatsApp works well).
3. Measure: lists created, % of lists shared with a second person, weekly active users, budget entries.
4. Ask testers: *What would make you open this every week?*

---

## 8. Costs

| Item | Cost |
|------|------|
| Firebase Auth, Firestore, Hosting (Spark plan) | Free |
| GitHub | Free |
| Custom domain (optional) | ~USD 10–15/year |
| App stores | Not needed for the pre-MVP |

---

## 9. Decision log

| Date | Decision |
|------|----------|
| 2025 | Bootstrapped solo build, no outside funding |
| 2025 | Pre-MVP limited to list + login + settings |
| 2026-10-14 | Pre-MVP = shared real-time list, manual budget, guest + Google, dark mode |
| 2026-10-14 | Barcode scanning before photo recognition; manual budget before OCR |
| 2026-10-14 | Stack: web app (PWA, React) + Firebase + GitHub; written with Claude's help. Native app deferred. |
| 2026-10-15 | Working name **Zeste**; first version published at https://zestec-3af1d.web.app |
| *open* | Final app name |
