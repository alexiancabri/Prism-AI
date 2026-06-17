"""Supabase client (service role) as a lazy singleton.

Created on first use so importing the module never fails when env vars are
missing — the failure surfaces at request time with a clear message instead.
"""
from functools import lru_cache

from supabase import Client, create_client

from . import config


@lru_cache(maxsize=1)
def get_supabase() -> Client:
    if not config.SUPABASE_URL or not config.SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment."
        )
    return create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY)
