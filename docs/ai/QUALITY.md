# Quality bar: how to check your own UI work before you say "done"

For every AI (and human) that touches a screen in this repo. Written 2026-11-24 after Matas tested the live site and found it "cheap, laggy, clunky, half of it sliding around, colours changing". The code was close to the spec on paper and far from it in the hand. This file closes that gap.

**Rule: you do not say "done", "fixed" or "works" for UI work until you have run the loop below, looked at the screenshots yourself, and every item in the checklist passes.** If something fails, fix it and run the loop again. Report what you checked, not what you intended.

Concrete open problems are listed in `docs/ai/FIXES.md`. This file is the standard; FIXES.md is the to-do list.

---

## 1. The loop (every UI change, every time)

1. `npm run dev`
2. In another terminal: `node scripts/qa.mjs <the routes you touched>` (all routes: no arguments).
   First time only: `npm i -D playwright && npx playwright install chromium`.
3. Read the terminal. Every `FAIL` must go. `warn` lines need a reason if you leave them.
4. **Open the screenshots and look at them.** `qa/index.html` shows your build next to Matas's reference (`docs/design/screens/png/`). With Claude Code, use the Read tool on `qa/phone__<route>.png`, `qa/desktop__<route>.png` and the matching `docs/design/screens/png/*.jpg`. Compare side by side:
   - same elements, same order, same position (within ~8px)
   - same sizes of type, buttons, cards, photos
   - same spacing between blocks
   - nothing extra (duplicate chips, double stickers, debug text), nothing missing
5. **Use it, don't just look at it.** In the browser at 390×844 (DevTools device mode, touch on) and at 1440×900:
   - tap or click every button on the screen once. Each one must give feedback within 100 ms (pressed state, then a change).
   - swipe or scroll everything that scrolls. It must stop on a clean edge (snap), never half way.
   - go back and forth between steps. Nothing jumps, flashes or changes colour.
   - throttle to "Fast 4G" plus 4× CPU slowdown (DevTools → Performance) and repeat the swipe on Discover. It must not stutter.
6. Fix, then go back to step 2. Repeat until clean.
7. In the PR description, write: routes checked, sizes checked, what you compared, what is still different from the reference and why.

Note on references: the PNGs were rendered without the Rock Salt font (it was missing on the machine that rendered them), so handwritten titles there show a fallback serif. In the app they **must** be Rock Salt. Compare their size and position, not the letter shapes.

---

## 2. Checklist

Each item says how to check it. "qa" means `scripts/qa.mjs` already checks it automatically.

### 2.1 Layout and alignment
- [ ] **Page never scrolls sideways**, at 375, 390 and 1440 (qa). Nothing sticks out of the screen (qa).
- [ ] **One grid per size.** Phone: 16px side margin (12px for floating bars and cards that sit on the photo). Desktop: 24px page margin, content max 1280px centred, 16px gaps, columns use `minmax(0,1fr)`.
- [ ] **Everything in a row starts at the same top and has the same height.** Inputs, segmented controls and primary buttons are 48px; secondary buttons and icon buttons 44px; chips 36px with a hit area extended to 44px.
- [ ] **Spacing uses the 4/8 scale only**: 4, 8, 12, 16, 20, 24, 32, 48. No 13px, 18px, 22px gaps.
- [ ] **No one-off inline styles for layout.** `style={{ }}` only for values that really change at runtime (progress %, an image's object-position from data). Margins, paddings, fonts, sizes, colours go in the CSS module or `app/u.css`. qa counts them per file; the number must go down, never up.
- [ ] **Long text does not break the layout.** Test with a 40-character piece title, a 20-character maker name, a price of €1 250. Titles may wrap to 2 lines at most, then ellipsis. Prices never wrap.
- [ ] **Bottom bars never cover content.** The last item on a scrolling page can scroll fully above the nav/CTA bar (bottom padding = bar height + 12px + safe area).

### 2.2 Type
- [ ] Rock Salt (`var(--u-hand)`) **only** for maker names, piece titles and screen titles. Everything else Inter (`var(--u-ui)`). qa fails if a font is not loaded.
- [ ] Sizes from the reference, not invented. Body 15, small 13, meta 12, labels 12/600, titles 22–26 phone, 28–40 desktop.
- [ ] Prices and timers use `.num` (tabular numbers) so they don't jiggle when they change.
- [ ] Inputs use 16px text on phone (smaller makes iOS zoom in).

### 2.3 Colour and glass (the "colours change" problem)
- [ ] **Only `--u-*` tokens.** No hex, no rgba, no font names in components (qa).
- [ ] **Text on glass is readable on every photo**, including white and very light ones. Check each screen over the lightest photo in the mock data (e.g. the white plates). Cream text on glass needs contrast ≥ 4.5:1 for body, ≥ 3:1 for large titles. If the glass gets pale over a light photo, the glass token is wrong: raise its darkness in `globals.css` (ask Matas), never patch one screen.
- [ ] **The colour of a screen must not jump when you move between steps.** The blurred background photo (`Wash`) changes only when the maker changes, and it cross-fades (opacity, 300ms). Never swap it instantly, never per photo inside one maker.
- [ ] Butter (`--u-accent`) is the only accent: selected, active dot, progress. Not for decoration, not for errors.
- [ ] Disabled looks disabled: `opacity .45`, no hard bottom edge, `cursor:not-allowed`, and the reason is written next to it ("Pick a size first").

### 2.4 Motion and feedback (the "clunky" problem)
Nothing in the app may change state without motion or feedback. A button that does nothing visible for 300ms feels broken.
- [ ] **Every pressable thing has a pressed state.** Primary `.cta`: moves down 3px and loses its edge (exists). Glass buttons, chips, cards, thumbs, list rows: `transform: scale(.97)` on `:active`, 120ms. Hover on desktop: slightly lighter glass or underline, 150ms. Keyboard: visible `:focus-visible` ring (exists in `u.css`).
- [ ] **Durations**: press 120ms, hover 150ms, small state change (toggle, chip, heart) 180ms, panels/sheets/drawers 260ms, screen/step change 300ms. Easing `cubic-bezier(.2,.8,.2,1)` for things entering, `ease-in` 200ms for things leaving. Put these in `globals.css` as `--u-dur-*` / `--u-ease` tokens (ask Matas to approve the names) and use only those.
- [ ] **Only animate `transform` and `opacity`.** Never width, height, top, left, margin, padding, filter or backdrop-filter (qa warns). Never `transition: all` (qa).
- [ ] **Step changes animate.** Discover piece → story → profile, Studio profile steps 1–5, checkout steps: the new content slides 24px + fades in (300ms), the old fades out. No hard cut.
- [ ] **Sheets and drawers** (filter, bag drawer, product window on desktop) slide in from their edge with a scrim fading in; close with Esc, scrim click and swipe down (phone).
- [ ] **Add to bag**: the button changes to "In your bag ✓" with a 180ms cross-fade, the bag icon count bumps (scale 1 → 1.15 → 1, 250ms). The toast stays 3–4s and has "View bag".
- [ ] **Heart / save**: fills with a small scale pop.
- [ ] **Loading**: under 100ms show nothing; 100ms–1s disable the button and show a small spinner inside it; over 1s show a skeleton shaped like the content. Never a blank screen, never layout jump when data arrives (reserve the space).
- [ ] **Every animation has a `prefers-reduced-motion: reduce` fallback** (no movement, opacity only or instant). qa fails a CSS file with motion and no reduced-motion rule.
- [ ] **First tap works.** No button may ignore a tap because the page is still hydrating. If a client component is not ready, render the button disabled with the same look, or make it a plain link/form that works without JS.

### 2.5 Scrolling and swiping (the "half of it slides around" problem)
- [ ] **Every horizontal scroller snaps**: `scroll-snap-type: x mandatory` on the row, `scroll-snap-align: start` on items, `scroll-padding-inline` equal to the page margin, so items stop flush with the margin, never half cut on the left. Applies to: photo thumbs, chips rows, "More from", Up next, boards, Explore categories.
- [ ] A row that fits on screen does **not** scroll at all. Check at 390 and 1440.
- [ ] **Vertical feed (Discover phone)**: `y mandatory` + `scroll-snap-stop: always` (exists). One swipe = one maker, never two, never stopping in between. Test fast flicks.
- [ ] **Sideways inside a maker**: piece → story → profile snaps per panel; vertical scroll inside the profile does not fight the sideways swipe (`overscroll-behavior: contain`, `touch-action: pan-y` on the vertical part).
- [ ] **Only one thing scrolls per direction.** No page scrolling behind an open sheet (`overflow:hidden` on body while open). No nested vertical scrollers except the profile panel.
- [ ] Hidden scrollbars only on rows that snap and show a fade or arrow so people know there is more.
- [ ] Desktop: arrows ← → and ↓ do what the hint says; mouse wheel on the stage does not scroll the page behind.

### 2.6 Speed (the "laggy" problem)
Budgets, checked by qa:
- [ ] **≤ 8 visible elements with `backdrop-filter`** on any screen. Blur is the most expensive thing on this site. Small chips and pills on glass should use a solid `--u-glass-sm` with **no** blur; only cards, sheets and bars blur. Never blur something inside something that already blurs.
- [ ] **No blur on off-screen cards.** In the feed, only the current maker and the next one render their glass; the rest render a light placeholder (or `content-visibility: auto` + no backdrop-filter until visible).
- [ ] **Images on first open: ≤ 16 phone, ≤ 24 desktop.** Lazy-load everything below the fold (`loading="lazy" decoding="async"`) or use `next/image`. Feed: load photos for the current and next maker only.
- [ ] **Do not render the phone feed on desktop** (or the desktop stage on phone). `display:none` still downloads every image. Pick one with a media query hook at mount and render only that one.
- [ ] **Images are sized for where they show.** Thumbs 64–96px get ~200px sources, not 2000px photos. Stickers as WebP ≤ 40 KB (today PNG 100–220 KB). The full-screen `Wash` uses a tiny source (≤ 64px wide is enough, it is blurred 60px anyway).
- [ ] Wash blur: one fixed element per page, never one per card.
- [ ] **Swipe on Discover at 4× CPU slowdown keeps ~60 fps** (DevTools Performance: no long red frames during the swipe).
- [ ] Lighthouse mobile on `/`, `/p/necklace`, `/bag`: Performance ≥ 85, CLS < 0.05, LCP < 2.5s.

### 2.7 Touch and accessibility
- [ ] Tap targets ≥ 44×44 (chips 36 tall with a hit area to 44) (qa).
- [ ] Toggles 48×28 with an extended hit area (exists in `u.css`).
- [ ] Every icon button has `aria-label`. Every input has a visible label.
- [ ] Keyboard: Tab reaches everything in order, Esc closes overlays, focus returns to what opened them.
- [ ] Android: no Apple Pay button (show Google Pay, or card only). iOS: no Google Pay.

### 2.8 Copy and honesty
- [ ] Copy comes from the reference screens. If you must invent, verb first, short, no blame.
- [ ] Grammar check every string you add ("1 piece is held", "2 pieces are held").
- [ ] **No fake urgency.** Timers only from real holds (`cart_holds`), shown once per screen. Uplift stickers only from real data (rules in HANDOFF-07).
- [ ] **One badge per frame.** If a photo has a sticker, no second sticker and no chip saying the same thing ("1 of 1" sticker + "1 of 1" chip = remove the chip).
- [ ] Words match across screens: if a piece is "Made to order" on Discover, it is "Made to order" on the product page, the bag and the order, not "Made to size".

### 2.9 Data consistency (mock today, Supabase later)
- [ ] The same piece shows the same price, title, photos, sticker and stock everywhere.
- [ ] Counts are true: "3 in your bag" equals the lines in the bag; "Ships in 3 days" matches the product.
- [ ] Single-photo pieces show no dots and no arrows.
- [ ] Empty states exist and have one clear action (bag empty, no saves, no messages, no orders, no results).

---

## 3. Before you open the PR

- [ ] `npm run build` passes, no TypeScript errors, no console errors on the routes you touched (qa).
- [ ] `node scripts/qa.mjs` has 0 FAIL on your routes.
- [ ] You looked at every screenshot next to its reference and listed the remaining differences in the PR.
- [ ] You used the screens by hand at 390 and 1440 (section 1, step 5).
- [ ] You did not change a flow (what opens what, step order). Flows are locked: both founders must OK changes.
- [ ] You did not change the look on your own. If the reference looks wrong to you, build it as drawn and write the question in the PR for Matas.

## 4. When the spec is not enough

The reference screens are static pictures. They do not show hover, pressed, loading, error, empty, long-text or every in-between state. When one is missing:
1. Follow this file (sections 2.4–2.6 define the defaults).
2. Make it consistent with the closest existing screen.
3. Note it in the PR under "Not in the design, decided by default", so Matas can change it later.
