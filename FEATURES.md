# Zeste: Feature inventory

Every feature from the original planning conversations (ChatGPT overview + 10 improvements, Grok MVP recap + review + monetization, Gemini synthesis), what has happened to it, and the milestone it belongs to.

**Milestones** (see [PROJECT.md](PROJECT.md) §4):
**P1** Closed test (now) · **P2** Habit & convenience · **P3** Public launch · **P4** Waste & meals · **P5** Prices & shops · **P6** Business & scale

**Status:** ✅ Done · 🗓️ Planned (milestone) · ⏸️ Parked (only if testers ask) · ❌ Dropped (reason given)

*Last reviewed: 15 October 2026*

---

## A. List & adding items

| Feature | Source | Status | Notes |
|---|---|---|---|
| Add items manually | All | ✅ | Typing "Diri 5kg", "2 eggs" also fills in quantity and unit |
| Category selector | Grok | ✅ | Automatic from the name (EN/FR/Kreol), changeable per item |
| Categorised list / aisle grouping | ChatGPT, Grok | ✅ | 11 aisles in supermarket order |
| Custom aisle order for *your* shop | Grok review | 🗓️ P2 | Reorder categories to match how you walk your usual store |
| Tap to edit | Grok | ✅ | Edit panel: name, quantity, unit, price, category |
| Checkboxes for bought items | Grok | ✅ | Ticked items move to "Bought" |
| Swipe to delete with Undo | Grok | ✅ | |
| Drag & drop reorder | Grok | ✅ | "My order" view |
| "Pin to top" | Grok review | ❌ | Drag & drop covers it |
| One-tap Checklist / Shopping mode | Grok | 🗓️ P2 | Big tick targets, screen stays awake, hides editing while in the shop |
| Quick Add buttons (customisable) | Grok | 🗓️ P2 | As **Favourites**: items you buy often, one tap to add |
| Suggested items / auto-complete while typing | Grok, ChatGPT | 🗓️ P2 | From your own past items first, then common Mauritian items |
| Smart suggestions from habits & diet | ChatGPT | 🗓️ P6 | Needs history and preferences; AI-assisted |
| Quantities and units | ChatGPT | ✅ | pcs, pack, g, kg, ml, L |
| Notes on an item (brand, size, "the cheap one") | Grok ("notes + grocery") | 🗓️ P2 | Small note line under the item |
| Audio cue on add/edit (toggleable) | Grok | 🗓️ P2 | Optional sound, off by default |
| Voice input ("add milk and eggs") | ChatGPT #5, Grok | 🗓️ P2 | Phone speech-to-text; works best on Android Chrome |
| Several lists | ChatGPT | ✅ | Tabs + "+ New list" |
| Offline use | Grok review | ✅ | Works without internet, syncs later |
| Dark mode | Grok, Gemini | ✅ | Plus 6 colour themes |

## B. Sharing & household

| Feature | Source | Status | Notes |
|---|---|---|---|
| Shared lists with real-time sync | All | ✅ | Invite link via WhatsApp/SMS |
| Members, leave list, reset link | Grok review | ✅ | |
| Show who added an item ("Added by Priya") | New | 🗓️ P2 | Data is already saved |
| Notify the household ("Priya added 3 items", "I'm at the shop") | ChatGPT, Grok | 🗓️ P2 | Push notifications (see platform notes) |
| View-only members / roles | Grok review | ⏸️ | Households usually all edit |
| Chat or comments on a shared list | Grok review | ⏸️ | Most households already have WhatsApp |
| Share recipes / meal plans with others | ChatGPT | 🗓️ P4 | With the meal features |

## C. Accounts & settings

| Feature | Source | Status | Notes |
|---|---|---|---|
| Guest mode (no sign-up) | Grok review, Gemini | ✅ | |
| Google login | Grok review, Gemini | ✅ | Keeps all lists |
| Email login | Grok | 🗓️ P3 | As an email link (no password), for people without Google |
| Apple login | Grok review | 🗓️ P3 | Needs the Apple developer membership (USD 99/yr); decide at launch |
| Account management, sign out | Grok | ✅ | |
| Delete account and data | New (privacy law) | ✅ | Shared lists handed over to another member |
| Privacy policy | Grok review (GDPR) | ✅ | EN/FR/Kreol, Mauritius Data Protection Act 2017 |
| Onboarding (first-run welcome) | ChatGPT | 🗓️ P3 | 3 short screens; the demo tour already exists |
| User profile: household size, diet, goals | ChatGPT | 🗓️ P4 | Needed for meal plans |
| Languages | Grok review (i18n) | ✅ | English, Français, Kreol Morisien |
| Currency | New | ✅ | 10 currencies, symbol only |
| Notification settings | Grok | 🗓️ P2 | Comes with notifications |

## D. Budget & spending

| Feature | Source | Status | Notes |
|---|---|---|---|
| Set a monthly budget | ChatGPT, Gemini | ✅ | Per list (shared lists share it) |
| Real-time budget tracking | ChatGPT | ✅ | Estimate of what's left to buy + spent this month |
| "Done shopping" (save a shop: amount, store, items) | New | ✅ | Pre-filled from item prices |
| Purchase history | ChatGPT | ✅ | Every shop, by month |
| Totals per store, average per shop | New | ✅ | |
| Budget warnings in the app | ChatGPT | ✅ | Bar turns amber at 80%, red when over |
| Budget alerts as notifications | ChatGPT, Grok | 🗓️ P2 | "You've used 80% of this month's budget" |
| Monthly report: spending by category, month vs month | ChatGPT, Grok | 🗓️ P2 | Includes the pie/bar chart from the Grok review |
| Suggested budget from your history ("dynamic budget") | ChatGPT #3 | 🗓️ P2 | e.g. average of the last 3 months |
| Weekly digest / progress summary | ChatGPT #8 | 🗓️ P2 | In-app card first, notification later |
| Savings tracked from deals | ChatGPT #3 | 🗓️ P5 | Needs prices/deals |
| Envelope budgets (per category) | Grok competitor review | 🗓️ P6 | Premium candidate |
| Bank sync | Grok competitor review | ❌ | No usable Mauritian bank connections; privacy-heavy |

## E. Scanning & recognition

| Feature | Source | Status | Notes |
|---|---|---|---|
| Barcode scanning | Gemini, Grok | 🗓️ P2 | Phone camera; Android first |
| Receipt scanning (OCR) with manual correction | Grok | 🗓️ P6 | "Done shopping" covers totals for now; AI image reading may make this cheaper later |
| Product photo identification | Grok | ⏸️ | Unreliable for loose items; revisit with AI image tools in P6 |

## F. Prices & deals

| Feature | Source | Status | Notes |
|---|---|---|---|
| Price per item (per kg/each/total) | ChatGPT, Grok | ✅ | |
| "Last time: Rs 45 at Winners" hint | New | 🗓️ P2 | From your own saved shops |
| Community (crowdsourced) prices | Gemini, Grok review | 🗓️ P5 | Every "Done shopping" already records item + price + store + date |
| Price comparison across nearby stores | ChatGPT #6, Grok | 🗓️ P5 | From community prices |
| Price watch list ("tell me when chicken < Rs 160/kg") | Grok competitor review | 🗓️ P5 | |
| Discount / deal alerts | ChatGPT, Grok | 🗓️ P5 | From shop partners and community |
| Store integration (API/CSV), loyalty programmes | ChatGPT, Grok | 🗓️ P5 | Partner shops upload prices/deals |
| Plan the list by store | New (your question) | ⏸️ | Add if testers split shopping across stores |
| Static average-price list | Grok review | ❌ | Community prices replace it |
| Location-based (geofenced) deal alerts | Grok review | 🗓️ P6 | Battery and privacy cost; only with clear opt-in |
| Online-store deals (Amazon, Walmart) | Grok review | ❌ | Not relevant in Mauritius |
| Cash-back | Grok competitor review | 🗓️ P6 | Only with shop partners |

## G. Waste, pantry & meals

| Feature | Source | Status | Notes |
|---|---|---|---|
| Waste-reduction tips | ChatGPT | 🗓️ P1 | As the rotating facts & tips (next) |
| Pantry: what's at home | ChatGPT #2 | 🗓️ P4 | Bought items can move to the pantry with one tap |
| Expiry reminders | ChatGPT | 🗓️ P4 | |
| Recipe database | ChatGPT | 🗓️ P4 | Including Mauritian recipes |
| Recipes from ingredients you have | ChatGPT | 🗓️ P4 | |
| Nutritional information | ChatGPT | 🗓️ P4 | From the recipe source |
| Weekly meal plan → shopping list | ChatGPT, Grok | 🗓️ P4 | |
| Dietary preferences (vegetarian, halal, low-carb…) | ChatGPT | 🗓️ P4 | |
| Cooking reminders | ChatGPT | 🗓️ P4 | |
| Hands-free recipe steps (voice) | ChatGPT #5 | 🗓️ P6 | |

## H. Health & sustainability

| Feature | Source | Status | Notes |
|---|---|---|---|
| Dietary / lifestyle goals | ChatGPT #9 | 🗓️ P6 | Builds on P4 preferences |
| Sustainability score, eco alternatives | ChatGPT #10 | 🗓️ P6 | Needs product data |
| Calorie & nutrition tracking | ChatGPT | ⏸️ | A different product; many apps already do it |
| Fitness / wearable integration | ChatGPT | ❌ | Outside Zeste's focus |

## I. Engagement

| Feature | Source | Status | Notes |
|---|---|---|---|
| Rotating facts & tips (real, sourced) | New (your idea) | 🗓️ P1 | Next up |
| Weekly digest | ChatGPT #8 | 🗓️ P2 | See D |
| Light streaks / milestones ("4 weeks on budget") | ChatGPT #4 | 🗓️ P3 | Small, positive, no points race |
| Gamification: badges, challenges ("Zero-waste month") | ChatGPT #4 | 🗓️ P6 | |
| Community forums, recipe swaps | ChatGPT | ⏸️ | Needs moderation; revisit with a real user base |

## J. Monetization & business

| Feature | Source | Status | Notes |
|---|---|---|---|
| Premium tier (advanced reports, longer history, extras) | ChatGPT, Grok | 🗓️ P6 | Define from what testers value most |
| Free tier with non-intrusive ads | Grok | 🗓️ P6 | ⚠️ The privacy page currently says "no ads": it must be updated *before* any ads |
| Ad-free trial | Grok review | 🗓️ P6 | |
| Store ad booking (fixed price per week) | Grok | 🗓️ P5 | Tiered pricing (e.g. MUR 2,500–10,000/week), not a single MUR 10,000 minimum |
| Store dashboards & campaign analytics | Grok | 🗓️ P5 | |
| Payments via MCB Juice; Stripe/PayPal option | Grok | 🗓️ P5 | |
| Hyperlocal ad targeting | Grok | 🗓️ P6 | Only with clear consent |
| Affiliate partnerships | Grok review | ⏸️ | Few relevant programmes in Mauritius |
| Smart fridge / kitchen device integration | ChatGPT | ❌ | Too niche for the market |

## K. Platform, quality & launch

| Feature | Source | Status | Notes |
|---|---|---|---|
| Works on Android and iPhone | All | ✅ | Installable web app |
| Install on home screen, works offline, auto-updates | New | ✅ | |
| Usage numbers (privacy-friendly) | Grok review (analytics) | ✅ | Owner-only stats screen |
| Error / crash reporting | Grok review | 🗓️ P1 | |
| Closed test with tester code + in-app feedback | Grok review (alpha/beta) | ✅ | |
| Demo tour + videos | New | ✅ | `/demo/`, 3 videos |
| User personas | Grok review | 🗓️ P1 | Write 2–3 from the first testers |
| Restrict the Firebase API key | New | 🗓️ P1 | |
| Final name, domain, logo | Grok, Gemini | 🗓️ P3 | Shortlist: Zeste, Savr, SmartCart, BudgetBite, Listly, CartNote, ShopKeep |
| Google Play listing (wrapped web app) | New | 🗓️ P3 | USD 25 one-time |
| Native apps / Apple App Store | Grok | 🗓️ P6 | USD 99/yr for Apple |
| Push notifications | ChatGPT, Grok | 🗓️ P2 | Needs Firebase's pay-as-you-go plan for server functions (generous free allowance) |
| End-to-end encryption of shared lists | Grok review | ❌ | Data is encrypted in transit and at rest; full E2E would block sync and sharing features |

---

## Summary

| Status | Count |
|---|---|
| ✅ Done | 32 |
| 🗓️ Planned | 62 |
| ⏸️ Parked | 7 |
| ❌ Dropped | 7 |
| **Total** | **108** |

**Planned per milestone:** P1: 5 · P2: 18 · P3: 6 · P4: 10 · P5: 9 · P6: 14. Parked items (7) come back only if testers ask.
