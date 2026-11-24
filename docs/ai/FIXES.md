# Fixes: what is still wrong on the live site (2026-11-24)

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

- [ ] **4.1 420 inline `style={{}}` objects.** Worst: `studio/profile/page.tsx` 31, `checkout/page.tsx` 31, `account/page.tsx` 22, `studio/pieces/Editor.tsx` 20, `studio/page.tsx` 19, `(site)/page.tsx` 18. Each has its own font sizes and gaps (13px here, 12 there, 18px gap), which is why the screens don't line up.
  Fix: move to CSS modules using the 4/8 spacing and the type sizes in QUALITY 2.1–2.2. Do it screen by screen against the reference PNG.
  Proof: inline count per file ≤ 5 (qa), screenshot matches reference.
- [ ] **4.2 Glass goes pale over light photos** (white plates, cream ceramics). Text loses contrast and the screen "changes colour". Cause: `--u-glass` is 28–42% dark; over white it reads as grey.
  Fix **(Matas)**: darker glass (e.g. 55/40%) or a darker `--u-bg` under the wash; check every screen over the lightest photo.
- [ ] **4.3 Two stickers per frame + a chip saying the same.** Discover uses `.stk` and `.stk2`; product tags add "1 of 1" again. Rule: one badge per frame (QUALITY 2.8).
- [ ] **4.4 "Made to size" vs "Made to order".** `(site)/page.tsx` line 20 and `p/[id]/page.tsx` line 32 say "Made to size" for sized pieces; Studio and filters say "Made to order". Pick one word everywhere **(Matas)**: design uses "Made to order".
- [ ] **4.5 Long titles wrap to 2+ lines and push the card.** Clamp to 2 lines with ellipsis.
- [ ] **4.6 Desktop stage photo cropped and soft** (`object-fit:cover` on a 1392px stage with portrait photos). Use a contain + blurred backdrop for portrait photos, or a wider crop source.
- [ ] **4.7 Desktop Home doesn't match `desktop-Home.jpg`.** Compare and rebuild.
- [ ] **4.8 Single-photo pieces still show a dot.** Hide dots/arrows when there is one photo.

## P5. Copy and honesty

- [ ] **5.1** `components/u/BagView.tsx` line 49: "Your 1 of 1 pieces are held" → "Your piece is held" / "Your 2 pieces are held" (plural by count).
- [ ] **5.2 Timer shown twice in the bag, missing in checkout.** One timer per screen, and keep it in checkout.
- [ ] **5.3 Apple Pay on Android** (`checkout/page.tsx` line 73). Show by platform (Payment Request API), card always.
- [ ] **5.4 Mock data inconsistent** (same piece with different prices/stock across screens, counts that don't add up). Check QUALITY 2.9 on every screen.
- [ ] **5.5 Studio: Publish only at the bottom of a long form.** Sticky bottom bar with Publish; chips 36px and toggles 28px need their 44px hit area (`u.css` has it, inline overrides remove it in places).

- [ ] **5.6 Rezervacija visiems kūriniams su ribotu kiekiu, ne tik 1 of 1** (nuspręsta 2026-11-24, spec `docs/design/HANDOFF-07.md` „15 min rezervacija“, ekranai `07-bag`, `desktop/07-bag-drawer`, `desktop/07-checkout`).
  Fix: `lib/data/mock.ts` hold kurti kiekvienam ne made-to-order kūriniui su `qty`; laisvas kiekis = stock − kitų holds; `components/u/BagView.tsx` tekstai („When you add a piece, we hold it for you for 15 minutes.“ tuščiame krepšelyje) „Your pieces are held for …“ ir „Held for you · mm:ss“ prie kiekvienos rezervuotos eilutės; laikmatis checkout'e; Supabase `cart_holds.qty`.
  Proof: įdėk Morning cup (ne 1 of 1) → krepšelyje „Held for you“; antroje naršyklėje to paties kūrinio laisvas kiekis sumažėjo; made-to-order žiedas be laikmačio.

---

## Why it ended up like this (so it doesn't happen again)

Part of it is the spec, part is the build.

**Gaps in Matas's spec (made with his AI):** the screens in `docs/design/screens/` are still pictures. They show one state per screen and say nothing about hover, pressed, loading, motion, how rows scroll and snap, how much blur is allowed, or how the glass behaves over a white photo. There was no reference image to compare with and no rule to check the result. Now there is: reference PNGs in `docs/design/screens/png/`, the defaults in `docs/ai/QUALITY.md`, and `scripts/qa.mjs`.

**Build side:** the screens were built fast and checked by reading code, not by looking at screenshots or using them on a phone. That is how 85 blurs, 93 eager images, the hidden phone feed, 420 inline styles and missing transitions got through. From now on: the loop in QUALITY.md before every "done".
