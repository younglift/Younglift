# Fixes: what is still wrong on the live site (2026-11-24)

> **All new rules in one place (with pictures): `docs/design/DISCOVER.md`.** P6.10, P7, P8 and P9 below are the tasks for it.

Matas tested https://younglift-delta.vercel.app on phone and desktop. His words: "cheap, laggy, clunky, half of it slides around, colours change". Below is every concrete cause found in the code and in the live site, with where it is, how to fix it and how to prove it is fixed. Checked against `main` at 94585d3.

How to work through it: one group per PR, highest first. After each fix run the loop in `docs/ai/QUALITY.md` (qa script + look at screenshots + use it by hand). Tick the box only when the "Proof" line is true. Visual choices marked **(Matas)** need his OK before you change the token.

---

## P1. Laggy

- [x] **1.1 Phone feed is rendered on desktop.** `app/(site)/page.tsx` renders `<div className={s.feed}>` (all makers, all photos) **and** `<DeskStage>`; the feed is only `display:none` at ≥820px, so every photo still downloads and every glass card still exists. Live: 93 images on open, 77 of them hidden.
  Fix: a `useIsDesktop()` hook (matchMedia `(min-width:820px)`, SSR default phone) and render only one of the two.
  Proof: qa on `/` desktop shows ≤ 24 images; phone ≤ 16.
- [x] **1.2 Too many blurs.** Live: 85 elements with `backdrop-filter` in the DOM, 10 visible at once. Every `.gs` chip, pill and nav item blurs.
  Fix: `.gs` gets no backdrop-filter (solid `--u-glass-sm`, maybe a bit darker **(Matas)**); only `.g` cards/sheets/bars blur. In the feed only the current and next maker render `.g`.
  Proof: qa "visible backdrop-filter" ≤ 8 on every route; Discover swipe smooth at 4× CPU slowdown.
- [x] **1.3 No lazy images.** 0 `loading="lazy"` in the codebase, no `next/image`. qa lists 34 files.
  Fix: `components/u/Img.tsx` wrapper (`loading="lazy" decoding="async"`, `fetchPriority="high"` only for the first photo of the first maker), use it everywhere.
  Proof: qa code warn for `<img>` is gone; image counts within budget.
- [x] **1.4 Heavy files.** Stickers PNG 100–220 KB each (`public/stickers/`), photos full size used as 64px thumbs, `Wash` blurs a full-size photo.
  Fix: WebP stickers ≤ 40 KB, thumb-size copies of photos (or next/image sizes), `Wash` uses a 64px-wide version.
  Proof: Network tab total transfer on `/` under 2 MB.
- [x] **1.5 Wash per screen jumps.** `Wash` swaps `src` instantly when the maker changes, so the whole screen colour flips.
  Fix: keep two layers and cross-fade opacity 300ms; change only per maker, not per photo.
  Proof: swipe between makers: background fades, never flashes.

## P2. "Half of it slides around"

- [x] **2.1 Desktop thumbs / Up next rows overflow without snap.** Live: thumbs row 56px wider than its box, stops at random positions. `.upnextList` in `discover.module.css` has `overflow-x:auto` but no snap.
  Fix: every horizontal row: `scroll-snap-type:x mandatory`, items `scroll-snap-align:start`, `scroll-padding-inline` = margin; if the row fits, no scroll.
  Proof: QUALITY 2.5 by hand at 390 and 1440; qa no "sticks out".
- [x] **2.2 Peek shows the portrait instead of the next panel.** `discover.module.css` line 9: `.photo img{position:absolute;inset:0}` overrides `.peek{left:100%}` (same specificity, comes first but `inset` resets left). So the hint nudge reveals her portrait sitting on top of the piece.
  Fix: `.photo img.peek{left:100%;right:auto}` (or move `.peek` out of `.photo`).
  Proof: first-visit hint on phone shows the edge of the next panel, piece photo stays visible.
- [x] **2.3 Chips rows, "More from", boards, Explore categories**: same snap rule as 2.1. Check each at 390.
- [x] **2.4 Body scrolls behind open sheets** (filter, bag drawer, product window). Lock body scroll while open.

## P3. Clunky (no feedback, no motion)

- [x] **3.1 Only `.cta` and `.tg` have transitions** (4 transitions in all CSS). Glass buttons, chips, cards, thumbs, rows, hearts have no pressed or hover state.
  Fix: add motion tokens (`--u-dur-press:120ms`, `--u-dur-ui:180ms`, `--u-dur-panel:260ms`, `--u-dur-step:300ms`, `--u-ease:cubic-bezier(.2,.8,.2,1)`) to `globals.css` **(Matas: names/values)**, then in `u.css`: `:active{transform:scale(.97)}` for `.gs`, `.chip`, `.ic`, cards with links; hover lighten on desktop.
  Proof: qa "no pressed state" warns gone; by hand every tap moves.
- [x] **3.2 Steps cut hard.** Discover piece → story → profile on desktop (`DeskStage` `step` state), Studio profile steps 1–5, checkout. Content just swaps.
  Fix: 24px slide + fade 300ms, reduced-motion = fade only.
- [x] **3.3 Sheets/drawers appear without sliding.** Fix as QUALITY 2.4.
- [x] **3.4 First "Add to bag" tap is lost before hydration** (live, phone, fresh load). Fix: render the button disabled until mounted, or handle with a form action.
- [x] **3.5 "In your bag ✓" is a dead end.** It should open the bag (or the drawer on desktop). Toast (`components/u/Toast.tsx`, 3.2s) should carry "View bag".
- [x] **3.6 Disabled CTA looks active** in places that style it inline (checkout `style={{flex:1}}` buttons). Use the `.cta:disabled` look from `u.css` and write the reason next to it.

## P4. Cheap look (layout and consistency)

- [x] **4.1 420 inline `style={{}}` objects.** Worst: `studio/profile/page.tsx` 31, `checkout/page.tsx` 31, `account/page.tsx` 22, `studio/pieces/Editor.tsx` 20, `studio/page.tsx` 19, `(site)/page.tsx` 18. Each has its own font sizes and gaps (13px here, 12 there, 18px gap), which is why the screens don't line up.
  Fix: move to CSS modules using the 4/8 spacing and the type sizes in QUALITY 2.1–2.2. Do it screen by screen against the reference PNG.
  Proof: inline count per file ≤ 5 (qa), screenshot matches reference.
- [x] **4.2 Glass goes pale over light photos** (white plates, cream ceramics). Text loses contrast and the screen "changes colour". Cause: `--u-glass` is 28–42% dark; over white it reads as grey.
  Fix **(Matas)**: darker glass (e.g. 55/40%) or a darker `--u-bg` under the wash; check every screen over the lightest photo.
- [x] **4.3 Two stickers per frame + a chip saying the same.** Discover uses `.stk` and `.stk2`; product tags add "1 of 1" again. Rule: one badge per frame (QUALITY 2.8).
- [x] **4.4 "Made to size" vs "Made to order".** `(site)/page.tsx` line 20 and `p/[id]/page.tsx` line 32 say "Made to size" for sized pieces; Studio and filters say "Made to order". Pick one word everywhere **(Matas)**: design uses "Made to order".
- [x] **4.5 Long titles wrap to 2+ lines and push the card.** Clamp to 2 lines with ellipsis.
- [x] **4.6 Desktop stage photo cropped and soft** (`object-fit:cover` on a 1392px stage with portrait photos). Use a contain + blurred backdrop for portrait photos, or a wider crop source.
- [x] **4.7 Desktop Home doesn't match `desktop-Home.jpg`.** Compare and rebuild.
- [x] **4.8 Single-photo pieces still show a dot.** Hide dots/arrows when there is one photo.

## P5. Copy and honesty

- [x] **5.1** `components/u/BagView.tsx` line 49: "Your 1 of 1 pieces are held" → "Your piece is held" / "Your 2 pieces are held" (plural by count).
- [x] **5.2 Timer shown twice in the bag, missing in checkout.** One timer per screen, and keep it in checkout.
- [x] **5.3 Apple Pay on Android** (`checkout/page.tsx` line 73). Show by platform (Payment Request API), card always.
- [x] **5.4 Mock data inconsistent** (same piece with different prices/stock across screens, counts that don't add up). Check QUALITY 2.9 on every screen.
- [x] **5.5 Studio: Publish only at the bottom of a long form.** Sticky bottom bar with Publish; chips 36px and toggles 28px need their 44px hit area (`u.css` has it, inline overrides remove it in places).

- [x] **5.6 Rezervacija visiems kūriniams su ribotu kiekiu, ne tik 1 of 1** (nuspręsta 2026-11-24, spec `docs/design/HANDOFF-07.md` „15 min rezervacija“, ekranai `07-bag`, `desktop/07-bag-drawer`, `desktop/07-checkout`).
  Fix: `lib/data/mock.ts` hold kurti kiekvienam ne made-to-order kūriniui su `qty`; laisvas kiekis = stock − kitų holds; `components/u/BagView.tsx` tekstai („When you add a piece, we hold it for you for 15 minutes.“ tuščiame krepšelyje) „Your pieces are held for …“ ir „Held for you · mm:ss“ prie kiekvienos rezervuotos eilutės; laikmatis checkout'e; Supabase `cart_holds.qty`.
  Proof: įdėk Morning cup (ne 1 of 1) → krepšelyje „Held for you“; antroje naršyklėje to paties kūrinio laisvas kiekis sumažėjo; made-to-order žiedas be laikmačio.

## P6. Matas's phone test, 2026-11-25 (iPhone, Safari)

Screenshots were taken on an iPhone in Safari with the toolbar at the bottom. Test every item there too (or Playwright `devices['iPhone 15 Pro']`), not only at 390×844 in desktop Chrome.

- [x] **6.1 Background stops short.** On Thanks, Checkout, Bag, Account, Following, Explore results the lighter blurred photo is a rectangle that ends ~85% across and above the bottom bar, so the right edge and bottom are a flat darker band ("cut corner"). Started after ce532bd (baked wash). Likely causes: `.u-wash` rendered inside `.u-page` (`.u-page > .u-wash`) under an ancestor with a transform/animation (`.u-step-in`, page transitions), so `position:fixed` is relative to that box; or the baked `/img/w/` copy box not covering. Fix: render `Wash` once at layout level, outside any transformed element; image `inset:-60px` with `object-fit:cover`; height `100lvh` so it also covers under Safari's toolbar.
  Proof: iPhone Safari, toolbar shown and hidden, scroll to bottom: the photo tint covers the whole screen edge to edge on every route.
- [x] **6.2 Following: selected maker ring is cut at the top.** The scroll row clips the 3px ring + outline. Fix: vertical padding on the row (≥ 6px) or draw the ring inside the circle (`box-shadow: inset`). Also check "All" ring.
- [x] **6.3 Saved boards look broken.** Cover photo fills only part of the tile, the selected yellow border is clipped, the "Board name" input's top border is clipped. Rebuild boards like Pinterest: tile = 2×2 collage of the first 4 photos (1 photo = full, 2 = halves, 3 = one big + two small), `object-fit:cover`, rounded 20px, name under it (600 15px), "N pieces" meta under that; selected = butter outline drawn with `outline-offset:-3px` so nothing clips; "New board" opens a sheet with the name field, not an inline input in the scroll row.
  Proof: screenshot of Saved with 0, 1, 2, 3, 4+ pieces per board, nothing clipped.
- [x] **6.4 "Next maker" bar at the end of a maker** (`components/u/MakerProfile.tsx` ~118): label and name run together ("Next makerOna"), Rock Salt wraps to 2 lines and the block is not centred. Fix: two lines stacked: "Next maker" (meta, mute) above, name only in Rock Salt 18px one line with ellipsis; category goes to the meta line ("Next maker · Art & prints"); avatar 44px, "Scroll ↓" right, everything vertically centred, bar min-height 72px.
- [x] **6.5 The floating "L" profile circle** sits top-right over every page and overlaps headers (Bag, Saved, Following, Explore). Pick one place: in the page header row (same 44px as the back button, aligned with the title), never floating over content.
- [x] **6.6 Content hidden behind bottom bars.** Checkout: "Pay 132,90€" bar covers the name/phone fields and the gift section. Account: review stars sit under the nav. Fix: page bottom padding = bar height + 12px + safe area (QUALITY 2.1), and the field in focus scrolls above the bar.
- [x] **6.7 Bag copy:** "Hold ended, still available ·" ends with a dangling dot. Should be "Hold ended · still available" and the "Hold again" link on the same line if it fits.
- [x] **6.8 Thin strip of the next panel** shows on the right edge of Discover on phone (~2px). Panels must be exactly 100% wide with no gap/rounding (`width:100%` of the scroller, not `100vw`).
- [x] **6.9 Low-resolution photos look soft** (`public/img/pink-necklace.jpg` 335px, `morning-cup.jpg` 406, `twist-vase.jpg` 440, `flower-hood.jpg` 472, `crochet-detail(s).jpg` ~380). Matas's side will replace them with ≥1200px versions; do not upscale in code. Keep the same file names.

- [x] **6.10 Off-centre icons and labels everywhere** (Matas: "very often things are not in the middle"). 128 text-glyph icons in `app/` and `components/` (`✕ › ↓ ▲ ★ ✓ …` used as button content) sit off-centre because font glyphs have uneven side bearings. Bottom nav labels sit 4px above centre because the active dot is in the flow under the text.
  Fix: one `components/u/Icon.tsx` with SVG icons (close, back, chevron, arrow-down, play, star, check, plus, bag, save, search, message); replace every glyph inside buttons/chips/circles; nav dot absolute; nav labels `space-evenly` (see QUALITY 2.1 "optically centred"). Reference for the nav: `docs/design/screens/png/03-discover-v3-pieces.jpg`.
  Proof: `node scripts/qa.mjs` reports 0 "off-centre" on every route at 390 and 1440.

## P7. Desktop Discover v2 (Matas decided 2026-11-25)

- [x] **7.1 Rebuild desktop Discover (≥ 820px) as "one piece".** Spec: `docs/design/screens/desktop/03-discover.dc.html`, reference `docs/design/screens/png/desktop-Discover.jpg` (rendered with real Rock Salt).
  - Left: one big photo of the current piece only, `object-fit:cover`, radius `--u-r-card`, no glass over it except the sticker (one), ← → buttons and dots for **this piece's photos only**.
  - Right: 400px `.g` card: maker row (avatar 52, name Rock Salt 22, city · category · rating, Follow) → divider → title (Rock Salt 26) + price → meta → Add to bag + save → "Watch Inez at work" video row (92×60 thumb, opens her story) → "More from Inez" 4 thumbs (click = that piece becomes the big one) + "Her profile →" → spacer → "Next maker · Ceramics / Mara · Scroll ↓" pinned at the bottom.
  - Wheel / ↓ / swipe = next maker (as now). ← → keys = this piece's photos.
  - **Changed 2026-11-25 (Justinas):** desktop Discover now scrolls freely like a normal shop (no snap, no one-gesture-one-maker). Keep that in v2 unless both founders decide otherwise.
  - Removed on desktop: the 3-panel sideways strip (piece → video → profile) and the floating glass card over the photo. Phone stays as it is until the phone navigation decision.
  - Proof: qa at 1440×900 and 1280×800 next to the reference; nothing covers the product photo; title and maker name in Rock Salt.

## P8. New photos (Matas, 2026-11-25) — merged 2026-11-25

19 new photos made with Higgsfield (all 1792×2240, saved at 1200px). They replace every soft/low-res photo (FIXES 6.9), give Ula and Ona their own portraits (Ona was using Inez's bench photo), and give most pieces 2–3 photos so the gallery arrows/dots on desktop Discover (P7) and product pages have something to show. The branch already has `lib/data/mock-data.ts` pointing at the new files, but the files themselves are not in the repo yet (Matas's machine can't download them).

- [x] **8.1** `git checkout matas/new-photos && git merge main`, then `npm i -D sharp` (if missing), `node scripts/fetch-photos.mjs`, `node scripts/optimize-images.cjs`. Commit the new `public/img/*.jpg`, `public/img/t/`, `public/img/w/`.
- [x] **8.2** Check every photo once: open `/p/necklace`, `/p/flow`, `/p/fold`, `/p/soft`, `/p/earrings`, `/p/bracelet`, `/p/plates`, `/p/cup`, `/p/hood`, `/p/cardigan`, `/p/wallet`, `/p/lake`, `/m/ula`, `/m/ona` at 390 and 1440. Every photo sharp, no 404, galleries show 2–3 photos, the first photo is always the product itself.
- [x] **8.3** `node scripts/qa.mjs` clean, then merge the branch into main.
- Done 2026-11-25: 19 photos downloaded (1200px), /t/ and /w/ copies made, 14 routes checked at 390 and 1440 (no 404, product first, 2–4 photos per piece except stack, dish, candle, table with 1). Still under 1000px and not replaced: flow-ring 670, soft-loop 660, fold-ring 740, ripple-bowl 725/780, the rest 880–960.
- Note: `vase` is a draft piece; its new photo replaces the old file name, nothing else changes.

## P9. Phone Discover v3 (Matas decided 2026-11-25) — replaces the current phone Discover

Spec: `docs/design/screens/03-discover-v3.dc.html`. References (real Rock Salt): `docs/design/screens/png/03-discover-v3-pieces.jpg`, `-details.jpg`, `-story.jpg`, `-about.jpg`. Built from proven patterns (TikTok feed, Instagram/Tinder tap-to-browse, Depop/Vinted "more from this seller", NN/g sheet rules). Do not add anything that is not in the reference. Copy stays exactly as in the reference.

**Gestures (the whole logic, nothing else):**
- Swipe **up/down** = next/previous maker (snap, one maker per swipe, `scroll-snap-stop: always`).
- Swipe **sideways** = deeper into the same maker: 1 Pieces → 2 Her story → 3 All about her (snap per panel). Discover is a root tab, so there is no edge-swipe-back conflict here.
- **Tap** a small piece = it becomes the big piece (photo, title, price, sticker, details all switch; 250ms cross-fade). Stays on panel 1.
- **Tap** the title in the bar = piece details open (full-height page sliding up, ✕ top-right, Back/edge-swipe and swipe-down close it, returns to the exact same state).
- **Tap** avatar/name = jump to panel 3.
- "Add to bag" never moves the user anywhere (no auto-scroll, no navigation): button → "In your bag ✓", bag count pops.

**Layout, phone 390×844 (all from the page edge, one 16px grid, nothing else may be off it):**
- Side margin **16px** for every element: tabs, maker row, sticker, bar, thumbs, next line, profile panel, details page.
- Top: tabs row "Pieces · Her story · All about her" at top 16, active = 600 weight + 2px butter underline; maker row 12px below (avatar 40, name Rock Salt 17, meta 12, Follow pill 40px high).
- Bottom stack (from the bottom): nav 12–66 → **12** → next line 16px high ("↓ Next: *Mara* · 1 of 1 pottery", name in Rock Salt) → **12** → thumbs row 72px high (**4 equal columns**, 8px gaps, exactly as wide as the bar, radius 14, selected = 2px butter outline offset 2) → **10** → bar 64px high (glass, radius 22, title Rock Salt 16 one line + ellipsis, "price · details" 12px, Add to bag 46px).
- Sticker: right 16, top 128, 104px wide, rotate 6°.
- Hint "Swipe ← to meet her" only for first-time users, once, right 16.
- Details page: photo 420px, padding 16, title Rock Salt 22 + price 20/600, Add to bag 48 + save 48, facts rows 14px with 1px line, "Made by …" row.
- Story panel: full-bleed video poster, play 76px centre, quote 18px at bottom 96, "Swipe ← all about her".
- About panel: avatar 72, name Rock Salt 24, Follow + Message 44px, 3 stat tiles, "All pieces" 2-column grid, review, "Up next" card at the end.

- **Update 2026-11-25 11:45 (Matas):**
  - Tabs "Pieces · Her story · All about her" are **centred** at the top, like TikTok.
  - Thumbs: 4 tiles exactly equal, equal 8px gaps, row edges = bar edges. Selected = 2px butter ring drawn **inside** the tile (image scales to 90%), so no tile looks bigger or shifted.
  - **No hint texts** ("Swipe ← …" removed everywhere). Instead, first visit only: 1.2s after Discover opens, the panels do a small bounce to the left (−64px, back, −18px, back, 1.6s) so the next panel peeks out. Reduced motion: no bounce.
  - **No ellipsis on titles, ever.** The full title always shows on one line in the bar (Rock Salt 16). Studio "Add piece" title field gets a hard limit of **20 characters** with a live counter ("19/20"); existing longer titles must be shortened in the data. Second line in the bar is only "68€ · Details ›".
  - Bottom nav: 5 equal columns inside the pill with 6px inner padding, every label centred in its column; the pill uses the same 16px side margin as everything else.

- **Product safe zone (Matas, 2026-11-25 11:50).** The piece must never sit under the glass bar/thumbs at the bottom or the tabs/maker row at the top. Reference with the zone drawn: `docs/design/screens/png/03-discover-v3-safe-zone.jpg`.
  - Tokens in `app/globals.css`: `--u-safe-top:104px` (below the maker row) and `--u-safe-bottom:262px` (above the bar). Safe zone = x 16–374, y 104–582 on 390×844.
  - The photo is full width, `object-fit:cover`, and shifted up by `(--u-safe-top − --u-safe-bottom) / 2` (−79px) so its centre sits in the centre of the safe zone. The strip this uncovers at the bottom (behind the bar, thumbs and nav) shows the same photo blurred (28px, brightness .7), and the sharp photo fades into it over its last 18% (`mask-image`), so there is no hard edge.
  - Studio "Add piece" photo step: show this dashed safe-zone frame over the preview and let the maker drag the photo to set a focal point (`images[].focusY`, 0–1, default .5). Discover uses `focusY` instead of the plain centre when present. Copy under the preview: "Keep your piece inside the frame."
  - Same rule for any future screen that puts UI over a product photo: nothing important of the product outside `--u-safe-*`.

- [x] **9.1** Build it. Data from `@/lib/data` (pieces of the maker, first = the one Discover picked). Replaces the phone feed in `app/(site)/page.tsx`; desktop stays P7.
- [x] **9.2** Proof: screenshots at 390×844 and iPhone Safari next to the four references; every left edge at x=16 and right edge at x=374 (qa: no element between 0–15 or 375–390 except full-bleed photos); thumbs row and bar the same width; tap a thumb → everything switches; details open/close returns to the same piece and photo; sideways snaps per panel; up/down snaps per maker.

## P10. Phone Discover v3 after Matas's iPhone test (Matas, 2026-11-25 17:00)

Matas tested P9 on his iPhone (Safari, toolbar shown). Everything else is fixed; these four are left. Full values are also in `docs/design/DISCOVER.md` (1.2, 1.4, 1.5).

- [x] **10.1 Sideways swipe feels like jumping to another page.** Cause: each panel (Pieces / Her story / All about her) is its own full screen with its own photo, its own tabs and its own maker row (`phone_pan` inside `phone_lay`), so mid-swipe you see two different screens with a hard seam and the tabs + Follow pill slide away and duplicate.
  Fix:
  - Tabs, maker row and nav = one fixed layer per maker above the panels. Only the panel content moves.
  - Tab underline x/width interpolated from `scrollLeft / panelWidth` on every frame.
  - Parallax: leaving panel at 0.3× speed + black overlay 0 → .4; incoming panel has `box-shadow: -12px 0 24px rgb(0 0 0 / .35)` on its leading edge.
  - Keep native snap (`x mandatory`, `snap-stop: always`). `transform`/`opacity` only. Reduced motion: plain snap.
  Proof: screen-record a slow swipe on iPhone Safari; tabs, avatar, name and Follow do not move at any frame; underline glides with the finger; no hard vertical edge between two photos.
- [x] **10.2 Product still outside the safe zone** (granny bag and flower hood go under the bar; necklace beads touch it). Cause: the photo is `cover` over the full screen height, so a 4:5 photo is scaled ~1.7× and big pieces fill the whole screen.
  Fix (replaces the −79px shift and `focusY`):
  - Zone box: `position:absolute; top:var(--u-safe-top); bottom:var(--u-safe-bottom); left:0; right:0; display:grid; place-items:center`.
  - Sharp photo inside it: `width: min(100%, (zoneHeight) * .8); aspect-ratio: 4/5; object-fit: cover`, where zoneHeight = panel height − safe-top − safe-bottom (390×844 → 390×488 at y 100–588).
  - Behind it: the same photo `cover` over the whole panel, `filter: blur(28px) brightness(.7)`, `inset:-40px`.
  - Sharp photo fades into the blur over 24px on edges that do not touch the screen edge (`mask-image`).
  - Remove the drag-to-frame / `focusY` step from Studio; keep the copy "Keep your piece inside the frame." over a plain 4:5 crop.
  Proof: iPhone Safari with toolbar shown and hidden, every maker: the whole piece is visible between the maker row and the bar; nothing of it under the bar, thumbs or nav.
- [x] **10.3 Cut-off dark rectangles under stickers.** Cause (checked live): `filter: drop-shadow(0 6px 10px rgba(0,0,0,.35))` is on the sticker `<img>`; iPhone Safari clips the filter to the img box (`overflow: clip` on replaced elements), leaving a hard-edged dark rectangle.
  Fix: move the shadow to the wrapper span and make it smaller: `filter: drop-shadow(0 2px 6px rgb(0 0 0 / .25))`. Same for every sticker on the site (Discover, product page, cards, desktop).
  Proof: zoom on iPhone Safari around "1 of 1" and "New maker": soft shadow follows the sticker shape, no straight edges.
- [x] **10.4 End screen: gap between the title lines is too big.** Matas (20:50): position, size, line break ("…for" / "now") and everything else stay exactly as they are. Only the space between the title lines is too big. Cause: Rock Salt's default line-height is huge.
  Fix: title `line-height: 1.15` (nothing else changes; no new elements, no moving the block).
  Proof: iPhone Safari screenshot: "now" sits right under the first line, the gap between the lines looks like normal text spacing.

- [x] **10.5 Tapping Follow / Following changes the screen.** Matas: "tap Following and the screens change". Follow must only switch the button and update who she follows; it must not touch Discover or anything else.
  Cause (in the code): `getFeed()` in `lib/data/mock.ts` sorts makers with followed ones first (`score = follows.includes(id)`), and `useData` reloads the feed on every data change. So `toggleFollow` → feed reloads → order changes → a different maker sits under your finger, panels and photos remount.
  Fix:
  - Discover order is decided **once** when Discover opens and stays frozen until the page is reloaded. Follow/unfollow, save, add to bag never reorder or remount the feed. (Keep a ref with the first list of maker ids; later updates are mapped onto that order by id.) Same in `getFeed` for Supabase later: following only affects the order of the *next* session.
  - Follow is optimistic: only the button label (Follow ↔ Following, 150ms cross-fade) and the maker's follower count change. Same maker, same panel (Pieces / Her story / All about her), same piece, same photo, same scroll position. The button has a fixed width (the width of "Following"), label centred, so nothing next to it moves.
  - The only other places that change: `/following` (list of makers she follows) and the follower count on her profile. Same behaviour on desktop Discover, `/m/[slug]` and All about her.
  - **Unfollow is the same:** Matas (20:52): tapping Following to unfollow makes the maker drop out of her place in Discover and throws you to another maker. Same cause (the followed-first sort moves her down). After the fix an unfollowed maker stays exactly where she is in this session; she is never removed from Discover because of unfollow (only "Not for me" / `hideMaker` removes a maker).
  Proof: on iPhone Safari, scroll to the 3rd maker, open Her story, tap Following → Follow → Following: nothing on screen moves except the button text; you are still on the same maker and panel. `/following` shows the change.

Order: 10.5 + 10.3 (quick) → 10.2 → 10.4 → 10.1. One PR, QUALITY loop, then ask Matas to test on his iPhone again.

## P11. Matas's iPhone + desktop test of P10 (2026-11-25 22:30)

Follow (10.5), stickers (10.3) and the end screen (10.4) are good. Three things are not:

- [x] **11.1 Photos are shrunk and framed by blur. Undo 10.2.** Matas: "not safe zones, just shrunk with blur around, nonsense". The rule is his reference `docs/design/screens/png/03-discover-v3-safe-zone.jpg`: photo full screen, product inside the zone.
  Fix:
  - Run `node scripts/fetch-hero-photos.mjs` (new): 19 **tall 9:16** heroes → `public/img/tall/<name>.jpg` (1080 wide) and 19 **wide 4:3** heroes → `public/img/wide/<name>.jpg` (1800 wide). Same piece and light as the current photo, only more background. Names = the first image of each piece (`pink-necklace`, `plates`, `crochet-bag`, …). Then `node scripts/optimize-images.cjs`.
  - Data: add `hero?: { tall: string; wide: string }` to `Product` in `lib/types.ts`; in `lib/data/mock-data.ts` give every piece `hero: { tall: '/img/tall/<first image name>.jpg', wide: '/img/wide/<first image name>.jpg' }`.
  - Phone Discover: delete the blurred `under` image and the zone box. One `<img>` with `hero.tall` (fallback `images[0]`): `position:absolute; left:0; width:100%; top: calc(var(--u-safe-top) - var(--u-safe-bottom)); height: calc(100% + var(--u-safe-bottom) - var(--u-safe-top)); object-fit: cover`. No mask, no radius, no blur.
  - Thumbs, details page and product page keep the normal 4:5 photos.
  Proof: iPhone Safari, every maker: the photo fills the screen edge to edge, no blur frame anywhere, and the whole piece sits between the maker row and the bar (compare with the safe-zone reference).
- [x] **11.2 Sideways swipe stops wherever you let go, and lags.** Matas: "it moves only as much as you swipe, you can stop it in the middle; once you start it must go all the way". Screenshots show panels resting half on screen.
  Fix:
  - The panel scroller: `overflow-x: auto; scroll-snap-type: x mandatory; overscroll-behavior-x: contain`; each panel `scroll-snap-align: start; scroll-snap-stop: always`. Nothing may turn snapping off or set it to `proximity`.
  - No JS that writes `scrollLeft`, or a `transform` on the scroller or panels, while the finger is down. The parallax/darkening from 10.1 may only move things **inside** a panel (its photo or an overlay), read from `scrollLeft` in one rAF. If that still fights the snap on iPhone, drop the parallax: landing on a panel matters more.
  - Lag: the 28px blur layer is gone with 11.1 (it was repainting on every frame). Panels use `contain: paint`; only the current maker and its neighbours have their Her story / All about her panels mounted.
  - All about her: the fixed maker row and the panel's own big header showed at the same time (name over "Following"). On panel 3 fade the fixed row out with the scroll progress (opacity 1 → 0 between panel 2 and 3), so only one header is ever visible.
  Proof: iPhone Safari, release a swipe at 10%, 50% and 90%: it always ends on a whole panel. A quick flick moves exactly one panel. No two headers on screen. Smooth, no stutter, on a real phone.
- [x] **11.3 Desktop: photo cropped and the page scrolls like a normal website.** Matas: "the photo is not in the safe zone either, and the computer scrolls like a plain site; I want to scroll, but still one maker at a time".
  Fix:
  - Photo area uses `hero.wide` with `object-fit: cover`, centred, so the whole piece shows (the granny bag was cut top and bottom).
  - One maker per scroll: the feed is `scroll-snap-type: y mandatory`, every maker `scroll-snap-align: start; scroll-snap-stop: always; height: 100dvh − header`. Mouse wheel / trackpad: one gesture = one maker (if trackpad momentum skips makers, lock input for ~600ms after each move). ↓/PageDown/Space = next, ↑/PageUp = previous. The "Next maker · Scroll ↓" row stays.
  - This replaces the free scrolling Justinas chose for P7; Matas decided it on 2026-11-25 22:34.
  Proof: 1440×900 and 1280×800: one wheel flick and one trackpad swipe each move exactly one maker; the page never rests between two makers; every piece is fully visible in the photo.

Order: 11.1 → 11.2 → 11.3. One PR, QUALITY loop, then Matas tests on his iPhone and computer again.

Done 2026-11-25 (Claude, branch `claude/p11`): ran `scripts/fetch-hero-photos.mjs` (19 tall 1080w + 19 wide 1800w) and `optimize-images.cjs`; every seeded piece has `hero` (old saved demo data gets it from the seed by id). Phone: one `<img>` with `hero.tall`, placement exactly as written, no blur/zone/mask left (0 filtered images on screen). Checked in iPhone 15 Pro emulation at 393×659 (toolbar shown) and 393×746 (hidden) for all 15 pieces in the 4 makers with the dashed safe-zone frame: photo edge to edge, each piece between the maker row and the bar. Note for Matas: on a taller screen (390×844) the photo is scaled up by height, so wide pieces (necklace, granny bag) fill the zone edge to edge. Sideways: parallax now moves only an inner layer of the leaving panel (`.panIn`); the scroller and panels never get a transform; `contain: paint`; the first-visit bounce stops on touch. Touch drags released at 10% / 50% / 90% and flicks at 15% / 60% all rest on a whole panel; on All about her the fixed maker row is at opacity 0 / hidden, one header. Desktop: first photo = `hero.wide` (granny bag whole at 1440×900 and 1280×800); page snaps (`html.u-snap-y`, maker = one stop), one wheel notch, one simulated trackpad swipe with 1.1s momentum, ↓ PageDown Space ↑ PageUp each move exactly one maker; a scroll left between two makers settles on the nearest one. `npm run build` + `qa.mjs` 0 FAIL (warns are the old 128px wash ones). Matas: please test on your iPhone and computer (trackpad).

## P12. Matas's iPhone test of P11 (2026-11-26 09:06)

Matas: "getting better; sideways now lands and does the job". Left:

- [x] **12.1 The photo you are leaving stutters while you swipe sideways** (Pieces → Her story, and the story image → All about her). The movement itself is smooth; only the image of the panel you leave jerks. Cause: the P10.1 parallax moves `.panIn` from JS on every scroll frame, which on iOS Safari runs out of step with the native scroll.
  Fix: remove the JS parallax and dark overlay. The leaving panel's image moves exactly with its panel, nothing else touches it. If you want to keep a subtle effect, only with CSS scroll-driven animations (`animation-timeline: view(inline)` / `scroll()`, compositor only) behind `@supports`; otherwise none. Also: images inside panels have no `filter`, `mask` or `transform`; the neighbour panels' images are decoded before the swipe starts (`decoding="async"`, loaded when the maker becomes current).
  Proof: on an iPhone, slow swipe Pieces → Her story → All about her and back: both images move as one solid sheet, no jerk. Record it.
- [x] **12.2 Tap "Discover" in the bottom nav while already on Discover = back to the top.** Like Instagram/TikTok: if you are on the 3rd maker (any panel), tapping Discover smooth-scrolls to the first maker and puts the panel back on Pieces. Reduced motion: jump without animation. Tapping it from another page just opens Discover where you left it (as now).
  Proof: scroll to maker 3, open All about her, tap Discover: you land on maker 1, Pieces.
- [x] **12.3 "Following" text glitch on the way to All about her.** Mid-swipe, the fixed maker row's Follow pill fades over panel 3's own header (name with "Following" on top). Fix: one header only, no cross-fade: on All about her keep the fixed maker row (same avatar, name, Follow pill as on the other panels) and remove panel 3's own avatar/name/Follow; panel 3 starts under the fixed row with Message (full width), then the stats. Nothing fades.
  Proof: slow swipe Her story → All about her: at no frame are two names or two Follow buttons visible.
- [x] **12.4 Not every maker is a woman: drop "her" from the copy.** Matas: "All about her is only for women".
  - Discover tabs become **Pieces · Story · About** (short, neutral, still centred). Desktop: "Her profile →" → "Profile →", "Her story · 0:24" → "Story · 0:24".
  - Everywhere else: use the maker's name instead of a pronoun ("Inez will reply with questions…", "Open Inez's journal", "Only Rima can see it"). Where text is not about one maker, use neutral words ("Each maker ships their own parcel", "Ask a maker anything from their profile").
  - Add `pronouns?: 'she' | 'he' | 'they'` to `Maker` (Studio settings + apply form, default `they`) and one helper `pronoun(m)` for the rare sentence that needs one. Never hard-code she/her.
  - Places found: `bag/page.tsx:15`, `discover/PhoneFeed.tsx:19,178,180`, `following/page.tsx:61,71`, `m/[slug]/request/page.tsx:54,58,72,96`, `messages/Inbox.tsx:12`, `messages/[slug]/page.tsx:72`, `page.tsx:184,207,211`, `sell/page.tsx:44` (alt text: fine to keep, it describes Mara), `admin/page.tsx:28,31`, `studio/messages/page.tsx:117`. Update `docs/design/DISCOVER.md` tab names too.
  Proof: `grep -rnw "her\|she\|She\|Her" app components` shows only alt texts about a named maker.

Order: 12.1 → 12.3 → 12.2 → 12.4. One PR, QUALITY loop, then Matas tests on his iPhone.

Done 2026-11-26 (Claude, branch `claude/p12`): 12.1 JS parallax, dark overlay and edge shadow removed (only the tab underline still follows the finger); the Story photo loads eager as soon as the maker is current. Checked in iPhone 15 Pro emulation at 393×659 and 393×746: slow swipe Pieces → Story → About sampled every 33px, at every frame no panel or panel image has a transform, filter or mask (thumb ring scale excepted) and no overlay exists. 12.3 About has no own avatar/name/Follow; the fixed maker row stays visible on About, Message full width under it; at every swipe frame exactly one name and one Follow pill are visible. 12.2 maker 3 → About → tap Discover: lands on maker 1, Pieces (also when maker 1 was still mounted on About); from Explore, Discover opens as before. 12.4 tabs Pieces · Story · About, desktop "Story · 0:24" / "Profile →", copy uses the maker's name; `pronouns?` on `Maker` + `MakerApplication` (apply form + Studio profile step 1, default they, copied on approve), `pronoun(m)` in `lib/format.ts`; `grep -rnw "her|she|She|Her" app components` = only the Mara alt text on /sell. DISCOVER.md updated. `npm run build` + `qa.mjs` 0 FAIL (warns are the old ones). Not possible here: a real-iPhone recording. Matas: please test the swipe on your iPhone.

Done 2026-11-25 (Justinas + Claude, PR "P10"): checked in iPhone 15 Pro emulation with the Safari toolbar shown (393×659) and hidden (393×746). Every mounted maker's photo sits inside the safe zone (y 104 → height − 262); sticker shadow on the wrapper, no box edge; end title line-height 1.15; Follow → Following → Follow on the 3rd maker in Her story keeps the order, the panel, the scroll and the button size, and `/following` updates; slow swipe: tabs + maker row stay fixed, underline glides between tabs, leaving panel at 0.3× with a 0→.4 dark overlay, incoming panel with an edge shadow; reduced motion = no parallax. qa.mjs 0 FAIL. Matas: please re-test on your iPhone.

## P13. For you: one piece per screen (Matas + testers, 2026-11-27)

People who tried it: too much on screen, the sideways maker panels feel odd, "Pieces / Story / About" is unclear, the piece title in Rock Salt is hard to read. They want it product-focused. Reference (Matas picked it): `docs/design/screens/png/p13-for-you.jpg`, the same screen with four other pieces: `p13-for-you-products.jpg`; nav options he compared: `p13-nav-options.jpg` (he chose **A**).

**This changes a LOCKED flow** (Discover = one maker per screen). Matas decided it on 2026-11-27; before building 13.2–13.4, check that Justinas has OK'd it (ask him in one line if you have not seen his OK). 13.1 and 13.5 do not change a flow and can go first.

- [x] **13.1 Bottom nav = 3 icons with small labels: For you · Search · Profile.**
  - Icons from `components/u/Icon.tsx` (add `home`, `user`; `search` exists), 24px, label Inter 600 10px under each, gap 3px. Active = cream + filled icon; others cream 60%. Pill `left/right: 80px` on 390 (centred, ~230 wide), height 58, `justify-content: space-evenly`.
  - "Discover" is renamed **For you** everywhere (nav, titles, tap-again-to-top from 12.2 stays).
  - **Search** opens what Explore is today, with a search field at the top.
  - **Profile** opens `/account`, which now also holds **Following** (makers you follow), **Saved** (boards) and orders. Remove Explore/Following/Saved/Bag from the nav; their pages stay reachable from Search/Profile.
  - **Bag** moves to the top right of For you (and the header of other pages): 40px glass circle, bag icon 22px, butter count badge 16px at top-right. Hidden count when 0.
  - Desktop header: same three + bag icon on the right.
- [ ] **13.2 For you feed = one piece per screen, not one maker.** Swipe up/down = next/previous piece (snap, one per swipe, as now). Makers are mixed: never the same maker twice in a row, at most 2 pieces of one maker in any 8. Order from `getFeed` as today (taste first, followed boosted), frozen per session (10.5 stays).
- [ ] **13.3 Screen layout (top to bottom), see the reference:**
  - Tabs at top, centred: **Product · All works** (Inter 13, active 600 + 2px butter underline). Bag icon top right. (Story is no longer a tab, see 13.6.)
  - **No stickers on For you for now** (Matas, 2026-11-27 13:19): remove the sticker from the phone and desktop For you screens. Keep the sticker code and data; it may come back.
  - Readability: a soft shade behind the text on any photo. Top: `linear-gradient(rgba(28,22,18,.45), transparent)` 96px high behind the tabs. Bottom: 46% of the screen, `linear-gradient(transparent, rgba(28,22,18,.55) 55%, rgba(28,22,18,.7))` behind the maker row, squares, bar and nav. Use tokens, not hard-coded colours.
  - Photo full screen as in P11 (`hero.tall` for the first photo).
  - Maker row above the photo squares: avatar 36 with the **story ring** (13.7), name in **Rock Salt 16**, "City · Category" 12px, Follow pill 34 high on the right. Tap avatar/name = All works.
  - **Photo squares**: 48×48, radius 10, gap 6, left 16, one per photo of **this piece** (2–4). Selected = 2px butter ring, others 85% opacity. Tap = the big photo cross-fades to that photo (250ms). No swiping between photos.
  - Bar: title in **Inter 600 16** (not Rock Salt), "95€ · Details ›" under it, Add to bag on the right. Rock Salt stays only for maker names (and screen titles).
  - No "Next: …" line. First visit only: 1.2s after opening, the feed nudges up 48px and back (shows the edge of the next piece). Reduced motion: none.
  - Safe zone: the product sits between the tabs (top 48) and the maker row; recompute `--u-safe-top` / `--u-safe-bottom` for this layout so the piece is never under the maker row, squares or bar.
- [ ] **13.4 Sideways = Product → All works** (her profile, 13.6). Only two panels; there is no Story panel any more. Same snap rules as P11/P12 (always lands, no stutter, one header).
- [ ] **13.6 All works page starts with her video** (Matas: "this one is great", 2026-11-27 15:50; replaces the studio-photo version from 13:35). Reference: `docs/design/screens/png/p13-all-works.jpg`.
  - Top 400px, full width: her story video **playing straight away, muted, looping** (`autoplay muted loop playsinline`, `object-fit: cover`). Shade behind the tabs, fade into the page background at the bottom.
  - Captions over the video from her own words (`maker.storyQuote`, line by line in time with the video): Inter 600 17, left 16, 58px above the video's bottom edge, soft text shadow; a 3px progress line under them.
  - "Tap for sound" pill top right under the bag (30 high, speaker icon). Tapping the pill or the video opens it **full screen with sound**: name in Rock Salt + the full quote at the bottom, progress bar, ✕ top left (back to All works at the same scroll), sound toggle top right.
  - No video: the same area shows her studio photo (`maker.coverPhoto`), no pill, no captions.
  - Under the video, one row: avatar 56 with the story ring (13.7), name Rock Salt 22, "City · Category · ★ 4.7" Inter 12 on **one line** (never wrap; drop the rating if it does not fit), Message as a 40px round icon button, Follow (primary, 40 high) on the right.
  - One sentence about her (`maker.tagline`, Studio field, max 80 characters), Inter 14.
  - Works: 2 columns, 10px gap, photo 4:5 radius 14, under it title (Inter 13, left) and price (Inter 600 13, right) on one line. Tap = opens as Product. Filter chips only when she has more than 8 works.
  - Reduced motion or data saver: no autoplay; first frame with a play button.
- [ ] **13.7 Story ring around the maker avatar** (like Instagram stories): a 2–3px butter ring (conic gradient of the butter tokens) means "she has a video you have not watched". Everywhere the avatar shows: For you maker row, All works, Following list, Search results. Tap the avatar = her video opens full screen with sound. After it is watched once the ring turns grey (cream 30%); remembered per maker in the data layer (`watchedStories`). No video = no ring.
- [x] **13.5 Piece titles in Inter everywhere** (bar, details page, cards, grids, bag, desktop). Rock Salt only for maker names and screen titles. Update the "Fonts" line in `CLAUDE.md` current look and `docs/design/DISCOVER.md`.

Proof: 390×844 and iPhone Safari next to `p13-for-you.jpg`; swipe up = a different piece (makers alternate); tap squares = photos change; sideways lands on All works then Story; nav has 3 items; bag count shows at the top.

Order: 13.5 → 13.1 → (Justinas's OK) → 13.2 → 13.3 → 13.4 → 13.6 → 13.7. One PR per step is fine; QUALITY loop each time.

Done 2026-11-27 (Claude, branch `claude/p13`): **13.5** piece titles use the new `.ptitle` class (Inter 600) on the phone bar, phone details, desktop For you card, product page, chat piece card, Studio order lines and the Studio piece preview; maker names and screen titles stay Rock Salt. "Fonts" line updated in `CLAUDE.md`, `DISCOVER.md`, `QUALITY.md` 2.2 and the `--u-hand` comment. **13.1** phone nav = For you · Search · Profile (icons `home`/`search`/`user` 24px, filled when active, label Inter 600 10px, gap 3, pill 58 high, `left/right:80px` → 230 wide on 390, `space-evenly`, inactive `--u-ink-60` = cream 60%, new token). Bag = 40px glass circle top right (icon 22, butter badge 16, hidden at 0): on For you it sits on the tab row (centre y 24, tabs centre 25), on other pages in the header row where the old "L" profile circle was; hidden on `/bag`. Profile tab is active on `/account`, `/following`, `/saved`, `/messages`; `/account` on phone got Following and Saved rows (desktop already has them in the stats); Explore's title is now "Search". "Discover" → "For you" in the nav, desktop header and Studio copy; tap For you on For you still goes back to the top (12.2). Because the pill grew 54 → 58, the For you bottom stack moved up 4px and `--u-safe-bottom` is 266 (keeps the 12px gap; 13.3 recomputes it anyway). Desktop header: For you · Search · Profile + search field, Sell, Messages, bag (the "L" circle is gone, Profile replaces it). Checked: `npm run build`, `qa.mjs` 0 FAIL (warns are the old ones), Playwright at iPhone 15 Pro 393×659 and 393×746, 390×844 and 1440×900: nav items, active state, badge after Add to bag ("Bag, 1 item"), Search → /explore, Profile → /account → Following (Profile stays active), bag → /bag, For you back; no console errors; screenshots compared with `p13-nav-options.jpg` (A).
Not in the design, decided by default (Matas can change): Messages stays an icon on the desktop header and a row in Profile on phone; the Following/Saved rows on phone Profile are links to the existing pages (not embedded lists).
**Waiting: 13.2–13.4 and 13.6 change the LOCKED For you flow. Not started until Justinas OKs Matas's P13 decision (asked 2026-11-27).**

---

## Why it ended up like this (so it doesn't happen again)

Part of it is the spec, part is the build.

**Gaps in Matas's spec (made with his AI):** the screens in `docs/design/screens/` are still pictures. They show one state per screen and say nothing about hover, pressed, loading, motion, how rows scroll and snap, how much blur is allowed, or how the glass behaves over a white photo. There was no reference image to compare with and no rule to check the result. Now there is: reference PNGs in `docs/design/screens/png/`, the defaults in `docs/ai/QUALITY.md`, and `scripts/qa.mjs`.

**Build side:** the screens were built fast and checked by reading code, not by looking at screenshots or using them on a phone. That is how 85 blurs, 93 eager images, the hidden phone feed, 420 inline styles and missing transitions got through. From now on: the loop in QUALITY.md before every "done".
