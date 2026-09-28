"""
Clusters interview description embeddings into groups of semantically
similar entries, without requiring a fixed number of clusters up front
(the number of distinct weaknesses a user has is unknown in advance).

Uses agglomerative clustering with a distance threshold rather than
K-Means: K-Means needs k chosen ahead of time and struggles with the very
small sample sizes typical here (a handful of interviews per user).
Agglomerative clustering with a cosine-distance threshold naturally
produces anywhere from 1 to n clusters depending on how similar the
descriptions actually are.
"""
import numpy as np
from sklearn.cluster import AgglomerativeClustering
from sklearn.metrics.pairwise import cosine_distances

# Distance threshold below which two descriptions are considered part of
# the same recurring issue. Tuned conservatively (favoring precision over
# recall) since a false-positive "recurring pattern" is more misleading to
# a student than a missed one — better to under-cluster than to invent a
# pattern that isn't really there.
DISTANCE_THRESHOLD = 0.75


def cluster_embeddings(vectors: np.ndarray) -> list[int]:
    """Returns a cluster label (int) for each input vector.

    With fewer than 2 vectors, or if every vector is identical/zero,
    everything trivially belongs to a single cluster — clustering
    algorithms need at least 2 distinct points to do meaningful work.
    """
    n = vectors.shape[0]
    if n < 2:
        return [0] * n

    distance_matrix = cosine_distances(vectors)

    clustering = AgglomerativeClustering(
        n_clusters=None,
        distance_threshold=DISTANCE_THRESHOLD,
        metric="precomputed",
        linkage="average",
    )
    labels = clustering.fit_predict(distance_matrix)
    return labels.tolist()
