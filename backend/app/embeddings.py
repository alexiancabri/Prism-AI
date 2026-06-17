"""Embeddings via OpenAI text-embedding-3-small (natively 1536-dim).

Anthropic has no embeddings endpoint, so Claude handles answering only — the
vectors that go into pgvector come from OpenAI.
"""
from functools import lru_cache

from openai import OpenAI

from . import config


@lru_cache(maxsize=1)
def _client() -> OpenAI:
    if not config.OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY must be set in the environment.")
    return OpenAI(api_key=config.OPENAI_API_KEY)


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a batch of strings. Returns one 1536-float vector per input."""
    if not texts:
        return []
    resp = _client().embeddings.create(model=config.EMBED_MODEL, input=texts)
    # The API preserves input order.
    return [d.embedding for d in resp.data]


def embed_query(text: str) -> list[float]:
    return embed_texts([text])[0]
