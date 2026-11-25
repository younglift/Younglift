// Uplift visual + feel QA. Run before saying any UI work is done (see docs/ai/QUALITY.md).
//
//   npm run dev                      (in another terminal)
//   node scripts/qa.mjs              all routes, phone + desktop
//   node scripts/qa.mjs /bag /p/flow only these routes
//   BASE=https://<preview>.vercel.app node scripts/qa.mjs
//
// Needs Playwright once: npm i -D playwright && npx playwright install chromium
// Output: qa/index.html (your screenshot next to Matas's reference, per route and size)
//         qa/report.json, and a FAIL list in the terminal. Exit code 1 if anything failed.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE || 'http://localhost:3000';
const OUT = 'qa';
const REF = 'docs/design/screens/png';

// route -> reference image names (phone, desktop). null = no reference yet, still checked.
const ROUTES = {
  '/welcome': ['01-home', 'desktop-Home'],
  '/welcome/taste': ['02-taste', 'desktop-Taste'],
  '/': ['03-discover-step0', 'desktop-Discover'],
  '/m/inez': ['03-discover-step2', 'desktop-Maker'],
  '/p/necklace': ['04-product', 'desktop-Product'],
  '/p/flow': ['04-product-ring', null],
  '/explore': ['05-explore', 'desktop-Explore'],
  '/explore/jewelry': ['05-explore-results', 'desktop-Explore'],
  '/saved': ['06-saved', 'desktop-Saved'],
  '/following': ['06-following', 'desktop-Following'],
  '/messages': ['06-inbox', 'desktop-Messages'],
  '/messages/inez': ['06-chat', 'desktop-Messages'],
  '/m/inez/request': ['06-custom-request', 'desktop-Custom'],
  '/bag': ['07-bag', 'desktop-Bag'],
  '/checkout': ['07-checkout', 'desktop-Checkout'],
  '/checkout/done': ['07-thanks', 'desktop-Thanks'],
  '/account': ['08-profile', 'desktop-Profile'],
  '/sell': ['10-sell', 'desktop-Sell'],
  '/sell/apply': ['11-apply', 'desktop-Apply'],
  '/studio/welcome': ['12-approved', null],
  '/studio': ['17-studio-today', 'desktop-StudioToday'],
  '/studio/profile': ['13-studio-profile-step1', 'desktop-StudioProfile-step1'],
  '/studio/pieces': ['18-studio-pieces', 'desktop-StudioPieces'],
  '/studio/pieces/new': ['14-studio-add-piece', 'desktop-StudioAddPiece'],
  '/studio/post': ['15-studio-post', 'desktop-StudioPost'],
  '/studio/payouts': ['16-studio-payouts', 'desktop-StudioPayouts'],
  '/studio/orders': [null, 'desktop-StudioOrders'],
  '/studio/orders/o-1042': ['19-studio-order', 'desktop-StudioOrders'],
};
const SIZES = [
  { key: 'phone', width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { key: 'desktop', width: 1440, height: 900, deviceScaleFactor: 1 },
];
// Budgets. Change only with Matas's OK.
const BUDGET = { visibleBlur: 8, imagesFirstLoad: { phone: 16, desktop: 24 }, minTap: 44, minChip: 36 };

// ---------- checks that run inside the page ----------
function inPageChecks({ budget, vw, vh }) {
  const out = { fail: [], warn: [] };
  const visible = (el) => {
    const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < vh && r.left < vw
      && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.01;
  };
  const label = (el) => `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''} "${(el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 30)}"`;

  // 1. page must never scroll sideways
  if (document.documentElement.scrollWidth > vw + 1) out.fail.push(`page scrolls sideways: scrollWidth ${document.documentElement.scrollWidth} > ${vw}`);

  // 2. things sticking out past the screen edge (not inside a sideways scroller)
  const scrollsX = (el) => { for (let p = el.parentElement; p; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o === 'auto' || o === 'scroll' || o === 'hidden' || o === 'clip') return true; } return false; };
  [...document.body.querySelectorAll('*')].filter(visible).forEach((el) => {
    const r = el.getBoundingClientRect();
    if ((r.right > vw + 1 || r.left < -1) && !scrollsX(el)) out.fail.push(`sticks out of screen (${Math.round(r.left)}..${Math.round(r.right)}): ${label(el)}`);
  });

  // 3. blur is expensive: count visible backdrop-filter elements
  const blurs = [...document.querySelectorAll('*')].filter((el) => { const b = getComputedStyle(el).backdropFilter; return b && b !== 'none' && visible(el); });
  if (blurs.length > budget.visibleBlur) out.fail.push(`${blurs.length} visible backdrop-filter elements (budget ${budget.visibleBlur}): makes scrolling laggy`);
  const hiddenBlurs = [...document.querySelectorAll('*')].filter((el) => { const b = getComputedStyle(el).backdropFilter; return b && b !== 'none'; }).length - blurs.length;
  if (hiddenBlurs > 20) out.warn.push(`${hiddenBlurs} off-screen elements with backdrop-filter still in the DOM`);

  // 4. tap targets
  document.querySelectorAll('a[href],button,[role=button],[role=switch],[role=tab],input:not([type=hidden]),select,textarea,summary').forEach((el) => {
    if (!visible(el)) return;
    if (el.closest('p') && el.tagName === 'A') return; // inline text link
    const r = el.getBoundingClientRect();
    const min = el.classList.contains('chip') ? budget.minChip : budget.minTap;
    // ::after hit-area extenders count: measure the larger of the element and its ::after box
    const a = getComputedStyle(el, '::after');
    const ext = a.content !== 'none' && a.position === 'absolute' ? 16 : 0;
    if (Math.max(r.width, r.height + ext) < min || r.height + ext < min - 8) out.fail.push(`tap target ${Math.round(r.width)}x${Math.round(r.height)} < ${min}: ${label(el)}`);
  });

  // 5. fonts: maker names and titles must be Rock Salt, everything else Inter
  const hand = document.querySelector('.hand');
  const loaded = (fam) => [...document.fonts].some((f) => f.family.replace(/["']/g, '') === fam && f.status === 'loaded');
  if (hand && !loaded('Rock Salt')) out.fail.push('Rock Salt not loaded: titles fall back to a system font');
  if (!loaded('Inter')) out.fail.push('Inter not loaded (use @fontsource/inter or next/font)');

  // 6. text cut off without ellipsis
  [...document.querySelectorAll('h1,h2,h3,p,span,a,button,label')].filter(visible).forEach((el) => {
    const cs = getComputedStyle(el);
    if (el.children.length === 0 && el.scrollWidth > el.clientWidth + 1 && cs.overflow !== 'visible' && cs.textOverflow !== 'ellipsis') out.warn.push(`text clipped: ${label(el)}`);
  });

  // 7. images: no stretched or tiny-source photos
  document.querySelectorAll('img').forEach((img) => {
    if (!visible(img) || !img.complete || !img.naturalWidth) return;
    const r = img.getBoundingClientRect();
    if (img.naturalWidth < r.width * Math.min(devicePixelRatio, 2) * 0.75 && r.width > 120) out.warn.push(`blurry image (source ${img.naturalWidth}px shown at ${Math.round(r.width)}px): ${img.currentSrc.split('/').pop()}`);
    if (getComputedStyle(img).objectFit === 'fill' && Math.abs(img.naturalWidth / img.naturalHeight - r.width / r.height) > 0.05) out.fail.push(`stretched image: ${img.currentSrc.split('/').pop()}`);
  });

  // 8. glass over light photos: text on glass must stay readable (cream text on at least ~40% dark glass)
  document.querySelectorAll('.g,.gs').forEach((el) => {
    if (!visible(el)) return;
    const bg = getComputedStyle(el).backgroundColor; const m = bg.match(/rgba?\(([^)]+)\)/);
    if (m) { const a = m[1].split(',').map(Number)[3]; if (a !== undefined && a < 0.25 && !getComputedStyle(el).backgroundImage.includes('gradient')) out.warn.push(`glass too see-through (alpha ${a}): ${label(el)}`); }
  });

  // 9. interactive things need a pressed/hover state (CSS rules are checked in Node, here only cursor)
  document.querySelectorAll('button,a[href]').forEach((el) => { if (visible(el) && getComputedStyle(el).cursor !== 'pointer' && !el.disabled) out.warn.push(`no pointer cursor: ${label(el)}`); });


  // 10. optical centring: content of icon buttons, chips, pills and nav items must sit in the middle (±1px)
  document.querySelectorAll('.ic, .chip, .cta, .sec, nav a, [role=tab], button').forEach((el) => {
    if (!visible(el)) return;
    const r = el.getBoundingClientRect(); if (r.width > 260 || r.height > 72) return;
    const kids = [...el.childNodes].filter((n) => (n.nodeType === 3 && n.textContent.trim()) || (n.nodeType === 1 && getComputedStyle(n).position !== 'absolute' && n.getBoundingClientRect().width > 0));
    const textKid = kids.find((n) => n.nodeType === 3);
    if (!textKid && kids.length !== 1) return;
    if (textKid) kids.splice(0, kids.length, textKid);
    const range = document.createRange(); range.selectNodeContents(el);
    const k = kids[0].nodeType === 3 ? (() => { const rr = document.createRange(); rr.selectNode(kids[0]); return rr.getBoundingClientRect(); })() : kids[0].getBoundingClientRect();
    const cs = getComputedStyle(el); const pl = parseFloat(cs.paddingLeft), pr = parseFloat(cs.paddingRight), pt = parseFloat(cs.paddingTop), pb = parseFloat(cs.paddingBottom);
    const cx = r.left + pl + (r.width - pl - pr) / 2, cy = r.top + pt + (r.height - pt - pb) / 2;
    const dx = Math.abs((k.left + k.right) / 2 - cx), dy = Math.abs((k.top + k.bottom) / 2 - cy);
    if ((cs.justifyContent === 'center' || cs.textAlign === 'center') && dx > 1.5) out.fail.push(`off-centre ${dx.toFixed(1)}px horizontally: ${label(el)}`);
    if ((cs.alignItems === 'center' || cs.display.includes('flex')) && dy > 1.5) out.fail.push(`off-centre ${dy.toFixed(1)}px vertically: ${label(el)}`);
    if (kids[0].nodeType === 3 && /^[✕×›‹→←↓↑▲▶★☆✓+]$/.test(kids[0].textContent.trim())) out.fail.push(`text glyph used as icon "${kids[0].textContent.trim()}" (use Icon.tsx SVG): ${label(el)}`);
  });

  out.fail = [...new Set(out.fail)].slice(0, 40); out.warn = [...new Set(out.warn)].slice(0, 40);
  return out;
}

// ---------- checks on the source code ----------
function codeChecks() {
  const res = { fail: [], warn: [] };
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
  const files = ['app', 'components'].filter(fs.existsSync).flatMap(walk).filter((f) => /\.(tsx|ts|css)$/.test(f) && !f.endsWith('globals.css'));
  let inline = 0; const perFile = [];
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    const lines = src.split('\n');
    lines.forEach((l, i) => {
      if (/^\s*(\/\/|\/\*|\*)/.test(l) || /themeColor|@media print/.test(l)) return;
      if (/#[0-9a-fA-F]{3,8}\b(?![\w-])/.test(l) && /(color|background|border|fill|stroke|shadow)/i.test(l)) res.fail.push(`${f}:${i + 1} hard-coded colour (use var(--u-*))`);
      if (/rgba?\(\s*\d/.test(l) && !/var\(--/.test(l)) res.fail.push(`${f}:${i + 1} hard-coded rgba (use a --u-* token)`);
      if (/font-family:\s*['"]?(Inter|Rock Salt|Anton|Archivo)/i.test(l)) res.fail.push(`${f}:${i + 1} font named directly (use var(--u-ui) / var(--u-hand))`);
      if (/transition:\s*all/.test(l)) res.fail.push(`${f}:${i + 1} transition: all (list the properties)`);
      if (/transition[^;]*(width|height|top|left|margin|padding)/.test(l) && !/\.tg i/.test(l)) res.warn.push(`${f}:${i + 1} animates layout (use transform/opacity)`);
    });
    const n = (src.match(/style=\{\{/g) || []).length; inline += n; if (n > 5) perFile.push(`${f} (${n})`);
    if (f.endsWith('.tsx') && /<img\b/.test(src) && !/loading=/.test(src)) res.warn.push(`${f}: <img> without loading="lazy" / next/image`);
    if (/@keyframes|transition:/.test(src) && f.endsWith('.css') && !/prefers-reduced-motion/.test(src)) res.fail.push(`${f}: has motion but no prefers-reduced-motion rule`);
  }
  if (perFile.length) res.warn.push(`inline style={{}} ${inline} total; move to CSS modules: ${perFile.join(', ')}`);
  return res;
}

// ---------- run ----------
const only = process.argv.slice(2);
const routes = Object.entries(ROUTES).filter(([r]) => !only.length || only.includes(r));
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const report = { code: codeChecks(), pages: [] };
for (const size of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: size.width, height: size.height }, deviceScaleFactor: size.deviceScaleFactor, isMobile: !!size.isMobile, hasTouch: !!size.hasTouch });
  for (const [route, refs] of routes) {
    const page = await ctx.newPage();
    const errors = []; let imgs = 0; const t0 = Date.now();
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
    page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));
    page.on('request', (r) => { if (r.resourceType() === 'image') imgs++; });
    let res;
    try { res = await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 30000 }); } catch (e) { errors.push('load: ' + e.message.slice(0, 120)); }
    await page.evaluate(() => document.fonts.ready).catch(() => {});
    await page.waitForTimeout(1200);
    const loadMs = Date.now() - t0;
    const r = await page.evaluate(inPageChecks, { budget: BUDGET, vw: size.width, vh: size.height }).catch((e) => ({ fail: ['checks crashed: ' + e.message], warn: [] }));
    if (res && res.status() >= 400) r.fail.unshift(`HTTP ${res.status()}`);
    errors.forEach((e) => r.fail.push('console: ' + e));
    if (imgs > BUDGET.imagesFirstLoad[size.key]) r.fail.push(`${imgs} images loaded on open (budget ${BUDGET.imagesFirstLoad[size.key]}): lazy-load, and on desktop do not render the phone feed`);
    // pressed state: tap the first primary button and make sure it visibly moves
    const cta = await page.$('.cta:not([disabled])');
    if (cta) { const before = await cta.evaluate((e) => getComputedStyle(e).transform); await cta.hover().catch(() => {}); await page.mouse.down(); const during = await cta.evaluate((e) => getComputedStyle(e).transform); await page.mouse.up(); if (before === during) r.warn.push('primary button has no pressed state'); }
    const shot = `${size.key}${route === '/' ? '/home' : route}.png`.replace(/\//g, '__');
    await page.screenshot({ path: path.join(OUT, shot) });
    const ref = refs[size.key === 'phone' ? 0 : 1];
    report.pages.push({ route, size: size.key, shot, ref: ref ? `../${REF}/${ref}.jpg` : null, loadMs, imgs, ...r });
    await page.close();
  }
  await ctx.close();
}
await browser.close();

fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
fs.writeFileSync(path.join(OUT, 'index.html'), `<!doctype html><meta charset=utf-8><title>Uplift QA</title>
<style>body{font:14px system-ui;background:#222;color:#eee;margin:24px}section{margin:0 0 48px}.pair{display:flex;gap:16px;align-items:flex-start}.pair img{border:1px solid #555;max-width:48vw}.f{color:#ff8a80}.w{color:#ffd180}h2{margin:0 0 8px}</style>
<h1>Uplift QA ${new Date().toISOString().slice(0, 16)}</h1>
<h2>Code</h2><ul>${report.code.fail.map((x) => `<li class=f>${esc(x)}`).join('')}${report.code.warn.map((x) => `<li class=w>${esc(x)}`).join('')}</ul>
${report.pages.map((p) => `<section><h2>${p.size} ${esc(p.route)} · ${p.loadMs} ms · ${p.imgs} images</h2>
<ul>${p.fail.map((x) => `<li class=f>${esc(x)}`).join('')}${p.warn.map((x) => `<li class=w>${esc(x)}`).join('')}</ul>
<div class=pair><figure><figcaption>Built</figcaption><img src="${p.shot}"></figure>${p.ref ? `<figure><figcaption>Reference</figcaption><img src="${p.ref}"></figure>` : ''}</div></section>`).join('')}`);

let fails = report.code.fail.length;
console.log(`\nCODE: ${report.code.fail.length} fail, ${report.code.warn.length} warn`);
report.code.fail.slice(0, 30).forEach((x) => console.log('  FAIL ' + x));
for (const p of report.pages) { fails += p.fail.length; if (p.fail.length || p.warn.length) { console.log(`\n${p.size} ${p.route}: ${p.fail.length} fail, ${p.warn.length} warn`); p.fail.forEach((x) => console.log('  FAIL ' + x)); p.warn.slice(0, 8).forEach((x) => console.log('  warn ' + x)); } }
console.log(`\n${fails ? '✗' : '✓'} ${fails} failures. Open qa/index.html and compare every screenshot with its reference.`);
process.exit(fails ? 1 : 0);
