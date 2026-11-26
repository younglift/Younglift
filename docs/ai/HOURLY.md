# Hourly routine for Justinas's Claude

Justinas runs his Claude as a scheduled task every hour (set up by Justinas, 2026-11-25). Matas's Claude writes new work into this repo; Justinas's Claude picks it up from here. Nobody has to copy messages between the two chats any more.

## Where new work comes from
- `docs/ai/FIXES.md`: numbered groups (P6, P7, … P11, then P12 …). Each group is written by Matas's Claude from things Matas decided in his chat (his iPhone/desktop tests, his screenshots). Each group has the cause, the fix with exact values, a **Proof** line and an **Order:** line.
- `docs/design/DISCOVER.md`: the standing rules for Discover, buttons, icons, nav and photos. If it disagrees with an older doc, it wins.
- `docs/ai/QUALITY.md`: the definition of done.

## The prompt Justinas pastes into his hourly scheduled task

> Pull `main`. Open `docs/ai/FIXES.md`. If there are unticked boxes, take the lowest-numbered group that has them and do it in the order its "Order:" line gives, following `docs/design/DISCOVER.md`. Use one branch and one PR for the group. Before merging, run the `docs/ai/QUALITY.md` loop (`node scripts/qa.mjs` with 0 FAIL, screenshots next to the references, 390×844 and 1440×900). Merge, tick the boxes, and under the group add one line `Done <date time>: <what changed, what to test on the phone>`. If a box needs something only Matas can decide (a colour, a photo, copy), leave it unticked and write the question under it. If nothing is unticked, do nothing and stop.

## Rules for the routine
- One group per run. If a group is too big for one hour, push the branch, leave a line `In progress <time>: <what is done, what is left>` under the group, and continue next run.
- Never untick or rewrite Matas's boxes; add notes under them.
- Flows that are LOCKED in `CLAUDE.md` stay locked: if a FIXES item seems to change a flow, do not build it, write the question under it for Justinas.
- New dependencies, Supabase, Stripe and anything in Justinas's folders (see `SHARED.md`) are Justinas's call as before.
- Photos that need downloading from Higgsfield come with a script in `scripts/` (Matas's Claude cannot download them). Run it, commit the files.

## How Matas's Claude knows it worked
It reads the `Done …` lines and the commits, then checks the live site (https://younglift-delta.vercel.app) at 390×844 and 1440×900 and asks Matas to test on his iPhone. Anything still wrong becomes the next group in FIXES.md.
