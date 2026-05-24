import csv
import sys
from datetime import datetime
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from postgrest.exceptions import APIError

from services.severity_classifier import rate_exception_note
from supabase_client import get_supabase_client


APP_CSV_PATH = Path(__file__).resolve().parents[1] / "dispatch_log_q1.csv"
REPO_CSV_PATH = Path(__file__).resolve().parents[2] / "dispatch_log_q1.csv"
CSV_PATH = APP_CSV_PATH if APP_CSV_PATH.exists() else REPO_CSV_PATH

NOTE_WEIGHT = 0.70
SERVICE_WEIGHT = 0.20
DELAY_WEIGHT = 0.10
SEVERITY_ONE_THRESHOLD = 70
SEVERITY_TWO_THRESHOLD = 35

CLIENT_NAME_ALIASES = {
    "boston med ctr": "Boston Medical Center",
    "boston medical center": "Boston Medical Center",
    "brigham & women's": "Brigham and Womens",
    "brigham and womens": "Brigham and Womens",
    "children's hospital": "Childrens Hospital",
    "childrens hospital": "Childrens Hospital",
    "labcorp": "Labcorp Inc",
    "labcorp inc": "Labcorp Inc",
    "mgh": "Mass General Hospital",
    "mass general hospital": "Mass General Hospital",
    "ne labs": "Northeast Labs",
    "northeast laboratory": "Northeast Labs",
    "northeast labs": "Northeast Labs",
    "quest diag": "Quest Diagnostics",
    "quest diagnostics": "Quest Diagnostics",
    "tufts med center": "Tufts Medical",
    "tufts medical": "Tufts Medical",
}


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


def normalize_exception_note(value: str | None) -> str | None:
    note = (value or "").strip()
    return note or None


def canonical_client_name(value: str) -> str:
    name = value.strip()
    return CLIENT_NAME_ALIASES.get(name.lower(), name)


def service_priority_score(service_type: str | None) -> int:
    service = (service_type or "").lower()
    if "stat" in service:
        return 100
    if "rush" in service:
        return 60
    return 0


def delay_score(delay_time: int | None) -> int:
    if delay_time is None:
        return 0
    return min(100, int((delay_time / 120) * 100))


def severity_label(note_score: int, service_type: str | None, delay_time: int | None) -> str:
    weighted_score = (
        (note_score * 10 * NOTE_WEIGHT)
        + (service_priority_score(service_type) * SERVICE_WEIGHT)
        + (delay_score(delay_time) * DELAY_WEIGHT)
    )

    if weighted_score >= SEVERITY_ONE_THRESHOLD:
        return "severity one"
    if weighted_score >= SEVERITY_TWO_THRESHOLD:
        return "severity two"
    return "severity three"


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

    client_names = sorted(
        {canonical_client_name(row["client_name"]) for row in rows if row.get("client_name")}
    )
    driver_ids = sorted(
        {
            row["driver_id"].strip()
            for row in rows
            if row.get("driver_id") and row["driver_id"].strip().lower() != "unassigned"
        }
    )

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

    existing_notes_response = supabase.table("exception_notes").select("id,note,severity_score").execute()
    notes_by_text = {note["note"]: note for note in existing_notes_response.data}
    unique_exception_notes = sorted(
        {
            note
            for note in (normalize_exception_note(row.get("exception_notes")) for row in rows)
            if note
        }
    )
    new_exception_notes = [note for note in unique_exception_notes if note not in notes_by_text]

    if new_exception_notes:
        note_rows = []
        for index, note in enumerate(new_exception_notes, start=1):
            score = rate_exception_note(note)
            note_rows.append({"note": note, "severity_score": score})
            print(f"Classified exception note {index}/{len(new_exception_notes)}: {score}/10")

        for start in range(0, len(note_rows), 500):
            supabase.table("exception_notes").upsert(
                note_rows[start : start + 500],
                on_conflict="note",
            ).execute()

        existing_notes_response = supabase.table("exception_notes").select("id,note,severity_score").execute()
        notes_by_text = {note["note"]: note for note in existing_notes_response.data}

    orders = []
    for row in rows:
        client_account_id = client_ids_by_name.get(canonical_client_name(row["client_name"]))
        if not client_account_id:
            continue

        service_type = row["service_type"].upper() if row["service_type"] else None
        exception_notes = normalize_exception_note(row.get("exception_notes"))
        exception_note = notes_by_text.get(exception_notes) if exception_notes else None
        note_score = exception_note["severity_score"] if exception_note else 1
        delay_time = delay_minutes(row)

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
                "exception_note_id": exception_note["id"] if exception_note else None,
                "driver_idle_min": parse_int(row["driver_idle_min"]),
                "fuel_cost_usd": parse_float(row["fuel_cost_usd"]),
                "redelivery_flag": parse_bool(row["redelivery_flag"]) or False,
                "severity": severity_label(note_score, service_type, delay_time),
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
    print(f"Stored {len(unique_exception_notes)} unique exception notes.")
    print(f"Classified {len(new_exception_notes)} new exception notes.")


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
