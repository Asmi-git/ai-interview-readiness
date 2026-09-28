# Prepwise — AI-Based Interview Readiness and Pattern Analysis

A final-year project that analyzes a student's own interview experiences —
not their coding practice, not mock interviews conducted by the app — and
surfaces the **recurring patterns behind why interviews aren't going well**,
along with a transparent readiness score and personalized recommendations.

Built as three independent local services (React frontend, Node/Express
backend, Python AI microservice) plus a local MongoDB database — everything
runs on your own laptop, ₹0, no paid APIs.

## What it actually does

1. You log your career profile, preparation levels, and interview experiences
   (company, round, how it went, what you struggled with, in your own words).
2. After every interview you add, a Python service re-analyzes your full
   history and detects recurring weaknesses — even across interviews
   described in completely different words (e.g. "I struggled with SQL
   joins" and "I could not answer database questions" get recognized as
   the same underlying DBMS pattern).
3. You get a transparent, weighted readiness score (never a random or
   hardcoded number — every point traces back to something you entered),
   personalized recommendations generated from your actual detected
   patterns, and a month-over-month view of whether you're improving.

## Project structure

```
prepwise/
├── backend/       Node/Express API — auth, data, orchestrates the AI service
├── frontend/      React app — the UI, at localhost:3000
├── ai-service/    Python FastAPI microservice — pattern detection
└── README.md      This file
```

Each folder has its own `README.md` with setup, testing, and phase-by-phase
implementation notes. This file is the map; the individual READMEs are the
territory.

## Quick start (4 terminals)

Full step-by-step instructions with troubleshooting are in each service's
README, but the short version:

```bash
# Terminal 1 — MongoDB (install MongoDB Community Edition first if needed)
mongod

# Terminal 2 — AI service
cd ai-service
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --port 8000

# Terminal 3 — Backend
cd backend
npm install
cp .env.example .env    # then set JWT_SECRET to a random string — see the file's comment
npm start

# Terminal 4 — Frontend
cd frontend
npm install
npm run dev
```

Then open **http://localhost:3000**. Start MongoDB first, then the AI
service, then the backend, then the frontend — each depends on the one before it.

## Architecture

```
┌─────────────────────┐      HTTP/REST       ┌──────────────────────┐
│  React Frontend      │ ───────────────────▶ │  Node/Express Backend │
│  localhost:3000      │ ◀─────────────────── │  localhost:5000        │
└─────────────────────┘                       └───────────┬───────────┘
                                                            │ REST (internal)
                                                            ▼
                                               ┌──────────────────────┐
                                               │  Python AI Service    │
                                               │  localhost:8000        │
                                               │  (FastAPI)             │
                                               └───────────┬───────────┘
                                                            │
                                               ┌──────────────────────┐
                                               │  MongoDB (local)      │
                                               │  localhost:27017       │
                                               └──────────────────────┘
```

The AI service is called internally by the backend only — it's never
exposed to the browser. If it's ever unreachable, the backend degrades
gracefully: interview saving still works, existing patterns/recommendations
are left untouched rather than wiped, and a clear error is logged.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router, Recharts (charts), Vite |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB Community Edition (local) |
| AI service | Python, FastAPI, scikit-learn |
| Auth | JWT (httpOnly cookie), bcrypt password hashing |

No paid APIs, no paid hosting, no paid databases anywhere in the stack.

## How pattern detection actually works

This is the core feature, so it's worth explaining honestly rather than
hand-waving "AI does it." Three signals, in order of reliability:

1. **Structured tags** — the struggle-area checkboxes on each interview
   form. Most reliable signal there is: if "DBMS" is tagged on 3
   interviews, that's a 3-interview DBMS pattern.
2. **Keyword-category matching** on free text — correctly links
   differently-worded complaints about the same issue. This is what
   handles the example above (SQL joins / database questions /
   normalization → one DBMS/SQL pattern) reliably, even with a tiny
   per-user dataset.
3. **Semantic clustering (embeddings)** — used only as a fallback, on
   text that doesn't match any known category, to catch a genuinely novel
   recurring pattern outside the fixed taxonomy.

Full explanation, including a real bug I found and fixed during
development (unsupervised clustering was originally the primary
mechanism, and it clustered on incidental word overlap rather than actual
topic at small sample sizes), is in `ai-service/README.md`.

## Testing

Every phase of this project was built with real, running tests — not just
manual clicking. Summary:

**Backend** (`cd backend`) — 73 checks across 13 test files, no database required for most:
```bash
npm run test:auth:unit && npm run test:wiring && npm run test:profile-skills \
  && npm run test:interviews && npm run test:patterns && npm run test:readiness \
  && npm run test:readiness:wiring && npm run test:progress && npm run test:progress:wiring
```

**AI service** (`cd ai-service`) — 15 checks on the pattern detection pipeline itself:
```bash
python3 tests/test_pattern_detector.py
```

**Full end-to-end** (requires a live MongoDB and the AI service running —
these spin up real instances and drive the whole system through the real
app, not mocks):
```bash
cd backend
npm run test:auth              # register -> login -> protected route -> logout
npm run test:profile-skills:e2e
npm run test:interviews:e2e    # includes cross-user data isolation checks
npm run test:patterns:e2e      # the big one — spins up the real AI service too
```

Each backend README section documents exactly what each suite checks.

## Design notes worth knowing

- **The readiness score is never fabricated.** Zero interviews logged →
  the score is `null` with clear reasons, not a placeholder percentage.
  Missing profile/skill data is excluded from the weighted average
  (renormalized), not silently counted as zero.
- **Recommendations come from a plain, editable knowledge base**
  (`backend/src/services/recommendationKnowledgeBase.js`), not another ML
  model — deliberately, so they stay explainable and easy to extend.
- **Adding a new target role or skill** is a one-file edit
  (`backend/src/config/constants.js`) — both the frontend dropdowns and
  backend validation pull from the same source automatically.
- **Ownership is enforced everywhere.** Trying to read, edit, or delete
  another user's interview record returns 404, not 403 — it doesn't even
  confirm the record exists.

## Known limitations

- The AI service's default embedding backend (TF-IDF + LSA) is free and
  requires no download, but a real neural embedding model
  (`sentence-transformers`) can optionally be enabled for better semantic
  quality on novel patterns — see `ai-service/requirements.txt`. This
  requires installing PyTorch, a multi-gigabyte dependency, so it's opt-in.
- Monthly progress snapshots are recorded automatically whenever the
  Dashboard loads (upserted per calendar month) — there's no background
  scheduler, so a month with zero visits to the app won't get a snapshot.
