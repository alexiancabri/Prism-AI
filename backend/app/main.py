"""Prism AI backend — FastAPI app factory and router wiring."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import config
from .routers import conversations, documents, query, stats

app = FastAPI(title="Prism AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router)
app.include_router(query.router)
app.include_router(conversations.router)
app.include_router(stats.router)


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok", "service": "prism-ai"}
