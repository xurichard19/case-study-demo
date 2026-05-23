from fastapi import APIRouter, HTTPException, Query
from postgrest.exceptions import APIError

from model import Order
from routers.errors import supabase_error
from supabase_client import get_supabase_client


router = APIRouter(prefix="/api/orders", tags=["orders"])


def _order_query():
    return (
        get_supabase_client()
        .table("orders")
        .select("*, client_accounts!inner(name)")
        .order("order_time", desc=True)
    )


def _format_order(row: dict) -> dict:
    client_account = row.pop("client_accounts", None) or {}
    row["client_name"] = client_account.get("name", "Unknown client")
    return row


@router.get("", response_model=list[Order])
def list_orders(
    client_account_id: str | None = Query(default=None),
    from_time: str | None = Query(default=None),
    before_time: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
) -> list[dict]:
    query = _order_query().range(offset, offset + limit - 1)

    if client_account_id:
        query = query.eq("client_account_id", client_account_id)
    if from_time:
        query = query.gte("order_time", from_time)
    if before_time:
        query = query.lt("order_time", before_time)

    try:
        response = query.execute()
    except APIError as error:
        raise supabase_error(error) from error

    return [_format_order(row) for row in response.data]


@router.get("/{order_id}", response_model=Order)
def get_order(order_id: str) -> dict:
    try:
        response = _order_query().eq("id", order_id).limit(1).execute()
    except APIError as error:
        raise supabase_error(error) from error

    if not response.data:
        raise HTTPException(status_code=404, detail="Order not found")

    return _format_order(response.data[0])
