# Anytime Fitness – Canberra City · Snakes & Ladders Workout Game

A polished, single-page web app that gamifies group workouts. Members play a
physical **Snakes & Ladders** game; landing on a square triggers a real
exercise, and the app tracks who worked out how much, how fast, and how they
improve over time across sessions.

The **trainer (admin)** runs everything on a laptop/tablet, ideally cast to a
gym TV or projector. Members are the players — they don't log in, they just
play and press their key when they finish an exercise.

Built with **React + Vite + TypeScript**, **Tailwind CSS**, **Motion**,
**Recharts**, and **react-router-dom** (HashRouter). Static front-end with an
optional **Firebase** (Auth + Firestore) backend for real login and
cross-device sync — falls back to localStorage when Firebase isn't configured.

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

## Firebase: real login + cross-device sync

The app works out of the box in **localStorage mode** (data on one device, a
convenience-gate password). To enable **real authentication and a shared,
cross-device gym dataset**, connect Firebase — the app auto-detects the config
and switches to cloud mode.

This build is configured for:
- **Email & password** sign-in (Firebase Auth).
- **Approved-emails only** access (enforced in `firestore.rules`).
- **One shared gym dataset** — all approved trainers see the same data, synced
  in real time, stored at Firestore path `app/shared`. Offline-capable.

### One-time Firebase setup

1. Create a project at <https://console.firebase.google.com>.
2. **Authentication → Sign-in method → Email/Password → Enable.**
3. **Firestore Database → Create database** (Production mode is fine).
4. **Firestore → Rules:** paste the contents of [`firestore.rules`](./firestore.rules),
   **edit the `approvedEmails()` list** to your trainer email(s), and **Publish**.
   (This is the real access gate.)
5. **Project settings → Your apps → Web app (`</>`)** → copy the `firebaseConfig`
   values.

### Wire the config in

- **Local dev:** copy `.env.example` to `.env` and fill in the `VITE_FIREBASE_*`
  values (plus `VITE_ADMIN_EMAILS` for a friendly "not authorised" message).
- **GitHub Pages deploy:** add each `VITE_FIREBASE_*` (and `VITE_ADMIN_EMAILS`)
  as a repository secret under **Settings → Secrets and variables → Actions →
  New repository secret**. The deploy workflow injects them at build time. Push
  to `main` (or re-run the workflow) to rebuild with Firebase enabled.

The Firebase **web config is not secret** — it ships to the browser by design;
security comes from Auth + the Firestore rules.

> **Note on storage shape:** the entire dataset is kept in a single Firestore
> document (`app/shared`), mirroring the original single-blob model. That's well
> within Firestore's 1 MB/document limit for a gym's worth of members, classes,
> and history. If a single location accumulates many years of data, splitting
> into per-entity collections would be the next step.

The **Settings** page shows whether you're in Cloud (Firebase) or Local mode.

---

## Honest limitations (please read)

**With Firebase configured (Cloud mode):**

1. **Real authentication** via Firebase Auth (email/password), with access
   limited to **approved trainer emails** enforced by `firestore.rules`. Keep
   that email list current — it's the real gate.
2. **Data is shared and synced** across approved trainers/devices via Firestore,
   with offline support. The whole dataset is one document (well under the 1 MB
   limit for a gym; see the storage-shape note above).
3. **Export / Import JSON** in Settings still works as an extra offline backup.

**Without Firebase (Local mode — the default fallback):**

1. **The admin login is a convenience gate, not real security.** The check runs
   in the browser, so a technical user could bypass it. Don't reuse an important
   password.
2. **Data is stored only in this browser, on this device** (`localStorage`).
   Clearing browser data or switching devices loses it — **export regularly**.
3. Configure Firebase (above) to upgrade to real accounts + cross-device sync.

The persistence layer is isolated behind `src/lib/store.ts` +
`src/lib/firebase.ts`, and the store context (`src/lib/storeContext.tsx`)
selects the backend automatically based on whether Firebase config is present.

---

## Project structure

```
src/
  components/        UI kit, app shell, board renderer, dice, avatars
    board/           BoardView, Snake, Ladder (the SVG game graphics)
    ui/              Button, Card, Modal, Input, Badge, EmptyState
  lib/
    store.ts         localStorage persistence + data normalisation
    firebase.ts      Firebase Auth + Firestore init (cloud backend)
    storeContext.tsx React context: typed CRUD, auto-selects local/cloud backend
    authContext.tsx  auth state (Firebase email/password, or local gate)
    auth.ts          password hashing (local convenience gate)
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
