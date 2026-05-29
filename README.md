# Anytime Fitness – Canberra City · Snakes & Ladders Workout Game

A polished, single-page web app that gamifies group workouts. Members play a
physical **Snakes & Ladders** game; landing on a square triggers a real
exercise, and the app tracks who worked out how much, how fast, and how they
improve over time across sessions.

The **trainer (admin)** runs everything on a laptop/tablet, ideally cast to a
gym TV or projector. Members are the players — they don't log in, they just
play and press their key when they finish an exercise.

Built with **React + Vite + TypeScript**, **Tailwind CSS**, **Motion**,
**Recharts**, and **react-router-dom** (HashRouter). 100% static — no backend.

---

## Quick start (local)

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
npm run preview  # preview the production build locally
```

First run asks you to set an **admin password** (see security note below).

---

## Deploying to GitHub Pages

This repo ships a GitHub Actions workflow that builds and publishes the site.

1. Push this repository to GitHub under the name **`yakamode`**.
   - The Vite `base` is set to `/yakamode/` in `vite.config.ts`. **If your repo
     name differs, change the single `REPO_NAME` line at the top of
     `vite.config.ts`** — otherwise assets 404 on Pages.
2. In GitHub: **Settings → Pages → Source: "GitHub Actions"**.
3. Push to `main` (or run the workflow manually from the Actions tab). The
   `.github/workflows/deploy.yml` workflow builds and deploys automatically.
4. Your site goes live at:
   **`https://<your-username>.github.io/yakamode/`**

**Refresh-safe routing:** the app uses `HashRouter`, so deep links and page
refreshes work on GitHub Pages without 404s (URLs look like `/#/classes`).

---

## Adding the official Anytime Fitness logo

The official Anytime Fitness logo (the "running man in a circle" + wordmark) is
**trademarked and is deliberately not recreated** in this app. The header uses a
text wordmark plus a placeholder "AF" monogram.

To drop in the real logo once you have the rights/asset:

1. Add your file to `src/assets/` (e.g. `logo.svg`).
2. Open `src/components/Wordmark.tsx` and replace the contents of the
   `#brand-logo` slot (clearly marked with `▼▼▼ Official-logo slot ▼▼▼`) with,
   for example:
   ```tsx
   import logoUrl from '../assets/logo.svg';
   // ...inside #brand-logo:
   <img src={logoUrl} alt="Anytime Fitness" className="h-10 w-10" />
   ```
   Importing through Vite keeps the path base-aware for GitHub Pages.

---

## How to run a class (trainer flow)

1. **Members** → add your gym community once. They're a permanent, global roster
   reused across every class.
2. **Classes** → New class → name, date, pick the game (Snakes & Ladders).
3. **Build board** → add snakes, ladders, and an exercise per box. Use
   **Load sample** for a ready-made board to start instantly. The builder
   validates the board live.
4. **Set up & play** → choose participants, assign each a **unique key**, run the
   animated **toss** to decide turn order.
5. **Play** → players take turns: roll the 3D die, the token moves, snakes/ladders
   transport it, and the box's exercise appears with a count-up timer. The player
   presses **their assigned key** when they finish. First to land **exactly on
   100** wins; everyone keeps playing until they finish or you **End class**.
6. **Results** → per-player workout volume, timings, and ranking.
7. **Member profiles** → cross-class improvement charts (volume up, average time
   down = getting fitter).

### Game rules in this build
- **Win:** must land **exactly on 100**; overshooting means no move that turn.
- **Exercise:** taken from the **final box after** any snake/ladder transport.

Both rules are stored per-board (`board.rules`) so the alternatives
("reach or pass 100", "exercise on the landing box") remain supported in code.

---

## Honest limitations (please read)

These are inherent to a free, backend-less static site. They're surfaced in the
app's **Settings** page too.

1. **The admin login is a convenience gate, not real security.** Any check runs
   in the browser, so a technical user could bypass it. It keeps casual users
   out — don't reuse an important password. Real authentication would require a
   backend (e.g. Firebase Auth) — **future work, not built**.
2. **Data is stored only in this browser, on this device** (`localStorage`).
   Clearing browser data or switching devices loses it. Because members and
   history must last "for the lifetime of the app," **Export / Import JSON** is a
   first-class feature in Settings — **export regularly** to back up and to move
   between devices.
3. **Optional future upgrade (not built):** swap the `localStorage` layer for
   **Firebase Firestore (free tier)** for true cross-device sync. The data layer
   is isolated behind `src/lib/store.ts` to make this swap feasible.

---

## Project structure

```
src/
  components/        UI kit, app shell, board renderer, dice, avatars
    board/           BoardView, Snake, Ladder (the SVG game graphics)
    ui/              Button, Card, Modal, Input, Badge, EmptyState
  lib/
    store.ts         the ONLY module that touches localStorage
    storeContext.tsx React context exposing typed CRUD over the store
    authContext.tsx  admin login session state
    auth.ts          password hashing (convenience gate)
    board.ts         board geometry, validation, sample board
    engine.ts        pure move resolution (roll → move → transport → win)
    stats.ts         derived stats (computed on read, never stored)
    sound.ts         Web Audio generated SFX (default off)
  pages/             Dashboard, Members, Classes, ClassDetail, BoardBuilder,
                     PreGame, Gameplay, Results, MemberProfile, Settings, Login
  types.ts           the full domain data model
```

---

## Accessibility & polish

- WCAG-minded contrast on the dark purple palette, visible focus rings,
  keyboard-navigable controls.
- Respects `prefers-reduced-motion` (animations are reduced/removed).
- Responsive: optimised for a large gym display, usable on laptop/tablet, and at
  least functional on mobile for setup.
- Heavy screens (board builder, gameplay, charts) are lazy-loaded.

---

*Generated with [Claude Code](https://claude.com/claude-code).*
