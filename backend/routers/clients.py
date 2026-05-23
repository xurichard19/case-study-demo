from fastapi import APIRouter
from postgrest.exceptions import APIError

from model import ClientAccount
from routers.errors import supabase_error
from supabase_client import get_supabase_client


router = APIRouter(prefix="/api/clients", tags=["clients"])


@router.get("", response_model=list[ClientAccount])
def list_clients() -> list[dict]:
    try:
        response = (
            get_supabase_client()
            .table("client_accounts")
            .select("*")
            .order("name")
            .execute()
        )
    except APIError as error:
        raise supabase_error(error) from error

    return response.data
