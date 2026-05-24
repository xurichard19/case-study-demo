import csv
import sys
from datetime import datetime
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from postgrest.exceptions import APIError

from severity_classifier import classify_severity
from supabase_client import get_supabase_client


APP_CSV_PATH = Path(__file__).resolve().parents[1] / "dispatch_log_q1.csv"
REPO_CSV_PATH = Path(__file__).resolve().parents[2] / "dispatch_log_q1.csv"
CSV_PATH = APP_CSV_PATH if APP_CSV_PATH.exists() else REPO_CSV_PATH


def parse_datetime(value: str) -> str | None:
    if not value:
        return None

    formats = (
        "%Y-%m-%d %H:%M:%S",
        "%m/%d/%Y %H:%M",
        "%Y/%m/%d %H:%M",
        "%m-%d-%y %I:%M %p",
    )

    for date_format in formats:
        try:
            return datetime.strptime(value, date_format).isoformat()
        except ValueError:
            continue

    return None


def parse_bool(value: str) -> bool | None:
    if value == "":
        return None

    return value.strip().lower() in {"1", "true", "t", "yes", "y"}


def parse_int(value: str) -> int | None:
    return int(value) if value else None


def parse_float(value: str) -> float | None:
    return float(value) if value else None


def delay_minutes(row: dict[str, str]) -> int | None:
    delivery_time = parse_datetime(row["delivery_time"])
    promised_eta = parse_datetime(row["promised_eta"])

    if not delivery_time or not promised_eta:
        return None

    delay = datetime.fromisoformat(delivery_time) - datetime.fromisoformat(promised_eta)
    return max(0, int(delay.total_seconds() // 60))


def order_status(row: dict[str, str]) -> str:
    if not row.get("driver_id"):
        return "pending"
    if row.get("delivery_time"):
        return "delivered"
    if row.get("pickup_time"):
        return "in_transit"
    if row.get("dispatch_time"):
        return "assigned"
    return "pending"


def main() -> None:
    supabase = get_supabase_client()

    with CSV_PATH.open(newline="") as csv_file:
        rows = list(csv.DictReader(csv_file))

    client_names = sorted({row["client_name"].strip() for row in rows if row.get("client_name")})
    driver_ids = sorted({row["driver_id"].strip() for row in rows if row.get("driver_id")})

    if client_names:
        supabase.table("client_accounts").upsert(
            [{"name": name} for name in client_names],
            on_conflict="name",
        ).execute()

    if driver_ids:
        supabase.table("drivers").upsert(
            [{"id": driver_id, "display_name": driver_id, "active": True} for driver_id in driver_ids],
            on_conflict="id",
        ).execute()

    clients_response = supabase.table("client_accounts").select("id,name").execute()
    client_ids_by_name = {client["name"]: client["id"] for client in clients_response.data}

    orders = []
    severity_cache: dict[tuple[str | None, str | None, int | None], str] = {}
    for row in rows:
        client_account_id = client_ids_by_name.get(row["client_name"].strip())
        if not client_account_id:
            continue

        service_type = row["service_type"].upper() if row["service_type"] else None
        exception_notes = row["exception_notes"] or None
        delay_time = delay_minutes(row)
        severity_key = (exception_notes, service_type, delay_time)

        if severity_key not in severity_cache:
            severity_cache[severity_key] = classify_severity(
                exception_notes,
                service_type,
                delay_time,
            )

        orders.append(
            {
                "id": row["order_id"],
                "client_account_id": client_account_id,
                "order_time": parse_datetime(row["order_time"]),
                "pickup_zip": row["pickup_zip"] or None,
                "delivery_zip": row["delivery_zip"] or None,
                "service_type": service_type,
                "driver_id": row["driver_id"] or None,
                "dispatch_time": parse_datetime(row["dispatch_time"]),
                "pickup_time": parse_datetime(row["pickup_time"]),
                "delivery_time": parse_datetime(row["delivery_time"]),
                "promised_eta": parse_datetime(row["promised_eta"]),
                "on_time": parse_bool(row["on_time"]),
                "exception_notes": exception_notes,
                "driver_idle_min": parse_int(row["driver_idle_min"]),
                "fuel_cost_usd": parse_float(row["fuel_cost_usd"]),
                "redelivery_flag": parse_bool(row["redelivery_flag"]) or False,
                "severity": severity_cache[severity_key],
                "status": order_status(row),
            }
        )

    for start in range(0, len(orders), 500):
        supabase.table("orders").upsert(
            orders[start : start + 500],
            on_conflict="id",
        ).execute()

    print(
        f"Seeded {len(client_names)} clients, {len(driver_ids)} drivers, and {len(orders)} orders."
    )
    print(f"Classified {len(severity_cache)} unique severity contexts.")


if __name__ == "__main__":
    try:
        main()
    except APIError as error:
        message = error.args[0].get("message") if error.args and isinstance(error.args[0], dict) else str(error)
        if "schema cache" in message or "Could not find the table" in message:
            raise SystemExit(
                "Supabase schema is not ready. Apply supabase/migrations first, then rerun the seed."
            ) from error
        raise
