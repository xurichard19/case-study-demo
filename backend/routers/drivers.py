from fastapi import APIRouter
from postgrest.exceptions import APIError

from model import Driver, DriverMetrics
from routers.errors import supabase_error
from supabase_client import get_supabase_client


router = APIRouter(prefix="/api/drivers", tags=["drivers"])


@router.get("", response_model=list[Driver])
def list_drivers() -> list[dict]:
    try:
        response = (
            get_supabase_client()
            .table("drivers")
            .select("*")
            .order("id")
            .execute()
        )
    except APIError as error:
        raise supabase_error(error) from error

    return response.data


def is_assigned_driver(driver_id: str | None) -> bool:
    return bool(driver_id and driver_id.strip().lower() != "unassigned")


def is_tardy(order: dict) -> bool:
    if order.get("on_time") is False:
        return True
    return False


@router.get("/metrics", response_model=list[DriverMetrics])
def list_driver_metrics(as_of: str = "2025-03-31") -> list[dict]:
    try:
        supabase = get_supabase_client()
        drivers_response = supabase.table("drivers").select("*").order("id").execute()
        orders_response = supabase.table("orders").select("driver_id,order_time,on_time,severity").execute()
    except APIError as error:
        raise supabase_error(error) from error

    metrics_by_driver = {
        driver["id"]: {
            "id": driver["id"],
            "display_name": driver.get("display_name"),
            "active": driver.get("active", True),
            "total_orders": 0,
            "current_order_count": 0,
            "exception_count": 0,
            "tardy_count": 0,
        }
        for driver in drivers_response.data
        if is_assigned_driver(driver.get("id"))
    }

    for order in orders_response.data:
        driver_id = order.get("driver_id")
        if not is_assigned_driver(driver_id):
            continue

        metrics = metrics_by_driver.get(driver_id)
        if not metrics:
            continue

        metrics["total_orders"] += 1
        if order.get("order_time") and order["order_time"][:10] >= as_of:
            metrics["current_order_count"] += 1
        if order.get("severity") == "severity one":
            metrics["exception_count"] += 1
        if is_tardy(order):
            metrics["tardy_count"] += 1

    driver_metrics = []
    for metrics in metrics_by_driver.values():
        total_orders = metrics["total_orders"]
        exception_rate = metrics["exception_count"] / total_orders if total_orders else 0
        tardiness_rate = metrics["tardy_count"] / total_orders if total_orders else 0
        unacceptable_metrics = exception_rate >= 0.5 or tardiness_rate >= 0.25
        if not metrics["active"]:
            status = "Not available"
        elif unacceptable_metrics:
            status = "Needs review"
        elif metrics["current_order_count"] > 0:
            status = "Delivering"
        else:
            status = "Available"

        driver_metrics.append(
            {
                **metrics,
                "exception_rate": round(exception_rate, 3),
                "tardiness_rate": round(tardiness_rate, 3),
                "unacceptable_metrics": unacceptable_metrics,
                "status": status,
            }
        )

    return sorted(
        driver_metrics,
        key=lambda driver: (
            driver["current_order_count"] == 0,
            not driver["unacceptable_metrics"],
            driver["id"],
        ),
    )
