import os
from functools import lru_cache

from supabase import Client, create_client


@lru_cache
def get_supabase_client() -> Client:
    supabase_url = os.environ.get("SUPABASE_URL")
    service_role_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not service_role_key:
        raise RuntimeError(
            "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
        )

    return create_client(supabase_url, service_role_key)
