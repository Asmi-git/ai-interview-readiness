"""
Text preprocessing and the category keyword dictionary used to label
semantic clusters with a human-readable weakness category (e.g. "DBMS/SQL"
instead of "Cluster 3").

Categories intentionally mirror the STRUGGLE_AREAS tags on the Node backend
(see backend/src/config/constants.js) so structured tags and free-text
clusters can be merged into one consistent pattern list.
"""
import re

CATEGORY_KEYWORDS = {
    "DBMS/SQL": [
        "sql", "database", "dbms", "query", "queries", "join", "joins",
        "normalization", "schema", "table", "indexing", "transaction",
    ],
    "DSA": [
        "dsa", "data structure", "algorithm", "array", "linked list", "tree",
        "graph", "recursion", "complexity", "big o", "sorting", "leetcode",
    ],
    "Coding": [
        "coding", "code", "syntax", "bug", "debug", "implementation", "logic error",
    ],
    "Communication": [
        "communication", "explain", "explaining", "articulate", "language",
        "speaking", "expressed", "clarity", "fluency",
    ],
    "Confidence": [
        "confidence", "nervous", "anxious", "blank", "froze", "panic",
        "hesitant", "shaky", "self-doubt", "went blank",
    ],
    "Project explanation": [
        "project", "capstone", "walkthrough", "architecture explain",
        "explain my project", "explain the project",
    ],
    "HR questions": [
        "hr", "behavioral", "tell me about yourself", "strengths", "weaknesses",
        "salary", "why should we hire",
    ],
    "Problem solving": [
        "problem solving", "approach", "logical thinking", "stuck", "couldn't figure",
    ],
    "Technical questions": [
        "technical question", "concept", "fundamentals", "theory",
    ],
}


def clean_text(text: str) -> str:
    """Light normalization — lowercase and strip punctuation noise.
    Deliberately light-touch: the embedding step handles semantics, so
    aggressive stemming/stopword removal isn't needed and would just
    throw away useful signal."""
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def best_matching_category(text: str) -> str | None:
    """Returns the category whose keyword list has the most hits in the text,
    or None if nothing matches. Used to label a semantic cluster."""
    cleaned = clean_text(text)
    if not cleaned:
        return None

    scores = {}
    for category, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in cleaned)
        if score > 0:
            scores[category] = score

    if not scores:
        return None
    return max(scores, key=scores.get)
