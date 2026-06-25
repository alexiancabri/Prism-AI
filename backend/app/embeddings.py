"""Embeddings via Voyage AI (voyage-3.5, 1024-dim by default).

Anthropic has no embeddings endpoint, so Claude handles answering only — the
vectors that go into pgvector come from Voyage AI, Anthropic's recommended
embeddings partner. Voyage distinguishes between indexing documents and
embedding search queries (`input_type`), which improves retrieval quality.
"""
from functools import lru_cache

import voyageai

from . import config

# Voyage caps a single request at 1000 inputs (and a per-request token budget);
# batch comfortably under that so large documents index in one pass.
_BATCH = 128


@lru_cache(maxsize=1)
def _client() -> "voyageai.Client":
    if not config.VOYAGE_API_KEY:
        raise RuntimeError("VOYAGE_API_KEY must be set in the environment.")
    return voyageai.Client(api_key=config.VOYAGE_API_KEY)


def _embed(texts: list[str], input_type: str) -> list[list[float]]:
    vectors: list[list[float]] = []
    for i in range(0, len(texts), _BATCH):
        batch = texts[i : i + _BATCH]
        resp = _client().embed(
            batch,
            model=config.EMBED_MODEL,
            input_type=input_type,
            output_dimension=config.EMBED_DIM,
        )
        vectors.extend(resp.embeddings)
    return vectors


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed stored document chunks. One EMBED_DIM-float vector per input."""
    if not texts:
        return []
    return _embed(texts, input_type="document")


def embed_query(text: str) -> list[float]:
    """Embed a search query (uses Voyage's query-optimized input type)."""
    return _embed([text], input_type="query")[0]


def to_pgvector(vec: list[float]) -> str:
    """Format a vector as pgvector's text literal, e.g. "[0.1,0.2,...]".

    PostgREST reliably casts this string to the `vector` column / RPC arg.
    Passing a raw JSON array can fail to coerce into the vector type on some
    PostgREST/pgvector versions, so we always send the text form.
    """
    return "[" + ",".join(repr(float(x)) for x in vec) + "]"
