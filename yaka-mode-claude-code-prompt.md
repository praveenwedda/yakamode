# Claude Code Build Prompt — "Anytime Fitness – Canberra City" Snakes & Ladders Gym App

> **How to use this:** Paste everything below the line into Claude Code as your opening message. Work through it milestone by milestone, run `npm run build` after each milestone, and commit. When something is genuinely your call as the product owner, the prompt flags it as a **DECISION** with a default already chosen — answer those when asked, or let the defaults stand.

---

## 1. Role and goal

You are a senior frontend engineer and product designer. Build a polished, production-grade single-page web app for **Anytime Fitness – Canberra City**, a professional gym franchise location in the Australian capital. The app gamifies group workouts: members play a physical **Snakes & Ladders** game where landing on a square triggers a real exercise, and the app tracks who worked out how much, how fast, and how they improve over time across sessions.

The whole thing is a **static site deployed to GitHub Pages** — no backend server. Build accordingly.

The trainer ("the admin") is the only person who operates the app. Members are the players; they don't log in, they just play.

**Brand:** Anytime Fitness is a globally recognised gym franchise with a signature vibrant **purple** identity and a **bold-but-welcoming, community-focused** personality. The Canberra City location is professional and premium. The aesthetic is clean, modern, and energetic — confident without being aggressive. Think premium sports app meets neighbourhood gym, not a rough underground arena.

**Logo note — important:** The Anytime Fitness logo (the "running man in a circle" and wordmark) is trademarked. **Do not attempt to recreate or closely imitate the official logo.** Instead:
- Build the app header with a **text-based wordmark** reading "ANYTIME FITNESS" (display font, purple) + "— Canberra City" (smaller, muted subtitle). Leave a clearly documented `<div id="brand-logo">` slot in the header where the user can drop in an official logo SVG/PNG later with one line of code.
- Instruct the user in the README to add the official logo themselves once they have it.

**Above all else: the UI and in-game graphics must be excellent.** The snakes, the ladders, the board, and the dice are the soul of this app. Flat or generic is a failure. Read §5 carefully and execute it with precision.

---

## 2. Tech stack and hard constraints

- **Framework:** React + **Vite** (TypeScript).
- **Styling:** Tailwind CSS, with CSS custom properties for all theme tokens so the entire palette can be retuned in one place.
- **Animation:** the **Motion** library (`motion`, formerly Framer Motion) for React component motion; plain CSS/SVG for the board, snakes, ladders, and dice where that is cleaner.
- **Charts:** **Recharts** (for cross-class improvement graphs).
- **Routing:** `react-router-dom` using **`HashRouter`** — required so deep links and refreshes work on GitHub Pages without 404s. Do not use `BrowserRouter`.
- **Icons:** `lucide-react`.
- **State + persistence:** React Context + a typed data store backed by **`localStorage`** (see §4). No external database by default.
- **No backend, no server, no secrets.** Everything runs in the browser.

**GitHub Pages specifics (get these right or the deploy breaks):**
- In `vite.config.ts`, set `base: '/<REPO_NAME>/'`. **Ask the user for the exact GitHub repo name before finalising this** and put a clearly commented one-line instruction near it so it is easy to change.
- All asset references must be base-aware (import assets through Vite, or use relative paths). No hardcoded `/images/...` absolute paths.
- Deploy via a **GitHub Actions** workflow that builds and publishes to GitHub Pages (use `actions/upload-pages-artifact` + `actions/deploy-pages`). Include the workflow file at `.github/workflows/deploy.yml`. In the README, tell the user to enable **Settings → Pages → Source: GitHub Actions**.

---

## 3. Honest limitations to build around (surface these to the user)

Do not pretend these away — design for them and include a short plain-English note in the Settings page and README:

1. **"Admin login" is a convenience gate, not real security.** Because this is a static site, any password lives in client code and can be read by anyone technical. Implement a simple password gate (see §6.1) and clearly label it as "keeps casual users out, not cryptographically secure." If real authentication is ever needed, that requires a backend (e.g. Firebase Auth) — note this as future work, do not build it now.
2. **Data is stored in this browser on this device only.** If the trainer switches devices or clears browser data, data is gone. Because members and history must survive "for the lifetime of the app," build **Export to JSON / Import from JSON** as a first-class feature (§6.2) so the trainer can back up and move data. Recommend in the README that they export regularly.
3. **Optional future upgrade (note in README, do NOT build now):** swapping the localStorage layer for **Firebase Firestore (free tier)** would give true cross-device sync. Architect the data layer (§4) cleanly behind a single module so this swap is feasible later.

---

## 4. Data model and persistence

Build a single typed data-access module (e.g. `src/lib/store.ts`) that reads/writes a versioned object in `localStorage` under one namespaced key (e.g. `af_canberra_v1`). Expose typed CRUD functions and a React Context/provider so components never touch `localStorage` directly. Include a `schemaVersion` field and a trivial migration hook for future-proofing.

**Entities:**

- **Member (global, app-wide, permanent):**
  `{ id, name, displayColor, avatarInitials?, createdAt, archived: boolean }`
  Members are created once and reused across any number of classes for the life of the app. The admin can add, edit, archive (soft-delete, never hard-delete by default), and un-archive members.

- **Class:**
  `{ id, name, date, gameType: 'snakes_and_ladders', boardId, participantIds: [memberId], status: 'setup'|'in_progress'|'finished', createdAt }`
  A class picks a game. Only "Snakes & Ladders" exists for now — make `gameType` an enum and structure code so another game type could be added later without a rewrite.

- **Board (the Snakes & Ladders configuration for a class):**
  `{ id, snakes: [{ from, to }], ladders: [{ from, to }], exercises: { [boxNumber: 1..100]: Exercise | null }, rules: { winRule, exerciseTrigger } }`
  - `snakes`: each `from` is the head (higher number), `to` is the tail (lower number); `from > to`.
  - `ladders`: each `from` is the bottom (lower), `to` is the top (higher); `from < to`.
  - `exercises`: a map from box number to an exercise (or null for boxes with no exercise).
  - **Exercise:** `{ name: string, mode: 'reps' | 'duration', amount: number }` — e.g. `{ name: 'Squats', mode: 'reps', amount: 15 }` or `{ name: 'Plank', mode: 'duration', amount: 30 }` (seconds). The `amount` is what is summed for workout volume stats.

- **GameSession (the live + recorded play state for a class):**
  `{ classId, turnOrder: [memberId], keyAssignments: { [memberId]: string }, positions: { [memberId]: boxNumber }, winnerId|null, finishedRank: [memberId], turns: [TurnRecord], startedAt, endedAt }`
  - **TurnRecord:** `{ memberId, roll, fromBox, landedBox, finalBox, exercise: Exercise|null, exerciseStartedAt, exerciseCompletedAt, durationMs }`

- **Derived stats** are computed from `GameSession.turns` — do not store redundant aggregates; compute on read.

---

## 5. Design direction — execute this with precision

Commit to a **clean, premium dark gym aesthetic** grounded in the Anytime Fitness purple brand. This is polished, confident, and community-energising — not gritty or aggressive. Think: a premium sports app shown on a gym's big screen. Every pixel should feel intentional.

**Avoid** generic AI aesthetics: no purple-on-white gradients, no flat default cards, no system fonts, no undifferentiated layouts.

### 5.1 Color tokens (CSS custom properties — use these consistently everywhere)

```
--bg-base:        #0D0D17   /* near-black with a faint violet undertone — creates AF purple ambiance */
--bg-surface:     #15152A   /* elevated surfaces */
--bg-surface-2:   #1E1E38   /* modals, dropdowns */
--border:         rgba(255, 255, 255, 0.08)

--brand-purple:   #7B2D8B   /* Anytime Fitness signature purple — primary brand colour */
--brand-purple-l: #A054C4   /* lighter purple for hover, secondary accents */
--brand-purple-d: #5A1F68   /* darker purple for pressed states, decorative depth */
--purple-glow:    rgba(123, 45, 139, 0.35)  /* for glows, halos, active highlights */

--accent-white:   #F4F2FF   /* off-white with the faintest violet cast — not pure white */
--text-primary:   #EDE9FF
--text-muted:     #9490B0

--success:        #3DD68C   /* exercise complete, ladder-climbed */
--warning:        #FFB84D   /* timer urgency state */
--danger:         #F0476B   /* snake-slid, eliminated */
```

Backgrounds should have **atmosphere, not flat fills**: add a subtle radial gradient from `--brand-purple-d` at 15% opacity centered at the top, and a faint CSS noise/grain texture overlay on `--bg-base`. This creates depth and brand warmth without being garish.

**Do not adjust the palette arbitrarily.** Keep it on-brand.

### 5.2 Player token palette

Six vivid, distinct colours — one per member, each with a visible glow ring using that colour:

| Slot | Name | Hex |
|------|------|-----|
| 1 | Violet | `#9B4DBB` |
| 2 | Magenta | `#E040FB` |
| 3 | Cobalt | `#4087FF` |
| 4 | Teal | `#00BCD4` |
| 5 | Amber | `#FFC107` |
| 6 | Coral | `#FF7043` |

### 5.3 Typography (Google Fonts — all free)

Import all three in `index.html`:

- **Display / headlines / brand wordmark / board cell numbers:** `Barlow Condensed` — weight 800 (ExtraBold). Bold, athletic, contemporary. Replaces generic heavy fonts. Used for the "ANYTIME FITNESS" wordmark, section headers, win banners, and the board's numbered cells.
- **Scoreboard / timers / dice context / stats numbers:** `Rajdhani` — weight 600 or 700. Tall, slightly futuristic, reads superbly as a numeric display. Use this exclusively for the exercise timer, the dice result, and all large numerical outputs.
- **Body / UI / cards / form labels:** `Outfit` — weight 400/500. Clean, modern, friendly. Matches AF's welcoming community gym identity.

Never use Inter, Roboto, Arial, or system fonts in the visible UI.

### 5.4 The board — premium game-board feel

- A **10×10 SVG board** with **boustrophedon numbering** (1–10 left→right on row 1, 11–20 right→left on row 2, continuing to 100 at top-left).
- Board background: a deep plum/indigo felt-like texture (SVG pattern or CSS radial gradient — `#1A103D` base with a subtle diamond or crosshatch pattern at low opacity). Frame it with a visible border-radius and a soft outer glow in `--purple-glow`.
- Each cell: a slightly lighter fill (`#221644`), clean inner border, rounded corners. The number in `Barlow Condensed` 800 weight, `--text-muted` colour. Cell 100 should be distinctly styled as the **WIN** cell (gold ring, star or trophy icon).
- Cells with an exercise assigned show a small **dumbbell or flame icon** in `--brand-purple-l`; tapping/hovering reveals the exercise name and amount in a tooltip.

### 5.5 Snakes — vivid, legible, characterful

- Each snake is a **flowing SVG cubic Bézier path** from head (high `from` cell) to tail (low `to` cell).
- **Body:** a rich gradient — deep emerald to vivid green (`#1B5E20` → `#43A047` → `#76FF03`) with a repeating scale pattern (SVG `<pattern>`) overlaid at low opacity, and a subtle highlight stripe along the top edge.
- **Head:** at the `from` (higher) cell — round head shape with white eyes + red pupils, a forked tongue in red. Draws clear attention to the danger cell.
- **Tail:** tapered, ending at the `to` (lower) cell.
- Subtle idle **slither animation** (a slow SVG path morph or CSS transform oscillation, ~4s loop). On use: the player token follows the snake's Bézier curve downward in a smooth motion.

### 5.6 Ladders — premium metallic, legible

- Each ladder is **two metallic rails + evenly-spaced rungs** from bottom (`from` cell) to top (`to` cell).
- **Style:** a rich gold-to-champagne metallic gradient (`#B8860B` → `#FFD700` → `#FFF8DC`), rail width 6px, rungs every ~30px, cast a soft drop-shadow (`rgba(255, 215, 0, 0.25)`) below them. This makes ladders read as premium rewards sitting above the board.
- Idle state: a gentle shimmer animation (CSS keyframe on the gradient position).
- On use: the player token climbs rung-by-rung to the top in a smooth hop sequence.

### 5.7 Dice — the centrepiece of every turn

- A large **3D CSS cube die** (six faces, CSS `transform-style: preserve-3d`, `perspective`) rendered in the primary gameplay area.
- **Styling:** faces are a clean off-white (`--accent-white`) with `--brand-purple` circular pips for each value; the cube itself has a very slight purple-tinted edge shadow.
- **Roll animation:** the cube tumbles realistically (randomised intermediate rotation before landing on the result) with a physics-feel easing (`cubic-bezier(0.175, 0.885, 0.32, 1.275)` settle). The tumble should feel weighty — this is the moment players wait for.
- After settling, the result face snaps cleanly to the viewer with a brief scale-up-and-settle.
- Make the **ROLL button** large, prominent, and in `--brand-purple` — this is the primary CTA during play.

### 5.8 Gameplay screen — designed for a large gym display

This screen is likely shown on a **gym TV or projector**. Design it to look great at 1080p or larger: large dice, large timer, clear "whose turn" banner readable from across the room. Keep it usable on a laptop/tablet too (responsive).

**Layout suggestion (large screen):** three-column — left rail (live leaderboard + positions), centre (board SVG, large dice, active exercise), right rail (turn log, key assignments). On tablet/laptop: collapse to two columns or a vertical stack.

---

## 6. Feature specification

### 6.1 Admin login (convenience gate)

A login screen gating the whole app. Password set on first run and stored (hashed) in localStorage. On success, set an `isAdmin` flag in session state. Clearly label as a basic gate in the UI (§3.1). A "Log out" control in the app shell.

### 6.2 Settings + data backup

- **Export data:** download the entire localStorage namespace as a timestamped `.json` file.
- **Import data:** upload a previously exported `.json` and restore it (with a confirmation step before overwriting).
- Change admin password.
- Toggle sound on/off (§7.5).
- Notes about device-only storage and a nudge to export regularly.

### 6.3 Members management (global)

- A members directory: list with name, colour swatch, initials, archived status.
- Add member (name + auto-assigned distinct colour from the token palette, editable). Edit member. Archive / un-archive (never permanently delete).
- This roster is **global and permanent** — the same members are selectable in every class, for the whole life of the app.

### 6.4 Classes

- A classes list (name, date, status, participant count). Create a new class: name, date, **pick a game** (only "Snakes & Ladders" for now — present it as a chooser so more games can be added later), then proceed to build the board.
- Open an existing class to continue setup, start/resume play, or view its results.

### 6.5 Snakes & Ladders board builder (visual editor)

A visual editor with a **live preview of the actual rendered board** (reusing the real renderer from §5.4–5.6) updating as the admin edits:

- **Add snake:** pick head box and tail box; validate `head > tail`.
- **Add ladder:** pick bottom box and top box; validate `bottom < top`.
- **Exercises per box:** click any cell to assign/edit its exercise `{ name, mode: reps|duration, amount }`, or clear it. Boxes can be left empty (no exercise that turn).
- **Validation (block invalid configs with clear error messages):** all boxes 1–100; snakes go down, ladders go up; a single box cannot be both a snake endpoint and a ladder endpoint; no two snakes share a head; no two ladders share a bottom; apply sensible classic Snakes & Ladders constraints for boxes 1 and 100.
- **"Load sample board"** button: a ready-made set of snakes, ladders, and example gym exercises so the trainer can start immediately.
- **"Clear board"** button.

### 6.6 Pre-game setup (per class, before play)

1. **Select participants** for this class from the global member roster.
2. **Assign a unique keyboard key to each participant.** This is the key they physically press to mark their exercise complete. UI: each participant has an "Assign key" control that captures the next keypress (or pick from a list: A–Z, 0–9). **Enforce uniqueness** across participants. Show each player's assigned key prominently on their card. `preventDefault` on assigned keys during play so they don't trigger browser shortcuts.
3. **The toss (randomise turn order):** an animated **roll-off** — each participant rolls the 3D die on-screen; sort highest→lowest to determine 1st, 2nd, 3rd… order; re-roll ties automatically. Reveal the final running order clearly with a brief animated reveal. Make it a fun moment.
4. "Start game" → gameplay screen.

### 6.7 Gameplay loop

Turn-based, following the toss order, looping until the admin ends the class. Implement as a clear state machine:

`IDLE` (banner: "💜 {Player}'s turn — ROLL") → `ROLLING` (die tumbles, lands on 1–6) → `MOVING` (token hops cell-by-cell with a small arc to the target box) → `TRANSPORT` (if landed box is a snake head or ladder bottom: token slides down the snake / climbs the ladder, animated along the actual graphic) → `EXERCISE` (if the relevant box has an exercise: display it large with an **Anytime Fitness–styled card**, start a **count-up timer** in `Rajdhani` font, wait for this player's assigned key) → `COMPLETE` (on correct key: stop timer, record `TurnRecord`, brief `--success`-coloured celebration) → next player → `IDLE`.

**Rules:**
- Dice 1–6, fair random.
- Landing on a snake head → token slides to tail. Landing on a ladder bottom → token climbs to top. Both animated.
- **Exercise timing — DECISION (default chosen):** the exercise is the one on the box **where the dice initially lands** (before any snake/ladder transport). The snake/ladder then relocates the token without triggering a second exercise. If that landing box has no exercise, the turn has no exercise. *Confirm this, or flip it to "use the final box after transport."*
- **Completion key:** global `keydown` listener. During a player's `EXERCISE` window, **only that player's assigned key** stops their timer and completes the turn. All other keys are ignored. `preventDefault` on all assigned keys during play.
- **Win condition — DECISION (default chosen):** **reaching or passing 100 wins** (overshoot still counts; token caps at 100). First to 100 gets a winner badge — purple crown icon, a brief confetti burst in brand purple and white, optional fanfare. *Confirm this, or switch to classic "must land exactly on 100, overshoot = no move."*
- **Everyone continues:** winning does not end the game. All players keep rolling and completing exercises. Track `finishedRank` as players reach 100. Admin can **"End Class"** anytime; also offer to end when all players have finished.
- **Live gameplay UI:** large die, active player banner, current exercise + count-up timer (transitions to `--warning` amber as it grows), live leaderboard rail (board positions, who's won), each player's assigned key shown on their avatar chip.

### 6.8 End-of-class stats

A results screen shown when a class ends. Per participant:
- **Workout volume:** total reps + total seconds + exercise count (e.g. "180 reps · 240 s · 9 exercises").
- **Time:** total active exercise time, average time per exercise, fastest exercise.
- **Outcome:** final board position, finish rank, winner badge (💜), number of rolls.

A clear ranked comparison across all participants — a styled post-match scoreboard card per player, sortable by volume, speed, or position. Viewable again later from the class detail screen.

### 6.9 Member profile — cross-class improvement

Per-member profile screen showing progress **across all classes they have played** (Recharts):
- Classes attended (count + dates).
- **Workout volume per class over time** (bar or line trend).
- **Average exercise completion time per class** (line trend — lower = faster/fitter; label this clearly as improvement with a subtle downward-arrow motif).
- Lifetime totals: reps, exercise time, classes played, wins.
- Personal records: fastest exercise, highest single-class volume.
- Frame it motivationally ("Getting stronger. Getting faster."), on-brand purple.

---

## 7. Polish and details

1. **App shell:** branded header with "ANYTIME FITNESS" (Barlow Condensed 800, `--brand-purple`) + "— Canberra City" subtitle. The `<div id="brand-logo">` placeholder slot is clearly commented for the official logo asset. Clean nav (Dashboard, Classes, Members, Settings). Dashboard landing page with quick actions and recent activity.
2. **Empty states:** every list (no members, no classes, no exercises) gets a designed empty state with a clear CTA. Never a blank screen.
3. **Responsiveness:** great on desktop/laptop and tablet; gameplay screen optimised for a large gym display. Mobile at least usable for setup.
4. **Accessibility basics:** WCAG AA contrast ratios (especially purple on dark backgrounds — test carefully), visible focus states, keyboard navigability, `prefers-reduced-motion` respect.
5. **Sound (optional, behind a mute toggle):** dice roll, exercise-complete chime, winner fanfare. Use Web Audio API or tiny generated tones. Default off.
6. **Performance:** lazy-load heavier screens (board builder, gameplay, charts). Keep the bundle lean.

---

## 8. Suggested build order (milestones)

Build incrementally. **After every milestone, run `npm run build` to confirm it compiles, then commit with a clear message.** Pause for feedback at the marked checkpoints.

1. **Scaffold & design system** — Vite + React + TS + Tailwind + HashRouter; fonts (Barlow Condensed / Rajdhani / Outfit); CSS custom properties; base components (button, card, modal, input); app shell; admin login gate. *(Checkpoint: show the shell + login.)*
2. **Data layer** — typed localStorage store, Context provider, export/import JSON.
3. **Members management** — global CRUD + archive.
4. **Classes** — list, create, pick game.
5. **Board builder** — snakes/ladders/exercises + validation + live preview + sample board.
6. **Board renderer** — the polished SVG board, snakes, ladders, exercise markers, tokens. *(Checkpoint — critical: show it and iterate on the graphics before moving on.)*
7. **Pre-game setup** — select participants, assign unique keys (uniqueness enforced), animated toss/roll-off.
8. **Gameplay loop** — 3D dice animation, token movement, snake/ladder transport, exercise timer, key-press completion, win detection, continue-for-all, end class. *(Checkpoint: play a full test game.)*
9. **End-of-class stats.**
10. **Member profile / cross-class improvement charts.**
11. **Polish pass** — animations, empty states, big-screen gameplay layout, optional sound, accessibility, responsiveness.
12. **Deploy** — `.github/workflows/deploy.yml`, set `base` to the repo name, README with setup + Pages instructions; verify the live URL works including on refresh.

---

## 9. Definition of done

- Admin can log in, create a class, build a fully custom Snakes & Ladders board with exercises, and the board renders with genuinely attractive snakes, ladders, and a 3D die.
- Admin can create members once and reuse them across classes; all data survives page reloads (localStorage) and can be exported/imported as JSON.
- A class can be set up (participants chosen, unique keys assigned, toss run), played end-to-end (rolling, moving, snake/ladder transport, per-box exercises with timers, key-press completion), with the winner at 100 while everyone continues.
- End-of-class stats show each player's workout volume and timings; member profiles show cross-class improvement with charts.
- The app builds cleanly and is **live on GitHub Pages** with refresh-safe routing.
- The three signature visuals — **snakes, ladders, dice** — look polished and distinctly on-brand with the Anytime Fitness purple identity.

---

## 10. Working agreement

- When a **DECISION** point or the **repo name** comes up, ask concisely. Otherwise proceed with the defaults — don't stall.
- Prefer clean, typed, well-organised code with small components; keep the data layer isolated so a Firebase swap is feasible later.
- Be honest in code comments and the README about the security/storage limitations.
- Quality of the UI and game graphics is the top priority. The Anytime Fitness brand is specific — stay on-palette, stay on-typography, make it look genuinely professional.
