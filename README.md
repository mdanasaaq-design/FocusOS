# Anas Command Center

A private, single-user tracking system for backlog exams, Semester 5,
habits, and daily tasks — with real history stored in Firestore, not
disappearing checkboxes.

**Stack:** React + Vite + Tailwind CSS + Firebase (Auth + Firestore + Hosting)

---

## Phase 1 (this build)

- **Command Center** — deadline countdown, today's task/habit progress, streaks
- **Academics** — Subjects → Units → Notes, tagged Backlog / Semester 5, with
  a progress bar per subject
- **Tasks** — categorized (Academics / UPSC / Skills / Health / Personal /
  Finance), with a completed-history view
- **Habits** — 30-day grid, one tap per day, streaks computed automatically
- **Auth** — single email/password login; Firestore rules lock all data to
  your UID only

**Deferred to Phase 2:** UPSC/RCA tracker, Django/Skills roadmap board,
Health metrics with charts, weekly/monthly Reviews, Goals & Milestones page.
We build these next, once your backlog exam period is behind you.

---

## 1. Firebase Setup (do this first — ~5 minutes)

1. Go to **[console.firebase.google.com](https://console.firebase.google.com)**
   → **Add project** → name it e.g. `anas-command-center` → disable Google
   Analytics (not needed) → Create.
2. In the left sidebar: **Build → Authentication → Get started** → enable the
   **Email/Password** provider.
3. Still under Authentication → **Users** tab → **Add user** → enter your
   own email + a strong password. This is the *only* account that will ever
   exist in this app — that's what makes it private.
4. In the left sidebar: **Build → Firestore Database → Create database** →
   choose **Production mode** → pick a region close to India (e.g.
   `asia-south1`) → Enable.
5. Click the gear icon (top left) → **Project settings** → scroll to
   **Your apps** → click the **`</>`** (web) icon → register app (nickname:
   anything) → **do not** enable Firebase Hosting in this step.
6. Firebase will show you a `firebaseConfig` object with 6 values
   (`apiKey`, `authDomain`, `projectId`, `storageBucket`,
   `messagingSenderId`, `appId`). Keep this tab open — you'll need it next.

---

## 2. Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your local env file
cp .env.example .env

# 3. Open .env and paste in the 6 values from Firebase step 6 above
#    VITE_FIREBASE_API_KEY=AIza...
#    VITE_FIREBASE_AUTH_DOMAIN=anas-command-center.firebaseapp.com
#    ...etc

# 4. Run it locally
npm run dev
```

Open the printed `localhost` URL, sign in with the email/password you
created in Firebase step 3. On first login the app automatically seeds:
- Your Aug 28, 2026 backlog registration deadline
- Placeholder exam-window deadlines (edit the exact dates once your
  university confirms them)
- 4 empty "Subject" placeholders tagged `backlog` — rename these to your
  actual 4 backlog subjects, and add your Semester 5 subjects yourself
- A default habit list (Fajr, 5 prayers, study hours, workout, reading,
  no-social-media) — edit freely on the Habits page

---

## 3. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Command Center Phase 1"
git branch -M main
git remote add origin https://github.com/<your-username>/anas-command-center.git
git push -u origin main
```

`.env` is already git-ignored — your Firebase keys will **not** be pushed.
(This is fine either way: Firebase web API keys aren't secret by design,
your actual security comes from the Firestore rules in step 5 below —
but keeping `.env` local is still good hygiene.)

---

## 4. Deploy (Firebase Hosting)

```bash
npm install -g firebase-tools   # one-time
firebase login
firebase init hosting           # select your existing project, "dist" as public dir,
                                 # say YES to single-page app rewrite, NO to overwrite files

npm run build
firebase deploy
```

Firebase will print a live URL like `https://anas-command-center.web.app` —
bookmark it, add it to your phone's home screen (works like an app).

**Every time you want to push an update:** `npm run build && firebase deploy`

---

## 5. Deploy the Firestore Security Rules

This is what actually makes the database private to you. Run once (and
again any time `firestore.rules` changes):

```bash
firebase deploy --only firestore:rules
```

Without this step, Firestore defaults to **locked** (nobody can read/write)
until you deploy rules — so do this before you rely on the app.

---

## How This Grows Over Time

This repo is meant to be upgraded incrementally, not rebuilt. Suggested
sequence, matching your own roadmap priorities:

| When | Add |
|---|---|
| After backlog exams clear | Weekly/Monthly Reviews page (What did I complete / fail / learn) |
| Alongside UPSC prep starting | UPSC & RCA module: NCERT progress, PYQs, answer-writing log |
| Once Django roadmap reaches "Projects" | Skills & Career board: Django topics, GitHub links, internship tracker |
| Ongoing | Health metrics (weight log with chart), Goals & Milestones page |

Each addition is: 1 new page component, 1 new Firestore collection (same
`users/{uid}/...` pattern already used), 1 new sidebar link. The
architecture doesn't change — you're extending, not refactoring.

---

## Project Structure

```
src/
  lib/
    firebase.js     — Firebase app initialization
    auth.jsx        — auth context (login/logout/current user)
    data.js         — all Firestore read/write functions
    dates.js        — date math (streaks, countdowns, formatting)
  components/
    Sidebar.jsx
    Layout.jsx
    ProgressRing.jsx
  pages/
    Login.jsx
    Dashboard.jsx   — Command Center
    Academics.jsx
    Tasks.jsx
    Habits.jsx
firestore.rules      — database security rules
firebase.json         — hosting + firestore config
```
