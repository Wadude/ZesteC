// Captures the screenshots for the demo walkthrough (public/demo) from the live app.
// It drives a hidden Edge through the real app on a fresh demo account per language,
// with Mauritian sample data, and records where the "finger" should tap on each screen.
//
// Run with: node scripts/demo/capture.mjs
// Needs Microsoft Edge (or set BROWSER to Chrome's path).

import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const APP = 'https://zestec-3af1d.web.app';
const API_KEY = 'AIzaSyAX9wXMxLv8_NnaogCgCw_6wrgnEHgNguc';
const PROJECT = 'zestec-3af1d';
const TESTER_CODE = 'ZESTE-JRDX';
const BROWSER =
  process.env.BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const W = 390;
const H = 844;
const OUT = 'public/demo';
const LANGS = ['en', 'fr', 'mfe'];

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const DB = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const docName = (p) => `projects/${PROJECT}/databases/(default)/documents/${p}`;

// --- Sample data -------------------------------------------------------------

const now = Date.now();
const day = 86400000;
const ITEMS = [
  // name, quantity, unit, price, priceIsTotal, category
  ["Pomme d'amour", 500, 'g', 60, false, 'produce'],
  ['Lalo', 250, 'g', 80, false, 'produce'],
  ['Bananes', 6, 'pcs', 5, false, 'produce'],
  ['Baguette', 2, 'pcs', 9, false, 'bakery'],
  ['Dholl puri', 4, 'pcs', 15, false, 'bakery'],
  ['Poulet', 1, 'kg', 175, false, 'meat'],
  ['Dizef', 12, 'pcs', 7, false, 'dairy'],
  ['Lait', 1, 'L', 52, false, 'dairy'],
  ['Diri basmati', 5, 'kg', 340, true, 'pantry'],
  ['Delwil', 1, 'L', 95, false, 'pantry'],
  ['Phoenix', 6, 'pcs', 55, false, 'drinks'],
  ['Lesiv', 1, 'pack', 160, false, 'household'],
];
const TRIPS = [
  ['Winners', 1240, 3, 14],
  ['Bazar Port-Louis', 385, 8, 6],
  ['Intermart', 860, 12, 9],
];
const NEW_ITEM = { en: 'Cheese 200g', fr: 'Fromage 200g', mfe: 'Fromaz 200g' };
const TICK = ["Pomme d'amour", 'Lalo', 'Bananes', 'Baguette'];

const fields = (o) =>
  Object.fromEntries(
    Object.entries(o).map(([k, v]) => [
      k,
      typeof v === 'string'
        ? { stringValue: v }
        : typeof v === 'boolean'
          ? { booleanValue: v }
          : Number.isInteger(v)
            ? { integerValue: String(v) }
            : { doubleValue: v },
    ]),
  );

// --- Firebase helpers (for the fake partner "Priya") ----------------------------

async function newGuest() {
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"returnSecureToken":true}',
  });
  const j = await r.json();
  return { uid: j.localId, token: j.idToken };
}
const commit = (user, writes) =>
  fetch(`${DB}:commit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ writes }),
  });

async function addPartner(listId, inviteCode) {
  const p = await newGuest();
  await commit(p, [{ update: { name: docName(`testers/${p.uid}`), fields: fields({ code: TESTER_CODE }) } }]);
  await commit(p, [{ update: { name: docName(`users/${p.uid}`), fields: fields({ name: 'Priya' }) } }]);
  const res = await commit(p, [
    {
      update: { name: docName(`lists/${listId}`), fields: fields({ joinCode: inviteCode }) },
      updateMask: { fieldPaths: ['joinCode'] },
      updateTransforms: [
        { fieldPath: 'memberIds', appendMissingElements: { values: [{ stringValue: p.uid }] } },
      ],
    },
  ]);
  if (!res.ok) throw new Error(`Partner could not join: ${res.status}`);
}

// --- Browser driving (Chrome DevTools Protocol) ----------------------------------

async function openBrowser(port, profile) {
  const proc = spawn(
    BROWSER,
    [`--headless=new`, `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', 'about:blank'],
    { stdio: 'ignore' },
  );
  let version;
  for (let i = 0; i < 40 && !version; i++) {
    await wait(250);
    version = await fetch(`http://127.0.0.1:${port}/json/version`).then((r) => r.json()).catch(() => null);
  }
  const ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const pending = new Map();
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  };
  const send = (method, params = {}, sessionId) =>
    new Promise((r) => {
      const i = ++id;
      pending.set(i, r);
      ws.send(JSON.stringify({ id: i, method, params, sessionId }));
    });
  const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank' });
  const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
  const s = (m, p) => send(m, p, sessionId);
  await s('Page.enable');
  await s('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2, mobile: true });
  await s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });

  const js = async (expression) => {
    const r = await s('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? 'JS error');
    return r.result?.result?.value;
  };
  const go = async (url, ms = 6000) => {
    await s('Page.navigate', { url });
    await wait(ms);
  };
  const shot = async (file) => {
    const r = await s('Page.captureScreenshot', { format: 'webp', quality: 82 });
    writeFileSync(file, Buffer.from(r.result.data, 'base64'));
  };
  const close = async () => {
    await send('Browser.close').catch(() => {});
    proc.kill();
  };
  return { js, go, shot, close };
}

// Page-side helpers, injected into the app.
const HELPERS = `
  window.$z = {
    wait: (ms) => new Promise((r) => setTimeout(r, ms)),
    setVal(el, v) {
      const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    },
    /** Centre of an element as a fraction of the screen, for the demo's finger. */
    tap(el) {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { x: +((b.left + b.width / 2) / innerWidth).toFixed(4), y: +((b.top + b.height / 2) / innerHeight).toFixed(4) };
    },
    row(name) {
      return [...document.querySelectorAll('.row')].find((r) => r.querySelector('.name-text')?.textContent === name);
    },
    async auth() {
      const req = indexedDB.open('firebaseLocalStorageDb');
      const db = await new Promise((r) => (req.onsuccess = () => r(req.result)));
      const all = await new Promise((r) => {
        const g = db.transaction('firebaseLocalStorage').objectStore('firebaseLocalStorage').getAll();
        g.onsuccess = () => r(g.result);
      });
      const u = all.find((x) => x.fbase_key.startsWith('firebase:authUser')).value;
      return { uid: u.uid, token: u.stsTokenManager.accessToken };
    },
  };
`;

async function captureLanguage(lang, port) {
  const profile = join(tmpdir(), `zeste-demo-${lang}`);
  rmSync(profile, { recursive: true, force: true });
  const dir = `${OUT}/img/${lang}`;
  mkdirSync(dir, { recursive: true });
  const b = await openBrowser(port, profile);
  const scenes = [];
  const scene = async (id, tapExpr) => {
    const tap = tapExpr ? await b.js(`(() => { ${HELPERS}; return $z.tap(${tapExpr}); })()`) : null;
    await b.shot(`${dir}/${id}.webp`);
    scenes.push({ id, tap });
    console.log(`  ${lang} · ${id}`, tap ? `tap ${tap.x},${tap.y}` : '');
  };

  try {
    await b.go(APP, 3000);
    await b.js(`localStorage.clear(); localStorage.setItem('zeste.lang', '${lang}'); true`);
    await b.go(APP, 7000);

    // 1. Tester code (a made-up code in the picture; the real one is typed afterwards)
    await b.js(`(async () => { ${HELPERS}; $z.setVal(document.querySelector('.access-form input'), 'ZESTE-1234'); document.activeElement?.blur(); return true; })()`);
    await scene('code', `document.querySelector('.access-form button')`);
    await b.js(`(async () => { ${HELPERS}; $z.setVal(document.querySelector('.access-form input'), '${TESTER_CODE}'); await $z.wait(50); document.querySelector('.access-form').requestSubmit(); return true; })()`);
    await wait(8000);

    // Seed the demo list, budget and past shops.
    const seed = await b.js(`(async () => {
      ${HELPERS};
      const { uid, token } = await $z.auth();
      const base = 'https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents';
      const name = (p) => 'projects/${PROJECT}/databases/(default)/documents/' + p;
      const f = ${fields.toString()};
      const listId = uid;
      const writes = [];
      ${JSON.stringify(ITEMS)}.forEach(([n, q, unit, price, total, cat], i) => {
        const t = ${now} - 100000 + i * 1000;
        writes.push({ update: { name: name('lists/' + listId + '/items/demo' + i), fields: f({
          name: n, checked: false, quantity: q, unit, price, ...(total ? { priceIsTotal: true } : {}),
          category: cat, createdAt: t, order: t, addedBy: uid }) } });
      });
      ${JSON.stringify(TRIPS)}.forEach(([store, amount, daysAgo, count], i) => {
        writes.push({ update: { name: name('lists/' + listId + '/trips/demo' + i), fields: {
          ...f({ total: amount, date: ${now} - daysAgo * ${day}, store, itemCount: count, enteredBy: uid, createdAt: ${now} }),
          items: { arrayValue: { values: [] } } } } });
      });
      writes.push({ update: { name: name('lists/' + listId), fields: f({ monthlyBudget: 8000 }) },
        updateMask: { fieldPaths: ['monthlyBudget'] } });
      const res = await fetch(base + ':commit', { method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ writes }) });
      return { ok: res.ok, status: res.status, listId };
    })()`);
    if (!seed.ok) throw new Error(`Seeding failed: ${seed.status}`);

    // A second list, so the list tabs show.
    await b.js(`(async () => {
      ${HELPERS};
      document.querySelector('.list-tab.new').click(); await $z.wait(500);
      $z.setVal(document.querySelector('.sheet input'), 'Weekend'); await $z.wait(50);
      document.querySelector('.sheet form').requestSubmit(); await $z.wait(4000);
      return true;
    })()`);

    // Make an invite link and have "Priya" join, so the list is shared.
    const invite = await b.js(`(async () => {
      ${HELPERS};
      [...document.querySelectorAll('.list-tab')][0].click(); await $z.wait(1500);
      document.querySelector('.header-row .icon-button').click(); await $z.wait(600);
      navigator.share = undefined;
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => {} }, configurable: true });
      document.querySelector('.sheet .primary-button').click(); await $z.wait(5000);
      return document.querySelector('.invite-code')?.textContent;
    })()`);
    await addPartner(seed.listId, invite);
    await b.go(APP, 7000);
    await b.js(`(async () => { ${HELPERS}; [...document.querySelectorAll('.list-tab')][0]?.click(); await $z.wait(1500); scrollTo(0, 0); return true; })()`);
    await wait(1000);

    // 2. The list, sorted by aisle, with prices
    await scene('list', `document.querySelector('.add-bar input')`);

    // 3. Typing "Cheese 200g"
    await b.js(`(async () => { ${HELPERS}; $z.setVal(document.querySelector('.add-bar input'), ${JSON.stringify(NEW_ITEM[lang])}); return true; })()`);
    await wait(300);
    await scene('type', `document.querySelector('.add-bar button')`);

    // 4. It lands in the right aisle
    const newName = NEW_ITEM[lang].replace(/ ?\d+g$/, '');
    await b.js(`(async () => {
      ${HELPERS};
      document.querySelector('.add-bar').requestSubmit(); await $z.wait(1200);
      document.activeElement?.blur();
      $z.row(${JSON.stringify(newName)}).scrollIntoView({ block: 'center' }); await $z.wait(500);
      return true;
    })()`);
    await scene('added', `$z.row(${JSON.stringify(newName)}).querySelector('.name')`);

    // 5. Edit panel: quantity, price, category
    await b.js(`(async () => {
      ${HELPERS};
      $z.row(${JSON.stringify(newName)}).querySelector('.name').click(); await $z.wait(600);
      $z.setVal(document.querySelector('.sheet .price-input input'), '95'); await $z.wait(50);
      [...document.querySelectorAll('.sheet .segmented.compact button')][1].click(); await $z.wait(300);
      document.activeElement?.blur();
      return true;
    })()`);
    await scene('edit', `document.querySelector('.sheet button[type=submit]')`);

    // 6. Ticking items in the shop
    await b.js(`(async () => {
      ${HELPERS};
      document.querySelector('form.sheet').requestSubmit(); await $z.wait(800);
      for (const n of ${JSON.stringify(TICK)}) { $z.row(n)?.querySelector('.check').click(); await $z.wait(400); }
      scrollTo(0, document.body.scrollHeight); await $z.wait(600);
      return true;
    })()`);
    await scene('tick', `document.querySelector('.done-button')`);

    // 7. Done shopping
    await b.js(`(async () => {
      ${HELPERS};
      document.querySelector('.done-button').click(); await $z.wait(700);
      $z.setVal(document.querySelectorAll('.sheet input')[1], 'Winners'); await $z.wait(100);
      document.activeElement?.blur();
      return true;
    })()`);
    await scene('done', `document.querySelector('.sheet button[type=submit]')`);

    // 8. Saved, and the budget bar updates
    await b.js(`(async () => {
      ${HELPERS};
      document.querySelector('.sheet form').requestSubmit(); await $z.wait(1500);
      scrollTo(0, 0); await $z.wait(500);
      return true;
    })()`);
    await scene('saved', `document.querySelector('.budget-summary')`);

    // 9. Budget screen
    await b.js(`(async () => { ${HELPERS}; document.querySelector('.budget-summary').click(); await $z.wait(1800); return true; })()`);
    await scene('budget', `document.querySelector('.header .icon-button')`);

    // 10. Sharing
    await b.js(`(async () => {
      ${HELPERS};
      document.querySelector('.header .icon-button').click(); await $z.wait(1200);
      document.querySelector('.header-row .icon-button').click(); await $z.wait(1500);
      return true;
    })()`);
    await scene('share', null);

    // The invite code is visible in the picture: cancel it so it can't be used to get in.
    await b.js(`(async () => {
      ${HELPERS};
      const { token } = await $z.auth();
      await fetch('https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/invites/${invite}',
        { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } });
      return true;
    })()`);

    // 11. Language and colours
    await b.js(`(async () => {
      ${HELPERS};
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); await $z.wait(500);
      document.querySelector('.header-row .icon-button:last-child').click(); await $z.wait(800);
      document.querySelector('.swatch.coral').click(); await $z.wait(600);
      document.querySelector('.swatches').scrollIntoView({ block: 'center' }); await $z.wait(400);
      return true;
    })()`);
    await scene('settings', null);
  } finally {
    await b.close();
    await wait(2000);
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {
      // Edge still closing; the temp folder gets cleaned up by Windows later.
    }
  }
  return scenes;
}

const result = {};
for (const [i, lang] of LANGS.entries()) {
  console.log(`Capturing ${lang}…`);
  result[lang] = await captureLanguage(lang, 9350 + i);
}
writeFileSync(`${OUT}/scenes.json`, JSON.stringify(result, null, 2));
console.log(`Done: ${OUT}/scenes.json`);
process.exit(0);
