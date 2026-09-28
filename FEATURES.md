# Prepwise — Complete Feature & Functionality Reference

Everything the application does, organized by page/module. Use this as a
checklist while demoing or defending the project.

---

## 1. Authentication

| Feature | Details |
|---|---|
| Register | Email + password (8+ chars, 1+ digit). Duplicate email correctly rejected with a clear message. |
| Login | Email + password. Wrong credentials rejected with a generic "invalid email or password" (doesn't reveal which field was wrong, for security). |
| Logout | Clears session, redirects to login. |
| Session persistence | Refreshing the page keeps you logged in (httpOnly cookie, verified via `/api/auth/me` on load). |
| Change password | Settings page — requires current password, validates the new one, rejects wrong current password without changing anything. |
| Route protection | Every page except Login/Register requires a valid session; visiting a protected URL while logged out redirects to Login. Already-logged-in users are redirected away from Login/Register. |

## 2. Career Profile (`/profile`)

- Full name, education level, degree, experience level, target role (dropdown, sourced from backend), preferred industry, key skills (free-text tags), career goal.
- Loads existing data on open; empty on a brand-new account.
- Upsert: first save creates the profile, every save after updates it.
- Used elsewhere: target role feeds Role Skill Coverage in the readiness score; name feeds the Dashboard greeting.

## 3. Preparation / Skill Tracking (`/preparation`)

- Slider (0–100) for 6 technical skills (Programming, DSA, DBMS, OOP, Operating Systems, Computer Networks) and 4 soft skills (Communication, Confidence, Problem Explanation, Project Explanation).
- Shows "Not yet rated" until a skill is saved for the first time.
- Every save is stored as a new dated snapshot (history preserved, not overwritten) — this is what allows progress-over-time tracking later.

## 4. Interview Experience Log (`/interviews`)

- **List**: cards with company, date, type, round, color-coded result badge (green=selected, red=rejected, amber=pending), struggle-area tags. Clear empty state on a new account.
- **Add / Edit** (same form): company name, date, target role, interview type, round, result, 1–5 rating scale for technical/communication/confidence/project-explanation performance, guided multi-select struggle-area tags, optional interviewer feedback and free-text description.
- **Detail view**: read-only summary, Edit and Delete (delete requires an inline confirmation, not instant).
- **Ownership enforced**: one user can never read, edit, or delete another user's interview (returns 404, doesn't even confirm it exists).
- **Triggers re-analysis**: every create/update/delete automatically re-runs pattern detection and updates the readiness score.

## 5. AI Pattern Detection (backend + Python service, surfaces on `/patterns`)

- Runs automatically after every interview change — never manually triggered, never stale.
- **Three-signal pipeline**:
  1. Structured struggle-area tags (most reliable — direct counting).
  2. Keyword-category matching on free text (correctly links differently-worded complaints about the same issue, e.g. "SQL joins" and "database questions" → one DBMS/SQL pattern).
  3. Semantic clustering (embeddings) as a fallback, only for text that matches no known category — catches genuinely novel patterns.
- A pattern only exists once something recurs in 2+ interviews.
- Each detected pattern shows: category, frequency (High/Medium/Low), trend (improving / getting worse / stable / not enough data yet).
- Graceful degradation: if the AI service is down, interviews still save; existing patterns aren't wiped.

## 6. Personalized Recommendations (`/recommendations`)

- Generated automatically from detected patterns — different text for different patterns, not one generic message for everyone.
- Priority (high/medium/low) derived from frequency **and** trend — a pattern already improving gets an encouraging low-priority note instead of a false alarm.
- Dismissible; dismissed state is preserved even when patterns are re-analyzed.
- Rule-based knowledge base (not another ML model) — kept explainable and easy to extend with new categories.

## 7. Interview Readiness Score (shown on Dashboard, computed by `/api/readiness`)

- Transparent weighted formula: Technical (30%), Communication (20%), Confidence (15%), Role Skill Coverage (20%), Improvement Trend (15%).
- **Never a fabricated number** — with zero interviews logged, shows `null` with clear reasons instead of a fake percentage.
- Missing data (e.g. no target role set) excludes that component from the average entirely (renormalized), rather than counting it as zero.
- Unresolved recurring patterns cost points (capped); a pattern that's already improving is NOT penalized.
- Full breakdown always shown — every component's value and whether it was available.

## 8. Dashboard (`/`, the home page)

- Quick stats: interviews logged, patterns detected, active recommendations.
- Readiness Score card with full breakdown.
- Preparation Progress chart (bar chart of current skill levels).
- Recurring Patterns chart (bar chart, color-coded by trend).
- Top 2 recommendations preview with a link to the full list.
- Personalized greeting using your actual profile name.

## 9. Progress & Monthly Comparison (`/progress`)

- A snapshot of your readiness numbers is recorded automatically every time the Dashboard loads (one per calendar month, upserted — revisiting the same month updates it rather than duplicating).
- Readiness trend line chart across all recorded months.
- Month-to-month comparison card: readiness, technical, communication, confidence, role coverage — each with from → to → delta, color-coded (green = improved, red = declined).
- Per-category pattern-occurrence comparison (e.g. "DBMS/SQL: 5 → 2 occurrences").

## 10. Settings (`/settings`)

- View account email.
- Change password (current + new + confirm), same validation rules as registration.

## 11. Navigation & Layout (every page)

- Persistent sidebar on desktop; collapsible hamburger drawer on mobile (closes via backdrop click or Escape key).
- Fully responsive down to phone width — verified breakpoints on every page, not just shrunk desktop layouts.
- Consistent design system: one color palette, one type system (Sora for headings, IBM Plex Sans for body, IBM Plex Mono for data/scores), shared components (buttons, form fields, banners, loaders, empty states) reused everywhere rather than rebuilt per page.
- Accessibility: WCAG AA color contrast (verified with actual computed ratios, not eyeballed), 44×44px minimum touch targets, correct heading hierarchy on every page, keyboard-navigable (including the mobile drawer), visible focus states throughout.

---

## 12. Downloadable PDF Readiness Report (added extra, not in original spec)

- One-click download from the Dashboard: a PDF summarizing your readiness
  score with full breakdown, every recurring pattern with its evidence
  (frequency, trend, dominant reason), and all active recommendations.
- Generated fresh from current data every time, using a free local PDF
  library — no external service, no paid API.
- Same honesty principle as the rest of the app: a user with no data yet
  gets a PDF that says so clearly, rather than a fabricated score.
- Intended use: something to hand to a mentor, placement officer, or
  parent — a shareable artifact the app didn't otherwise produce.

---

## What's intentionally NOT in the app

- No mock interviews or coding practice — the app analyzes experiences you had elsewhere, per the original project brief.
- No paid APIs, no paid hosting, no paid database — everything runs free and locally (MongoDB Community, open-source Python/JS stack).
- Settings currently covers only account/password — no theme toggle, notification preferences, or account deletion (easy to add later following the same pattern as the change-password feature, if wanted).

---

## Testing coverage (for reference)

- **77 backend tests** across 14 files — auth, profile/skills, interviews (including cross-user isolation), patterns/recommendations, readiness score (exact numeric assertions), progress comparison (exact numeric assertions), change password.
- **15 AI service tests** — the exact project-spec example (DBMS/SQL + Confidence detection), edge cases, trend direction in both directions.
- Multiple full end-to-end tests that spin up a real MongoDB and, in one case, the real Python AI service as a child process, driving the entire system through the actual app rather than mocks.
