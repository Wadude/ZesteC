// Renders the demo as vertical MP4 videos (1080×1920, 30 fps), one per language,
// for WhatsApp Status, Reels and similar. Uses the screenshots from capture.mjs.
//
// Run with: node scripts/demo/video.mjs        → video/zeste-demo-en.mp4, -fr, -mfe
// Needs Microsoft Edge (or set BROWSER to Chrome's path).

import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ffmpeg from 'ffmpeg-static';

const BROWSER =
  process.env.BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const FPS = 30;
const LANGS = process.argv.slice(2).length ? process.argv.slice(2) : ['en', 'fr', 'mfe'];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Reuse the scenes and captions from the web demo, so both always match.
const scenes = readFileSync('public/demo/scenes.json', 'utf8');
const demoHtml = readFileSync('public/demo/index.html', 'utf8');
const textSource = demoHtml.slice(demoHtml.indexOf('const TEXT = '), demoHtml.indexOf('const ICONS'));

async function openBrowser(port, profile) {
  const proc = spawn(
    BROWSER,
    ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
      '--no-first-run', '--allow-file-access-from-files', 'about:blank'],
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
  // Fail instead of hanging forever if the browser stops answering (e.g. the PC went to sleep).
  const send = (method, params = {}, sessionId) =>
    new Promise((r, reject) => {
      const i = ++id;
      const timer = setTimeout(() => {
        pending.delete(i);
        reject(new Error(`Browser did not answer ${method} within 60 s`));
      }, 60000);
      pending.set(i, (msg) => {
        clearTimeout(timer);
        r(msg);
      });
      ws.send(JSON.stringify({ id: i, method, params, sessionId }));
    });
  const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank' });
  const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
  const s = (m, p) => send(m, p, sessionId);
  await s('Page.enable');
  await s('Emulation.setDeviceMetricsOverride', { width: 540, height: 960, deviceScaleFactor: 2, mobile: false });
  const js = async (expression) => {
    const r = await s('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? 'JS error');
    return r.result?.result?.value;
  };
  const shot = async () => {
    const r = await s('Page.captureScreenshot', { format: 'jpeg', quality: 92 });
    return Buffer.from(r.result.data, 'base64');
  };
  return { s, js, shot, close: async () => { await send('Browser.close').catch(() => {}); proc.kill(); } };
}

/** Opens a hidden browser on the video page, ready to draw frames for one language. */
async function openSession(lang, port, attempt) {
  const profile = join(tmpdir(), `zeste-video-${lang}-${attempt}`);
  rmSync(profile, { recursive: true, force: true });
  const b = await openBrowser(port, profile);
  await b.s('Page.navigate', { url: pathToFileURL(resolve('scripts/demo/video.html')).href });
  await wait(1500);
  await b.js(`window.SCENES = ${scenes}; window.LANG = '${lang}'; ${textSource}; window.TEXT = TEXT; true`);
  const seconds = await b.js('init()');
  const close = async () => {
    await b.close();
    await wait(1500);
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {
      // Edge still closing; Windows cleans its temp folder later.
    }
  };
  return { b, seconds, close };
}

async function render(lang, port) {
  const out = `video/zeste-demo-${lang}.mp4`;
  let attempt = 0;
  let session = await openSession(lang, port, attempt);
  const { seconds } = session;
  // MAX_FRAMES renders a quick test clip.
  const frames = Math.min(Math.ceil(seconds * FPS), Number(process.env.MAX_FRAMES) || Infinity);
  const started = Date.now();

  const enc = spawn(ffmpeg, [
    '-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '21', '-preset', 'medium',
    '-movflags', '+faststart', out,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((r) => enc.on('close', r));

  try {
    for (let f = 0; f < frames; f++) {
      let jpg;
      // Headless browsers occasionally freeze on a frame: restart and carry on from the same frame.
      for (let tries = 0; !jpg; tries++) {
        try {
          await session.b.js(`renderAt(${(f / FPS).toFixed(4)})`);
          jpg = await session.b.shot();
        } catch (e) {
          if (tries >= 3) throw e;
          console.log(`  ${lang}: browser froze at frame ${f}, restarting (${e.message})`);
          await session.close().catch(() => {});
          attempt++;
          session = await openSession(lang, port + 100 * attempt, attempt);
        }
      }
      if (!enc.stdin.write(jpg)) await new Promise((r) => enc.stdin.once('drain', r));
      if (f % 150 === 149) {
        const perFrame = (Date.now() - started) / (f + 1);
        console.log(`  ${lang}: ${Math.round(((f + 1) / frames) * 100)}% (${Math.round(perFrame)} ms/frame)`);
      }
    }
  } finally {
    enc.stdin.end();
    await session.close().catch(() => {});
  }
  const code = await done;
  if (code !== 0) throw new Error(`ffmpeg exited with ${code}`);
  console.log(`  ${lang}: ${out} (${seconds.toFixed(1)} s)`);
}

mkdirSync('video', { recursive: true });
for (const [i, lang] of LANGS.entries()) await render(lang, 9370 + i);
process.exit(0);
