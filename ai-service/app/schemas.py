from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class InterviewInput(BaseModel):
    """One interview record's worth of data the pattern detector needs.
    Mirrors the relevant subset of the Node backend's InterviewRecord."""

    id: str
    date: date
    struggleAreas: List[str] = Field(default_factory=list)
    description: str = ""
    interviewerFeedback: str = ""


class AnalyzeRequest(BaseModel):
    userId: str
    interviews: List[InterviewInput]


class PatternResult(BaseModel):
    category: str
    frequency: int
    interviewIds: List[str]
    trend: str  # "increasing" | "decreasing" | "stable" | "insufficient_data"
    source: str  # "structured_tags" | "semantic_cluster" | "both"


class AnalyzeResponse(BaseModel):
    userId: str
    interviewsAnalyzed: int
    patterns: List[PatternResult]
    generatedAt: datetime
