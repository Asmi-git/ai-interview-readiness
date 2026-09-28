"""
Pluggable text embedding backend.

Default backend ("tfidf"): TF-IDF vectorization + Truncated SVD (Latent
Semantic Analysis). Pure scikit-learn, no model download, no heavy
dependencies — this is what the project runs with out of the box, and is
genuinely free/local as required.

Optional backend ("sentence-transformers"): swaps in a real sentence
embedding model for better semantic matching, at the cost of a much larger
dependency (PyTorch). See requirements.txt for how to enable it.

Either way, callers just get back a numpy array of vectors — the rest of
the pipeline (clustering, pattern detection) doesn't know or care which
backend produced them.
"""
import os
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD

from .preprocessing import clean_text

EMBEDDING_BACKEND = os.environ.get("EMBEDDING_BACKEND", "tfidf")


def _tfidf_embed(texts: list[str]) -> np.ndarray:
    cleaned = [clean_text(t) for t in texts]

    # Guard against an all-empty corpus (e.g. every interview has a blank
    # description) — TfidfVectorizer errors on an empty vocabulary.
    if not any(cleaned):
        return np.zeros((len(texts), 1))

    vectorizer = TfidfVectorizer(stop_words="english", min_df=1)
    tfidf_matrix = vectorizer.fit_transform(cleaned)

    # SVD needs n_components < n_features and < n_samples; with only a
    # handful of short interview descriptions both are often small, so we
    # cap components conservatively rather than letting it throw.
    n_features = tfidf_matrix.shape[1]
    n_samples = tfidf_matrix.shape[0]
    n_components = max(1, min(50, n_features - 1, n_samples - 1))

    if n_components < 1 or n_features <= 1:
        # Too little vocabulary to reduce meaningfully — return raw TF-IDF.
        return tfidf_matrix.toarray()

    svd = TruncatedSVD(n_components=n_components, random_state=42)
    return svd.fit_transform(tfidf_matrix)


def _sentence_transformer_embed(texts: list[str]) -> np.ndarray:
    # Imported lazily so the heavy dependency is only required if this
    # backend is actually selected via EMBEDDING_BACKEND.
    from sentence_transformers import SentenceTransformer

    model_name = os.environ.get("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    model = _sentence_transformer_embed.__dict__.setdefault(
        "_model_cache", {}
    ).get(model_name)
    if model is None:
        model = SentenceTransformer(model_name)
        _sentence_transformer_embed._model_cache[model_name] = model
    return np.array(model.encode(texts))


def embed_texts(texts: list[str]) -> np.ndarray:
    """Embeds a list of texts into vectors using the configured backend."""
    if EMBEDDING_BACKEND == "sentence-transformers":
        return _sentence_transformer_embed(texts)
    return _tfidf_embed(texts)
