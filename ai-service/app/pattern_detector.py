"""
The core pattern-detection pipeline. Combines three signals, in order of
reliability:

1. Structured tags — the struggleAreas checkboxes the user selected on
   each interview form. Reliable, user-confirmed ground truth: if "DBMS"
   was tagged on 3 interviews, that's a 3-interview DBMS pattern, full stop.

2. Keyword-category matching on free text — matches each interview's
   description/feedback against a curated keyword dictionary for the same
   categories as the structured tags (see preprocessing.py). This is what
   correctly links "I struggled with SQL joins", "I could not answer
   database questions", and "unable to explain normalization" into one
   DBMS/SQL pattern even though they share almost no words in common with
   each other, and it stays reliable even with only a handful of
   interviews — which matters, because a typical user's interview history
   is far too small for unsupervised methods to learn synonymy from
   scratch (see the note in embeddings.py / clustering.py).

3. Semantic clustering (embeddings) — used ONLY as a fallback, on the
   interviews that steps 1 and 2 couldn't categorize at all. This is where
   embeddings earn their place: catching a genuinely novel, recurring
   phrasing pattern that falls outside the known weakness taxonomy,
   instead of silently dropping it. It does not try to (and at this data
   scale, reliably cannot) re-derive the same categories keyword matching
   already handles.

A "pattern" only exists once something shows up in 2+ interviews — a
single occurrence is not a recurring pattern by definition, so it's
filtered out rather than reported as one.
"""
from collections import defaultdict
from typing import List

from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS

from .schemas import InterviewInput, PatternResult
from .embeddings import embed_texts
from .clustering import cluster_embeddings
from .preprocessing import best_matching_category, clean_text

MIN_INTERVIEWS_FOR_TREND = 3
TREND_CHANGE_THRESHOLD = 0.15


def _structured_signal(interviews: List[InterviewInput]) -> dict:
    hits = defaultdict(set)
    for iv in interviews:
        for area in iv.struggleAreas:
            hits[area].add(iv.id)
    return hits


def _keyword_signal(interviews: List[InterviewInput]) -> tuple[dict, set]:
    """Matches free text against the known category keyword dictionary.
    Returns (hits, unmatched_ids) so the caller knows which interviews had
    text but didn't match any known category — those are the only
    candidates for the semantic-clustering fallback."""
    hits = defaultdict(set)
    unmatched_ids = set()

    for iv in interviews:
        text = f"{iv.description} {iv.interviewerFeedback}".strip()
        if not text:
            continue
        category = best_matching_category(text)
        if category:
            hits[category].add(iv.id)
        else:
            unmatched_ids.add(iv.id)

    return hits, unmatched_ids


def _extract_theme_label(text: str, top_n: int = 2) -> str:
    """Best-effort label for a novel cluster that doesn't match any known
    category: the most frequent non-stopword terms in the cluster's
    combined text. Not a fixed category — flagged distinctly in the UI as
    an emerging/uncategorized pattern rather than presented as equivalent
    to the curated categories."""
    words = [w for w in clean_text(text).split() if w not in ENGLISH_STOP_WORDS and len(w) > 2]
    if not words:
        return "Uncategorized recurring pattern"

    counts = defaultdict(int)
    for w in words:
        counts[w] += 1
    top_terms = sorted(counts, key=counts.get, reverse=True)[:top_n]
    return "Emerging pattern: " + ", ".join(t.capitalize() for t in top_terms)


def _semantic_fallback_signal(interviews: List[InterviewInput], unmatched_ids: set) -> dict:
    """Clusters ONLY the interviews that keyword matching couldn't categorize,
    to surface novel recurring patterns without re-deriving known categories
    unreliably from a tiny sample."""
    hits = defaultdict(set)

    candidates = [iv for iv in interviews if iv.id in unmatched_ids]
    if len(candidates) < 2:
        return hits

    texts = [f"{iv.description} {iv.interviewerFeedback}".strip() for iv in candidates]
    vectors = embed_texts(texts)
    labels = cluster_embeddings(vectors)

    clusters = defaultdict(list)
    for iv, label in zip(candidates, labels):
        clusters[label].append(iv)

    for members in clusters.values():
        if len(members) < 2:
            continue
        combined_text = " ".join(f"{iv.description} {iv.interviewerFeedback}" for iv in members)
        label = _extract_theme_label(combined_text)
        hits[label].update(iv.id for iv in members)

    return hits


def _compute_trend(interviews: List[InterviewInput], member_ids: set) -> str:
    if len(interviews) < MIN_INTERVIEWS_FOR_TREND:
        return "insufficient_data"

    sorted_ivs = sorted(interviews, key=lambda iv: iv.date)
    midpoint = len(sorted_ivs) // 2
    older_half = sorted_ivs[:midpoint]
    recent_half = sorted_ivs[midpoint:]

    older_ids = {iv.id for iv in older_half}
    recent_ids = {iv.id for iv in recent_half}

    older_rate = len(member_ids & older_ids) / max(1, len(older_ids))
    recent_rate = len(member_ids & recent_ids) / max(1, len(recent_ids))

    diff = recent_rate - older_rate
    if diff > TREND_CHANGE_THRESHOLD:
        return "increasing"  # showing up MORE often recently — getting worse
    if diff < -TREND_CHANGE_THRESHOLD:
        return "decreasing"  # showing up LESS often recently — improving
    return "stable"


def detect_patterns(interviews: List[InterviewInput]) -> List[PatternResult]:
    if len(interviews) < 2:
        return []  # can't have a "recurring" pattern with fewer than 2 data points

    structured_hits = _structured_signal(interviews)
    keyword_hits, unmatched_ids = _keyword_signal(interviews)
    semantic_hits = _semantic_fallback_signal(interviews, unmatched_ids)

    all_categories = set(structured_hits.keys()) | set(keyword_hits.keys()) | set(semantic_hits.keys())
    results = []

    for category in all_categories:
        combined_ids = structured_hits.get(category, set()) | keyword_hits.get(category, set()) | semantic_hits.get(
            category, set()
        )
        if len(combined_ids) < 2:
            continue

        has_structured = category in structured_hits
        has_text_signal = category in keyword_hits or category in semantic_hits
        if has_structured and has_text_signal:
            source = "both"
        elif has_structured:
            source = "structured_tags"
        else:
            source = "semantic_cluster" if category in semantic_hits else "keyword_match"

        results.append(
            PatternResult(
                category=category,
                frequency=len(combined_ids),
                interviewIds=sorted(combined_ids),
                trend=_compute_trend(interviews, combined_ids),
                source=source,
            )
        )

    results.sort(key=lambda p: p.frequency, reverse=True)
    return results
