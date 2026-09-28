# AI Service — Phase 4: Pattern Detection

A small FastAPI microservice, called internally by the Node backend, that
turns a user's interview history into recurring-pattern detections. This
is the core AI feature of the whole project.

## How it actually works (read this before assuming it's "just an LLM call")

It's a three-signal pipeline, in order of reliability:

1. **Structured tags** — the struggleAreas checkboxes on each interview
   form. If "DBMS" is tagged on 3 interviews, that's a 3-interview DBMS
   pattern. No ML involved, and it's the most reliable signal there is.

2. **Keyword-category matching on free text** — matches each interview's
   description against a curated keyword dictionary (`app/preprocessing.py`)
   for the same categories as the structured tags. This is what correctly
   links "I struggled with SQL joins", "I could not answer database
   questions", and "unable to explain normalization" into one DBMS/SQL
   pattern, even though those three sentences share almost no words.

3. **Semantic clustering (embeddings)** — used ONLY as a fallback, on
   interviews that steps 1 and 2 couldn't categorize at all. This is
   where embeddings earn their place: catching a genuinely novel
   recurring phrasing that falls outside the known weakness taxonomy,
   labeled as an "Emerging pattern" rather than presented as an
   established category.

### Why not just run embeddings + clustering on everything?

I tried that first. With a typical user's interview history (a handful of
short text entries), unsupervised clustering on TF-IDF/LSA embeddings
clusters on **incidental word overlap**, not actual topic — e.g. it linked
"I could not answer database questions" with "I felt nervous answering HR
questions" because they share the word "answering", while failing to link
that same sentence with "I struggled with SQL joins" because they share no
words at all despite being about the exact same weakness. Unsupervised
semantic methods need many documents to learn synonymy from co-occurrence
patterns; a single user's interview log will never have that much data.
The keyword-category layer solves the cases the project spec explicitly
requires (recognizing "nervous during HR" and "lacked confidence
speaking" as related) reliably, and embeddings are reserved for genuinely
novel phrasing the taxonomy doesn't cover — which is an honest, defensible
role for them, and it's what's actually implemented, not what got claimed and skipped.

## Embedding backend

Default: **TF-IDF + Truncated SVD** — pure scikit-learn, no model
download, no heavy dependencies. This is what the project runs on out of
the box, and what the semantic-fallback layer (step 3 above) uses.

Optional upgrade: **sentence-transformers** (a real neural embedding
model) can be enabled for better semantic quality on the fallback layer.
This requires installing PyTorch, which is a multi-GB dependency — see
`requirements.txt` for exact steps if you have the disk space for it and
want the upgrade. Not required to run the project.

## Setup

```bash
cd ai-service
pip install -r requirements.txt   # (or: pip install -r requirements.txt --break-system-packages, depending on your Python setup)
cp .env.example .env
uvicorn app.main:app --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## Testing

```bash
python3 tests/test_pattern_detector.py
```

This covers: the exact spec example (SQL/DBMS across 3 differently-worded
interviews, confidence across 2), empty/single-interview edge cases,
single-occurrence-isn't-a-pattern, structured-tags-only, trend direction
(both increasing and decreasing), and insufficient-data handling. All 15
checks run against the real code — no mocking.

Manual endpoint check:
```bash
curl http://localhost:8000/health

curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","interviews":[
        {"id":"1","date":"2026-06-01","struggleAreas":["DBMS"],"description":"I struggled with SQL joins."},
        {"id":"2","date":"2026-06-15","struggleAreas":["DSA"],"description":"I could not answer database questions."}
      ]}'
```

## Integration with the Node backend

`backend/src/services/aiServiceClient.js` calls this service internally.
It's designed to fail soft: if this service is down or errors, the client
returns `null` and logs a clear message rather than throwing — saving an
interview record must never be blocked by the AI service being unavailable.
Wiring this into the Patterns collection and pattern-analysis UI happens
in the next phase.
