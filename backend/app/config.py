"""Central configuration. Everything comes from the environment — nothing hardcoded.

Railway (and any other host) is expected to provide these. `.env.example` documents
the full set.
"""
import os

# --- Supabase ---------------------------------------------------------------
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
# Service-role key: the backend bypasses RLS and enforces org scoping itself.
# It's also used to validate user access tokens via auth.get_user().
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

# --- Model providers --------------------------------------------------------
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
VOYAGE_API_KEY = os.environ.get("VOYAGE_API_KEY", "")

# Claude does the answering; Voyage AI (Anthropic's recommended embeddings
# partner) does the embeddings — Anthropic has no embeddings endpoint of its
# own. voyage-3.5 outputs 1024-dim vectors by default, which must match the
# pgvector schema (see schema.sql).
ANSWER_MODEL = os.environ.get("ANSWER_MODEL", "claude-opus-4-8")
EMBED_MODEL = os.environ.get("EMBED_MODEL", "voyage-3.5")
EMBED_DIM = int(os.environ.get("EMBED_DIM", "1024"))

# --- CORS -------------------------------------------------------------------
# Comma-separated list is supported so you can allow localhost + the deployed UI.
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")
ALLOWED_ORIGINS = [o.strip() for o in FRONTEND_URL.split(",") if o.strip()]

# --- Chunking ---------------------------------------------------------------
CHUNK_SIZE = int(os.environ.get("CHUNK_SIZE", "1000"))
CHUNK_OVERLAP = int(os.environ.get("CHUNK_OVERLAP", "150"))
TOP_K = int(os.environ.get("TOP_K", "5"))
