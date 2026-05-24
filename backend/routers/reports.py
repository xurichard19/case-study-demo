import json
import os
from collections import defaultdict
from datetime import date, timedelta
from typing import Any

from fastapi import APIRouter
from openai import OpenAI
from postgrest.exceptions import APIError

from model import WeeklyReport
from routers.errors import supabase_error
from supabase_client import get_supabase_client


router = APIRouter(prefix="/api/reports", tags=["reports"])

REPORT_DATE = date(2025, 3, 31)


def previous_business_week(report_date: date) -> tuple[date, date]:
    current_monday = report_date - timedelta(days=report_date.weekday())
    previous_monday = current_monday - timedelta(days=7)
    previous_friday = previous_monday + timedelta(days=4)
    return previous_monday, previous_friday


def add_metric(groups: dict[str, dict[str, int]], name: str | None, on_time: bool | None) -> None:
    key = name or "Unknown"
    groups[key]["total_orders"] += 1
    if on_time is True:
        groups[key]["on_time_orders"] += 1


def format_metric_rows(groups: dict[str, dict[str, int]]) -> list[dict[str, Any]]:
    rows = []
    for name, values in groups.items():
        total_orders = values["total_orders"]
        on_time_orders = values["on_time_orders"]
        rows.append(
            {
                "name": name,
                "total_orders": total_orders,
                "on_time_orders": on_time_orders,
                "on_time_rate": round(on_time_orders / total_orders, 3) if total_orders else 0,
            }
        )

    return sorted(rows, key=lambda row: (-row["total_orders"], row["name"]))


def summarize_weekly_report(metrics: dict[str, Any]) -> str:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return "OpenAI is not configured. Weekly metrics were computed, but no narrative summary was generated."

    client = OpenAI(api_key=api_key)
    response = client.chat.completions.create(
        model=os.environ.get("DAILY_REPORT_MODEL", "gpt-4o"),
        temperature=0.2,
        max_tokens=500,
        messages=[
            {
                "role": "system",
                "content": (
                    "You write concise weekly operations reports for a medical courier dispatcher. "
                    "Use markdown bullets. Highlight operational risks, notable service/client/driver patterns, "
                    "redelivery rate, and exception volume. Stay under 180 words."
                ),
            },
            {"role": "user", "content": json.dumps(metrics, default=str)},
        ],
    )
    return (response.choices[0].message.content or "").strip()


@router.get("/weekly", response_model=WeeklyReport)
def get_weekly_report() -> dict[str, Any]:
    week_start, week_end = previous_business_week(REPORT_DATE)

    try:
        response = (
            get_supabase_client()
            .table("orders")
            .select("order_time,on_time,service_type,driver_id,redelivery_flag,exception_notes,client_accounts!inner(name)")
            .gte("order_time", week_start.isoformat())
            .lt("order_time", (week_end + timedelta(days=1)).isoformat())
            .execute()
        )
    except APIError as error:
        raise supabase_error(error) from error

    service_groups: dict[str, dict[str, int]] = defaultdict(lambda: {"total_orders": 0, "on_time_orders": 0})
    client_groups: dict[str, dict[str, int]] = defaultdict(lambda: {"total_orders": 0, "on_time_orders": 0})
    driver_groups: dict[str, dict[str, int]] = defaultdict(lambda: {"total_orders": 0, "on_time_orders": 0})
    orders = response.data

    for order in orders:
        add_metric(service_groups, order.get("service_type"), order.get("on_time"))
        add_metric(client_groups, (order.get("client_accounts") or {}).get("name"), order.get("on_time"))
        driver_id = order.get("driver_id")
        if driver_id and driver_id.strip().lower() != "unassigned":
            add_metric(driver_groups, driver_id, order.get("on_time"))

    total_orders = len(orders)
    redelivery_count = sum(1 for order in orders if order.get("redelivery_flag"))
    exception_volume = sum(1 for order in orders if order.get("exception_notes"))
    report = {
        "report_date": REPORT_DATE,
        "week_start": week_start,
        "week_end": week_end,
        "total_orders": total_orders,
        "redelivery_count": redelivery_count,
        "redelivery_rate": round(redelivery_count / total_orders, 3) if total_orders else 0,
        "exception_volume": exception_volume,
        "on_time_by_service": format_metric_rows(service_groups),
        "on_time_by_client": format_metric_rows(client_groups),
        "on_time_by_driver": format_metric_rows(driver_groups),
    }
    return {**report, "summary": summarize_weekly_report(report)}
