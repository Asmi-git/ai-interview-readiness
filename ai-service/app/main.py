from datetime import datetime, timezone
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .schemas import AnalyzeRequest, AnalyzeResponse
from .pattern_detector import detect_patterns
from .embeddings import EMBEDDING_BACKEND

app = FastAPI(
    title="Prepwise AI Service",
    description="Internal service: interview pattern detection via text embeddings + clustering.",
    version="1.0.0",
)

# This service is only ever called server-to-server by the Node backend,
# never directly by a browser — CORS is permissive here on purpose since
# there's no browser-facing surface to protect.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "embeddingBackend": EMBEDDING_BACKEND}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(payload: AnalyzeRequest):
    patterns = detect_patterns(payload.interviews)
    return AnalyzeResponse(
        userId=payload.userId,
        interviewsAnalyzed=len(payload.interviews),
        patterns=patterns,
        generatedAt=datetime.now(timezone.utc),
    )
