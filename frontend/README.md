# Frontend — Auth UI ("Prepwise")

## What's implemented in this phase

- Vite + React + React Router
- Design token system (`src/styles/tokens.css`) — colors, type, spacing,
  shared by every current and future page
- Split-screen auth layout with the "readiness pulse" brand signature
- Register and Login pages, fully wired to the real backend:
  - Client-side validation mirrors the backend's rules (email format,
    8+ char password with a digit) so users get instant feedback
  - Server-side errors (duplicate email, wrong password, etc.) are shown
    in a banner, field-level errors are mapped to the right input
  - Session is cookie-based (httpOnly, set by the backend) — no tokens
    stored in localStorage
- A protected home page that only renders once the backend confirms a
  valid session (`GET /api/auth/me`), otherwise redirects to `/login`
- Fully responsive: split screen on desktop/tablet, stacked compact
  layout on mobile (brand panel collapses to a thin header strip)

## Setup

Make sure the backend is running first (see `backend/README.md` — you need
`mongod` running locally and the backend's `.env` configured).

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**. The dev server proxies any request to
`/api/*` straight to the backend on port 5000 (see `vite.config.js`), so
the frontend never needs to know the backend's port directly.

## How to verify it's working

1. Go to `http://localhost:3000` with the backend not logged into yet —
   you should be redirected to `/login`.
2. Click "Create an account", fill in an email and an 8+ character
   password with a number. Try a weak password first — you should see an
   inline error before it even hits the server.
3. Submit a valid registration — you should land on the home page,
   logged in, with your email shown in the top bar.
4. Refresh the page — you should stay logged in (this proves the session
   cookie + `/me` check works, not just in-memory React state).
5. Click "Log out" — you should be sent back to `/login`, and refreshing
   `/` should now redirect you to `/login` again.
6. Try registering the same email twice — the second attempt should show
   a clear "account already exists" banner, not a crash.
7. Resize your browser (or open dev tools' device toolbar) down to a
   phone width — the split-screen layout should collapse into a single
   stacked column with a compact top strip, not an overflowing desktop layout.

## Notes for the next phase

- `AuthContext` (`src/context/AuthContext.jsx`) exposes `user`, so any
  future page just calls `useAuth()` to get the logged-in user's data.
- `Button`, `FormField`, `SelectField`, `Banner`, `PageLoader` are shared
  components — Interview, Pattern, and Recommendation pages in the next
  phases reuse them directly rather than rebuilding form UI from scratch.
- The design tokens in `src/styles/tokens.css` are the single source of
  truth for color/spacing/type — new pages should pull from there, not
  introduce new one-off values.

---

# Phase 2 additions: sidebar navigation, Profile page, Preparation page

## What's new in this phase

- **`AppShell` + `Sidebar`** replace the old single topbar: a persistent
  navy sidebar on desktop (Dashboard, Profile, Preparation active;
  Interviews/Patterns/Recommendations/Progress/Settings marked "Soon" —
  they'll light up as their backends are built in later phases), collapsing
  to a hamburger-triggered slide-in drawer on mobile
- **Profile page** (`/profile`) — full career profile form, dropdowns for
  education/experience/target role sourced live from `/api/meta/options`,
  loads your existing profile on open, shows a clear success/error banner on save
- **Preparation page** (`/preparation`) — a slider per tracked skill
  (technical: Programming, DSA, DBMS, OOP, Operating Systems, Computer
  Networks; soft: Communication, Confidence, Problem Explanation, Project
  Explanation), shows "Not yet rated" until you save a value for the first time

## How to verify it's working

1. Log in, open the sidebar (hamburger icon on mobile, always visible on
   desktop) — Dashboard/Profile/Preparation should be clickable; the rest
   show a "Soon" badge and don't navigate anywhere.
2. Go to Profile. All fields should be empty on a brand-new account. Try
   submitting with required fields blank — you should see inline errors,
   not a crash.
3. Fill in the form and save — you should see a green success banner.
   Refresh the page — your saved values should still be there (proves it's
   reading from the real database, not just local state).
4. Go to Preparation. Every skill should show "Not yet rated" initially.
   Move a few sliders and save — refresh, and the sliders should hold
   their saved positions and show a percentage instead of "Not yet rated".
5. Resize down to mobile width — the sidebar should disappear behind a
   hamburger button, and both forms should remain fully usable (no
   horizontal scrolling, no overlapping fields).

---

# Phase 3 additions: Interview Records

## What's new in this phase

- **Interview list** (`/interviews`) — cards with company, date, type, round,
  a color-coded result badge, and struggle-area tags. Clear empty state on
  a brand-new account, "+ Add interview" button always visible.
- **Interview form** (`/interviews/new` and `/interviews/:id/edit`, same
  component) — guided struggle-area tag picker, 1–5 rating scale for each
  performance dimension, optional free-text fields for feedback and description.
- **Interview detail** (`/interviews/:id`) — read-only view with Edit and
  Delete (delete requires an inline confirmation step, not a silent click).
- Home page now has a direct "Log an interview experience" call to action.

## How to verify it's working

1. Go to Interviews — you should see the empty state with a clear message
   and an "Add your first interview" button.
2. Click it, fill out the form (try leaving required fields blank first —
   you should get inline errors before it even reaches the server), select
   a few struggle-area tags, pick ratings, and save.
3. You should land back on the list with your new interview showing as a
   card, with the correct result badge color (green/selected,
   red/rejected, amber/pending).
4. Click into the card — you should see everything you entered, correctly
   read back.
5. Click Edit, change something, save — the detail page should reflect the change.
6. Click Delete — you should see a confirmation prompt before anything is
   actually deleted, not an instant destructive action.
7. Add 2–3 more interviews with different companies and struggle areas —
   this is the data Phase 4 (pattern detection) will analyze next.

---

# Phase 5 additions: Pattern Analysis + Recommendations pages

## What's new in this phase

- **Pattern Analysis page** (`/patterns`) — cards showing each detected
  recurring pattern's category, frequency (High/Medium/Low), and trend
  (improving/getting worse/stable), with a link through to the matching recommendation.
- **Recommendations page** (`/recommendations`) — priority-coded
  recommendation cards with real generated text (not the same message for
  everyone), each dismissible.
- Both pages require the backend to have the AI service running and
  reachable (see `backend/README.md`) — without it, interviews still save
  fine, but pattern detection won't run until it's back up.

## How to verify it's working

**Important: start the AI service first** (`cd ai-service && uvicorn
app.main:app --port 8000`), then the backend, then the frontend — see the
main setup instructions.

1. With fewer than 2 interviews logged, go to Pattern Analysis — you
   should see the "No recurring patterns detected yet" empty state, not
   a blank or broken page.
2. Log at least 2 interviews describing a similar struggle in different
   words — for example: "I struggled with SQL joins" on one, and "I could
   not answer database questions" on another (no need to use the exact
   same words — that's the point).
3. Go to Pattern Analysis — you should now see a "DBMS/SQL" (or similar)
   pattern card showing frequency 2 and a trend.
4. Go to Recommendations — you should see a recommendation tied to that
   same category, with real specific text (not a generic placeholder).
5. Click Dismiss on a recommendation — it should disappear from the list.
6. Edit or delete one of the two interviews so the pattern's underlying
   data no longer supports it — go back to Pattern Analysis and confirm
   the pattern updates or disappears accordingly (this proves it's
   recomputed from real data on every change, not cached/static).

---

# Phase 6 additions: Readiness Score

## What's new in this phase

- A **Readiness Score card** now appears on the Dashboard (home page),
  showing the overall percentage plus a full breakdown: Technical
  readiness, Communication, Confidence, Role skill coverage, Improvement
  trend — each with its own bar so you can see exactly why the score is
  what it is, not just a bare number.
- With no interviews logged yet, the card shows a clear "not ready yet"
  state with the specific reasons, instead of a fabricated 0% or 50%.
- A component the user hasn't provided data for yet (e.g. no target role
  set) shows "Not enough data" for that row rather than silently
  counting as zero.

## How to verify it's working

1. On a fresh account with zero interviews, go to Dashboard — the
   readiness card should say your score isn't ready yet, with a link to
   log an interview.
2. Log 1-2 interviews — the card should now show a real percentage and a
   breakdown with bars for each component.
3. If you haven't set a target role in Profile, the "Role skill coverage"
   row should say "Not enough data" rather than showing 0%.
4. Go to Preparation and rate a few skills, then refresh Dashboard — the
   Technical/Communication/Confidence bars should shift to reflect the
   blended skill + interview performance data.
5. If Pattern Analysis shows any unresolved recurring pattern, the
   readiness card should show a small penalty note explaining the point
   deduction.

---

# Phase 7 additions: full Dashboard with charts

## What's new in this phase

The Dashboard (home page, `/`) is now the real landing page pulling
everything together in one view:

- **Quick stats row** — interviews logged, patterns detected, active recommendations
- **Readiness Score card** (from Phase 6)
- **Preparation progress chart** — horizontal bar chart (via [Recharts](https://recharts.org),
  a free charting library) of your current skill levels, technical skills
  in indigo, soft skills in violet
- **Recurring patterns chart** — bar chart of pattern frequency,
  color-coded by trend (red = getting worse, green = improving, gray = stable)
- **Top 2 recommendations** preview, with a link through to the full
  Recommendations page
- All of it fetched in parallel on page load (`Promise.all`) rather than
  waterfalling one request after another

## How to verify it's working

1. On a fresh account, go to Dashboard — quick stats should all show 0,
   both charts should show their empty states ("rate your skills...",
   "no recurring patterns yet..."), and the readiness card should show
   its "not ready yet" state. Nothing should look broken or blank.
2. Fill in Preparation with a few skill levels — refresh Dashboard, the
   preparation progress chart should now show real bars matching what
   you entered.
3. Log 3+ interviews with a repeated struggle area (see Phase 5's
   verification steps for the exact wording trick) — refresh Dashboard,
   the patterns chart should show a bar, and a recommendation should
   appear in the preview section.
4. Resize to mobile width — the two charts should stack vertically
   instead of squeezing side-by-side, and the quick stats should stack
   into a single column.

---

# Phase 8 additions: Progress + Monthly Comparison page

## What's new in this phase

- **Progress page** (`/progress`) — a readiness trend line chart across
  every recorded month, plus a month-to-month comparison card showing
  each score component's from/to/delta and a per-category comparison of
  recurring pattern occurrences (color-coded: green when an issue is
  shrinking, red when it's growing).
- A monthly snapshot is recorded automatically every time the Dashboard
  loads — there's no manual "save snapshot" step.

## How to verify it's working

1. On a fresh account, go to Progress — you should see "No progress
   history yet" with a link back to Dashboard, not a blank page.
2. Visit the Dashboard (which records this month's snapshot), then go
   back to Progress — you should now see a readiness trend chart with one
   point, and a message saying a comparison will appear once a second
   month is recorded (not an error).
3. Since testing a real second calendar month isn't practical in one
   sitting, trust the backend's `test:progress` suite for the comparison
   math itself — it's tested against the exact numbers from the project
   spec's example (a June → August comparison).
---

# Phase 9: Responsive & accessibility polish pass

A dedicated audit pass across every page, not just new features. Real
issues found and fixed:

## Color contrast (WCAG AA)

Computed actual contrast ratios rather than eyeballing them. Found that
`--slate-400` (the lighter muted gray), when used as text on white/paper
backgrounds, measured **3.03–3.21:1** — below the 4.5:1 WCAG AA minimum
for normal text. This affected real, always-visible content: form hints,
loading messages, empty-state text, "not enough data" labels, chart axis
labels, and comparison values. Every one of those was swapped to
`--slate-600` (7.91:1 — comfortably passes AA). Two uses were correctly
left as-is: `::placeholder` text (exempt from WCAG contrast rules) and a
small decorative trend-indicator dot that's always paired with an
adjacent text label.

## Touch targets

The mobile hamburger button (32×32px) and the 1–5 rating-scale buttons
(38×38px) were both under the 44×44px minimum recommended for touch
targets. Both increased to 44×44px; the checkbox/tag buttons (struggle
areas) got slightly more padding for the same reason.

## Keyboard accessibility

- The mobile navigation drawer now closes on **Escape**, not just by
  clicking the backdrop.
- Fixed a real keyboard trap: the off-canvas mobile sidebar was
  translated out of view with CSS `transform`, but its links remained
  keyboard-focusable even while invisible — a keyboard user tabbing
  through the closed menu would land on links they couldn't see. Fixed
  with a `visibility` transition that removes it from the tab order only
  once fully hidden.
- The 1–5 rating buttons now have a reliable `aria-label` (e.g. "4 -
  Good") instead of relying on a `title` tooltip, which isn't
  consistently announced by screen readers.

## Heading hierarchy

Three pages (Interviews, Pattern Analysis, Recommendations) jumped
directly from `<h1>` to `<h3>` on their card titles, skipping `<h2>`
entirely — this breaks section navigation for screen reader users who
jump by heading level. Fixed to `<h2>` on all three.

## Code consistency

Replaced a few inline `style={{ ... }}` shortcuts (static values, not
dynamic data) with proper CSS classes, keeping every static style
traceable to the design token system rather than one-off exceptions.

---

# Post-Phase-10 addition: Settings page

The Settings nav item is no longer a "Soon" placeholder.

## What's new

- **Settings page** (`/settings`) — shows your account email, and a
  change-password form (current password, new password, confirm new
  password) with the same validation rules as registration.

## How to verify it's working

1. Go to Settings — you should see your email and a change-password form,
   not a "coming soon" message.
2. Try submitting with the wrong current password — you should see a
   clear error, and your actual password should be unchanged (try logging
   out and back in with your original password to confirm).
3. Change your password correctly — you should see a success message.
4. Log out and log back in with the NEW password — it should work. Try
   the old password — it should fail.

---

# Post-Phase-10 addition: Pattern Analysis overhaul (flagship page)

Pattern Analysis is now the clear centerpiece of the app, not one page
among equals.

## What's new

- **"Why did you struggle?" checkbox group** on the interview form —
  separate from "which areas did you struggle with", capturing the root
  cause (Didn't know the concept, Became nervous, Ran out of time, etc.),
  shown on the interview detail page too.
- **"Top Priority to Improve"** — a highlighted callout at the top of
  Pattern Analysis showing the single most urgent recurring weakness.
- **Evidence on every pattern card** — "Detected across 4 of 6
  interviews — not from any single one," the dominant reason if recorded,
  and a list of exactly which interviews (company + date) contributed.
- **"What Improved"** section — patterns with an improving trend get
  their own highlighted (green) section, separate from the main list.
- **Interview Timeline** — every interview shown chronologically with its
  result and struggle areas, so you can visually see how weaknesses
  shifted over time.
- **Recommendations now show "Why"** — each recommendation card displays
  "detected in X of Y interviews · trend: ..." before the recommendation
  text itself, so it's never just generic advice.

## How to verify it's working

1. Log an interview and try the new "Why did you struggle?" section —
   select a reason like "Became nervous", save, then view the interview
   detail page — it should show under "Why it happened".
2. Log 2+ interviews with the same struggle area AND the same struggle
   reason — go to Pattern Analysis, the pattern card should show "Most
   common reason recorded" matching what you selected.
3. Check the evidence list under any pattern card — it should list the
   exact companies/dates of the interviews that contributed, not just a count.
4. If you have an improving pattern, confirm it appears in its own "What
   Improved" section, styled distinctly (green) from the main list.
5. Scroll to the bottom of Pattern Analysis — you should see every
   interview listed chronologically in the Interview Timeline.
6. Go to Recommendations — each card should show a "Why:" line above the
   recommendation text.

---

# Added feature: Download Readiness Report (PDF)

## What's new

- A "Download Readiness Report (PDF)" button on the Dashboard, shown once
  a real readiness score exists (not shown for a brand-new account with
  no score yet).
- Clicking it downloads a PDF with your score breakdown, recurring
  patterns (with evidence), and recommendations — generated fresh from
  your current data every time.

## How to verify it's working

1. On a fresh account with no interviews, go to Dashboard — the download
   button should NOT appear yet (there's no score to report).
2. Log at least one interview, go back to Dashboard — the button should
   now appear.
3. Click it — a PDF should download. Open it and confirm it shows your
   actual score, your actual patterns (if any), and your actual
   recommendation text — not placeholder text.
