"""Grounded answering with Claude.

Given the top-k retrieved chunks, Claude writes a 2–3 sentence summary and
selects supporting citations — using ONLY the supplied excerpts. We use
structured outputs so the response is guaranteed-parseable JSON, and we have
Claude reference each citation by `chunk_id`; the backend fills in
`document_name` / `location` from the retrieved set rather than trusting the
model for those fields.
"""
import json
from functools import lru_cache

from anthropic import Anthropic

from . import config

SYSTEM_PROMPT = """You are Prism AI, an enterprise document Q&A assistant.

Answer the user's question using ONLY the document excerpts provided in the user message. Rules:
- Never use outside knowledge and never fabricate facts, numbers, or quotes.
- If the excerpts do not contain the answer, say so plainly in the summary and return no citations.
- The summary must be 2-3 sentences maximum, in plain language.
- Each citation's `text` must be an EXACT, verbatim substring copied from one excerpt — do not paraphrase, reword, or fix typos.
- Only cite excerpts that genuinely support the summary. Reference each by its chunk_id."""

# Structured-output schema. Claude returns chunk_id + exact quote; the backend
# enriches with document_name and location afterwards.
ANSWER_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "summary": {"type": "string"},
        "citations": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "chunk_id": {"type": "string"},
                    "text": {"type": "string"},
                },
                "required": ["chunk_id", "text"],
            },
        },
    },
    "required": ["summary", "citations"],
}


@lru_cache(maxsize=1)
def _client() -> Anthropic:
    if not config.ANTHROPIC_API_KEY:
        raise RuntimeError("ANTHROPIC_API_KEY must be set in the environment.")
    return Anthropic(api_key=config.ANTHROPIC_API_KEY)


def _format_excerpts(chunks: list[dict]) -> str:
    blocks = []
    for c in chunks:
        blocks.append(
            f"<excerpt chunk_id=\"{c['id']}\" document=\"{c['document_name']}\" "
            f"location=\"{c['location']}\">\n{c['content']}\n</excerpt>"
        )
    return "\n\n".join(blocks)


def answer_question(question: str, chunks: list[dict]) -> dict:
    """chunks: [{id, document_id, document_name, location, content}].

    Returns {summary, citations: [{text, document_name, chunk_id, location, document_id}]}.
    """
    if not chunks:
        return {
            "summary": "I couldn't find anything relevant to that question in your documents.",
            "citations": [],
        }

    by_id = {c["id"]: c for c in chunks}
    user_content = (
        f"Document excerpts:\n\n{_format_excerpts(chunks)}\n\n"
        f"Question: {question}"
    )

    resp = _client().messages.create(
        model=config.ANSWER_MODEL,
        max_tokens=2000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_content}],
        output_config={"format": {"type": "json_schema", "schema": ANSWER_SCHEMA}},
    )
    raw = "".join(b.text for b in resp.content if b.type == "text")
    data = json.loads(raw)

    # Enrich + validate citations against what we actually retrieved.
    citations = []
    for cit in data.get("citations", []):
        src = by_id.get(cit.get("chunk_id"))
        if not src:
            continue  # model referenced a chunk we didn't supply — drop it
        citations.append(
            {
                "text": cit.get("text", ""),
                "document_name": src["document_name"],
                "document_id": src["document_id"],
                "chunk_id": src["id"],
                "location": src["location"],
            }
        )

    return {"summary": data.get("summary", ""), "citations": citations}
