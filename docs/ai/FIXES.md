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

---

## Why it ended up like this (so it doesn't happen again)

Part of it is the spec, part is the build.

**Gaps in Matas's spec (made with his AI):** the screens in `docs/design/screens/` are still pictures. They show one state per screen and say nothing about hover, pressed, loading, motion, how rows scroll and snap, how much blur is allowed, or how the glass behaves over a white photo. There was no reference image to compare with and no rule to check the result. Now there is: reference PNGs in `docs/design/screens/png/`, the defaults in `docs/ai/QUALITY.md`, and `scripts/qa.mjs`.

**Build side:** the screens were built fast and checked by reading code, not by looking at screenshots or using them on a phone. That is how 85 blurs, 93 eager images, the hidden phone feed, 420 inline styles and missing transitions got through. From now on: the loop in QUALITY.md before every "done".
