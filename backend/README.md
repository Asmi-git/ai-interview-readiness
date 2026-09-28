# Backend — Phase 1: Foundation (Auth)

## What's implemented in this phase

- Express app with CORS, JSON body parsing, and httpOnly cookie support
- MongoDB connection via Mongoose, with a clear failure message (and fast 5s
  timeout) if no local `mongod` is running, instead of hanging or crashing silently
- `User` model with salted bcrypt password hashing (passwords are never stored
  or returned in plaintext)
- Register / Login / Logout / "who am I" endpoints
- JWT-based sessions, delivered as an httpOnly cookie (for the browser) and
  also returned in the JSON body (for Postman / future mobile use)
- Input validation (email format, password strength) with clear per-field error messages
- Centralized error handling — no route needs its own try/catch
- `requireAuth` middleware to protect routes, ready to reuse in every future module

## Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
- Set `JWT_SECRET` to a long random string (see the comment in `.env.example` for a one-liner to generate one).
- Make sure `MONGO_URI` points at your local MongoDB (default assumes `mongod` running on the default port).

Start your local MongoDB first (in a separate terminal):
```bash
mongod
```

Then start the API:
```bash
npm run dev      # with auto-restart (nodemon)
# or
npm start
```

You should see:
```
[db] Connected to MongoDB at mongodb://127.0.0.1:27017/interview_readiness
[server] Interview Readiness API running on http://localhost:5000
```

## Endpoints in this phase

| Method | Route | Auth required | Body |
|---|---|---|---|
| GET | /api/health | No | — |
| POST | /api/auth/register | No | `{ email, password }` |
| POST | /api/auth/login | No | `{ email, password }` |
| POST | /api/auth/logout | No | — |
| GET | /api/auth/me | Yes | — |

Password rules: minimum 8 characters, at least one digit.

## Testing

Three test suites are included, each verifying a different layer:

```bash
npm run test:auth:unit   # bcrypt hashing, JWT signing/verification, validators — no DB needed
npm run test:wiring      # Express routing, CORS, 404s, auth middleware — no DB needed
npm run test:auth        # full end-to-end: register -> login -> protected route -> logout
```

`test:auth` requires a reachable MongoDB. It uses `mongodb-memory-server`,
which downloads a real MongoDB binary the first time it runs (one-time,
free, from MongoDB's own servers) and manages it automatically — you don't
need your own `mongod` running just to run this particular test. If your
network blocks that download, run the app against your real local `mongod`
instead and test the flow manually via Postman using the table above; the
unit and wiring suites already cover the underlying logic without needing
any database at all.

## Notes for the next phase

- `src/routes`, `src/controllers`, `src/models` are already structured so
  Interviews, Patterns, and Recommendations each get their own file in the
  same pattern — no restructuring needed going forward.
- `requireAuth` is ready to drop into any new route file:
  ```js
  router.get('/', requireAuth, someController);
  ```

---

# Phase 2 additions: Career Profile + Skill Tracking

## What's new in this phase

- `GET/PUT /api/meta/options` — public endpoint serving the target role list,
  education levels, experience levels, and skill catalog from one file
  (`src/config/constants.js`), so the frontend never hardcodes its own copy
- `Profile` model + `GET/PUT /api/profile` — upsert-based (first save creates,
  every save after updates), returns `profile: null` rather than a 404 when
  the user hasn't created one yet
- `Skill` model + `GET/PUT /api/skills` — append-only snapshots per skill, so
  progress over time can be reconstructed later. `GET` always returns every
  skill in the catalog, with `level: null` for anything never rated (not `0`)
- All new routes require auth via the same `requireAuth` middleware from Phase 1

## Testing

```bash
npm run test:profile-skills       # validation + auth wiring, no DB needed
npm run test:profile-skills:e2e   # full flow: register -> create profile -> update -> rate skills -> re-rate
```

Like `test:auth` from Phase 1, `test:profile-skills:e2e` uses
`mongodb-memory-server` and needs a reachable internet connection the first
time it downloads MongoDB's binary. If that's blocked on your network, the
no-DB suite already covers every validation rule and auth check — you can
verify the DB-backed behavior manually through the frontend instead.

## Adding a new target role or skill later

Edit `src/config/constants.js` only — `TARGET_ROLES` or `SKILL_CATALOG`.
Both the dropdown options (via `/api/meta/options`) and the validation rules
pull from this one file automatically.

---

# Phase 3 additions: Interview Records

## What's new in this phase

- `InterviewRecord` model + full CRUD at `/api/interviews` — this is the
  core data entity the whole product is built around
- Ownership enforced on every read/write: fetching, editing, or deleting
  someone else's interview returns **404**, not 403 — so a user can't even
  tell whether another user's record exists
- `interviewTypes`, `interviewResults`, `struggleAreas` added to
  `/api/meta/options` (same single-source-of-truth pattern as Phase 2)
- `embeddingVector` field exists on the model but is left unpopulated —
  it'll be filled in Phase 4 by the AI service. Nothing here fakes that data.

## Testing

```bash
npm run test:interviews       # validation + auth + malformed-id handling, no DB needed
npm run test:interviews:e2e   # full flow: create/list/get/update/delete + cross-user isolation
```

`test:interviews:e2e` specifically proves that User B cannot read, edit, or
delete User A's interview records — this is the same
`mongodb-memory-server`-based e2e pattern as Phases 1 and 2, so it needs a
reachable internet connection the first time (see Phase 1's testing note
above if that's blocked on your network).

---

# Phase 5 additions: Patterns + Recommendations

## What's new in this phase

- `Pattern` and `Recommendation` models, plus `GET /api/patterns` and
  `GET/PUT /api/recommendations`
- `patternAnalysisService.js` — orchestrates the whole pipeline: fetches a
  user's interviews, calls the Python AI service (`aiServiceClient.js`),
  and persists the results. **Runs automatically** after every interview
  create/update/delete — patterns are never stale, and never computed
  lazily on read.
- `recommendationEngine.js` + `recommendationKnowledgeBase.js` — a plain,
  editable, rule-based knowledge base (NOT another ML model, on purpose —
  recommendations need to stay explainable and easy to expand). Priority
  is derived from frequency + trend: a pattern that's improving
  (`trend: "decreasing"`) gets a "low priority, keep going" message
  instead of an urgent one, even at high frequency.
- Graceful degradation, tested for real: if the AI service is down,
  `refreshPatternsForUser` leaves existing patterns/recommendations
  untouched rather than wiping them due to a transient outage, and
  interview save/update/delete still succeeds either way.

## Running the AI service alongside the backend

The backend needs the AI service reachable to compute patterns (see
`ai-service/README.md` for setup). Start it before the backend:
```bash
cd ai-service && uvicorn app.main:app --port 8000
```
Set `AI_SERVICE_URL=http://localhost:8000` in the backend's `.env` (already
the default in `.env.example`).

## Testing

```bash
npm run test:patterns       # auth + validation wiring, no DB needed
npm run test:patterns:e2e   # the big one — see below
```

`test:patterns:e2e` is the most thorough test in this project: it spins up
an in-memory MongoDB **and** the real Python AI service as a child
process, then drives the whole system through the real Node app — logs 5
interviews matching the project spec's exact example scenario, confirms
patterns are detected correctly (DBMS/SQL frequency 3, Confidence
frequency 2), confirms recommendations were generated with real text,
dismisses one, deletes an interview, and confirms the pattern list updates
accordingly. Requires both a reachable MongoDB binary download (see
Phase 1's note) and the AI service's Python dependencies installed
(`pip install -r ../ai-service/requirements.txt`).

---

# Phase 6 additions: Readiness Score

## What's new in this phase

- `GET /api/readiness` — a transparent, weighted readiness score computed
  from real user data: preparation skill levels, interview performance
  ratings, target-role skill coverage, an improvement trend, and a penalty
  for unresolved recurring patterns.
- **Never a hardcoded or fabricated number.** With zero interviews logged,
  the endpoint returns `score: null` with a clear list of reasons, rather
  than defaulting to some placeholder percentage.
- **Renormalized weighting**, not fake defaults: if a user hasn't filled
  in their profile or preparation skills yet, that component is excluded
  from the weighted average entirely (and flagged as `available: false`)
  rather than being counted as 0 and unfairly deflating the score.
- Configurable weights live in one place — `src/services/readinessScoreService.js`'s
  `WEIGHTS` object — and per-role skill requirements in
  `src/config/roleSkillRequirements.js`. Both are plain data, easy to tune
  without touching the scoring logic itself.
- An unresolved recurring pattern (trend `increasing` or `stable`) costs
  5 points, capped at 15 total — but a pattern already improving (trend
  `decreasing`) is **not** penalized, so a user actively fixing an issue
  isn't punished for it.

## Testing

```bash
npm run test:readiness          # the scoring formula itself — pure logic, no DB
npm run test:readiness:wiring   # auth check on the route
```

`test:readiness` is fully deterministic (no database, no AI service) since
the formula is a pure function of its inputs. It verifies: null score with
zero interviews, correct handling of missing profile/skill data via
renormalization, high inputs → high score, low inputs → low score, the
5 weights summing to exactly 1.0, the exact per-pattern penalty amount,
that an improving pattern is NOT penalized, and that the penalty caps at 15
even with many unresolved patterns.

---

# Phase 8 additions: Progress + Monthly Comparison

## What's new in this phase

- `ProgressHistory` model — one snapshot per user per calendar month
  (`YYYY-MM`), storing the readiness score, its components, and pattern
  frequencies at that point in time.
- **Automatic snapshotting**: every time `GET /api/readiness` is called
  (i.e., whenever the Dashboard loads), the current month's snapshot is
  upserted. No cron job needed — revisiting the app during the same month
  updates that month's snapshot rather than creating duplicates; a new
  month naturally starts a new snapshot the next time the score is viewed.
- `GET /api/progress/monthly` — returns every stored snapshot plus a
  computed comparison between the two most recent months (readiness,
  technical, communication, confidence, role coverage, and a per-category
  pattern-count comparison).
- A pattern present in only one of the two compared months is treated as
  `0` in the other (correctly showing a resolved or newly-appeared issue),
  never silently omitted.
- Missing data in either snapshot produces `delta: null`, never a
  fabricated number — consistent with the readiness score's own honesty
  requirement from Phase 6.

## Testing

```bash
npm run test:progress          # comparison math - pure logic, no DB
npm run test:progress:wiring   # auth check on the route
```

`test:progress` imports the actual `buildComparison` function (not a
duplicated copy) and checks it against the exact spec example: a
June → August comparison where readiness goes 58% → 74% (+16) and a
recurring SQL issue drops from 5 to 2 occurrences (-3) — both deltas are
asserted to the exact number, not just "some positive number".

---

# Post-Phase-10 addition: Settings (Change Password)

The Settings nav item was previously a disabled "Soon" placeholder — it's
now a real feature.

## What's new

- `PUT /api/auth/password` — requires the correct current password before
  allowing a change (a hijacked session token alone can't be used to lock
  the real owner out), then hashes and saves the new one.
- Same validation rules as registration (8+ characters, at least one digit).

## Testing

```bash
npm run test:change-password       # validation + auth wiring, no DB needed
npm run test:change-password:e2e   # full flow with a real database
```

`test:change-password:e2e` proves: a wrong current password is rejected
AND changes nothing (the original password still logs in afterward), a
correct change succeeds, the OLD password stops working immediately after,
and the NEW password works.

---

# Post-Phase-10 addition: Struggle Reasons, Pattern Evidence, "Why" Explainability

Requested improvements to make recurring pattern analysis the clear focus
of the project rather than a generic tracker.

## What's new

- **Struggle Reasons** — a second, independent axis from struggle areas.
  Struggle Areas answers WHAT topic (DBMS, Communication, ...); Struggle
  Reasons answers WHY (Didn't know the concept, Became nervous, Ran out of
  time, ...). Captured per interview, validated against a fixed list of 8
  reasons in `src/config/constants.js`.
- **`dominantReason` on Pattern documents** — computed automatically from
  the actual contributing interviews' struggle reasons (most common one
  wins). This is real evidence, not a label: `computeDominantReason` in
  `patternAnalysisService.js` only counts interviews that are actually
  part of that pattern's `interviewIds`, and returns `null` (never a
  fabricated reason) if none of them recorded one.
- **Recommendation text now cites the dominant reason** when available —
  e.g. "Most often, the specific reason recorded was 'Became nervous'" —
  so recommendations explain themselves instead of just repeating the
  category name.
- **`GET /api/patterns` now also returns `totalInterviews`** — the total
  count of the user's interviews, so the frontend can show "detected in 4
  of 6 interviews" rather than just the raw frequency number.

## Testing

```bash
npm run test:dominant-reason   # pure logic, no DB - the "why" evidence computation
npm run test:interviews        # includes new struggleReasons validation checks
```

`test:dominant-reason` verifies: the most common reason is picked
correctly among ties, only the SPECIFIED contributing interviews are
considered (not all of a user's interviews), `null` is returned honestly
when nothing was recorded, the dominant reason is correctly woven into
recommendation text, and an improving pattern still gets encouragement
text rather than reason-focused text.

---

# Added feature: Downloadable PDF Readiness Report

Not in the original spec — added as a genuinely useful extra: a
downloadable PDF summarizing your readiness score, recurring patterns
(with evidence), and recommendations. Meant for handing to a mentor,
placement officer, or parent — something the app didn't otherwise produce
as a shareable artifact.

## What's new

- `GET /api/reports/readiness` — generates a PDF on the fly (via
  `pdfkit`, a free, pure-JS library — no external service, no paid API)
  containing: readiness score + full breakdown, every recurring pattern
  with its frequency/trend/dominant-reason evidence, and all active
  recommendations.
- Same "never fabricate data" principle as the rest of the app: a
  brand-new user with no interviews gets a PDF that honestly says "not
  enough data yet", not a fake score.
- Code is split into `buildReportData` (pure data shaping, testable
  without a PDF library) and `renderReadinessPdf` (rendering, testable by
  generating a real PDF into memory) — same separation-of-concerns
  pattern as the rest of the codebase.

## Testing

```bash
npm run test:report-data      # pure data shaping, no DB or PDF library needed
npm run test:report-pdf       # generates a REAL PDF and parses its text back out
npm run test:report-wiring    # auth check on the route
```

`test:report-pdf` is the one worth highlighting: it doesn't just check
that a PDF-shaped buffer exists — it actually parses the rendered PDF's
text content back out (via `pdf-parse`) and asserts specific strings
appear: the user's real name, the exact computed score, exact pattern
frequency evidence ("3 of 6 interviews"), the dominant reason, and the
actual recommendation text — not placeholders. It also generates a
zero-data PDF and confirms it says "not enough data" rather than crashing
or showing a fake score.
