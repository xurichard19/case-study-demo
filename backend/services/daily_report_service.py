import json
import os
import threading
import time
import urllib.parse
import urllib.request
from datetime import date, datetime, time as datetime_time, timedelta
from typing import Any
from zoneinfo import ZoneInfo

from openai import OpenAI

from supabase_client import get_supabase_client


BOSTON_LATITUDE = 42.3601
BOSTON_LONGITUDE = -71.0589
BOSTON_BBOX = "-71.1912,42.2279,-70.9236,42.3969"
BOSTON_TIMEZONE = ZoneInfo("America/New_York")
REPORT_HOUR = 5
REPORT_LOCATION = "Boston, MA"


def current_report_date(now: datetime | None = None) -> date:
    local_now = now.astimezone(BOSTON_TIMEZONE) if now else datetime.now(BOSTON_TIMEZONE)
    if local_now.time() < datetime_time(REPORT_HOUR, 0):
        return local_now.date() - timedelta(days=1)
    return local_now.date()


def fetch_json(url: str, timeout: int = 20) -> dict[str, Any]:
    request = urllib.request.Request(url, headers={"User-Agent": "dispatch-case-study/1.0"})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def fetch_weather() -> dict[str, Any]:
    params = urllib.parse.urlencode(
        {
            "latitude": BOSTON_LATITUDE,
            "longitude": BOSTON_LONGITUDE,
            "timezone": "America/New_York",
            "forecast_days": 1,
            "temperature_unit": "fahrenheit",
            "wind_speed_unit": "mph",
            "precipitation_unit": "inch",
            "current": "temperature_2m,precipitation,wind_speed_10m,wind_gusts_10m",
            "hourly": "temperature_2m,precipitation_probability,precipitation,wind_speed_10m,wind_gusts_10m,visibility",
        }
    )
    return fetch_json(f"https://api.open-meteo.com/v1/forecast?{params}")


def fetch_traffic() -> dict[str, Any]:
    api_key = os.environ.get("TOMTOM_API_KEY")
    if not api_key:
        return {
            "available": False,
            "provider": "TomTom Traffic API",
            "message": "TOMTOM_API_KEY is not configured.",
            "incidents": [],
        }

    params = urllib.parse.urlencode(
        {
            "key": api_key,
            "bbox": BOSTON_BBOX,
            "fields": "{incidents{type,geometry{type,coordinates},properties{iconCategory,magnitudeOfDelay,events{description,code},from,to,length,delay,roadNumbers,timeValidity}}}",
            "language": "en-US",
            "timeValidityFilter": "present",
        }
    )
    response = fetch_json(f"https://api.tomtom.com/traffic/services/5/incidentDetails?{params}")
    return {
        "available": True,
        "provider": "TomTom Traffic API",
        "incidents": response.get("incidents", []),
    }


def summarize_report(weather: dict[str, Any], traffic: dict[str, Any]) -> str:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return "OpenAI is not configured. Weather and traffic data were collected, but no summary was generated."

    model = os.environ.get("DAILY_REPORT_MODEL", "gpt-4o")
    client = OpenAI(api_key=api_key)
    response = client.chat.completions.create(
        model=model,
        temperature=0.2,
        max_tokens=450,
        messages=[
            {
                "role": "system",
                "content": (
                    "You write concise 5 AM Boston dispatch briefings for a medical courier operation. "
                    "Call out weather risks, traffic risks, likely operational impact, and concrete dispatcher actions. "
                    "Be specific, practical, and under 180 words."
                ),
            },
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "location": REPORT_LOCATION,
                        "weather": weather,
                        "traffic": traffic,
                    },
                    default=str,
                ),
            },
        ],
    )
    return (response.choices[0].message.content or "").strip()


def generate_daily_report(report_date: date | None = None) -> dict[str, Any]:
    target_date = report_date or current_report_date()
    weather = fetch_weather()
    traffic = fetch_traffic()
    summary = summarize_report(weather, traffic)
    row = {
        "report_date": target_date.isoformat(),
        "location": REPORT_LOCATION,
        "weather": weather,
        "traffic": traffic,
        "summary": summary,
        "generated_at": datetime.now(BOSTON_TIMEZONE).isoformat(),
    }

    response = (
        get_supabase_client()
        .table("daily_reports")
        .upsert(row, on_conflict="report_date")
        .execute()
    )
    return response.data[0] if response.data else row


def get_or_create_daily_report() -> dict[str, Any]:
    target_date = current_report_date()
    response = (
        get_supabase_client()
        .table("daily_reports")
        .select("*")
        .eq("report_date", target_date.isoformat())
        .limit(1)
        .execute()
    )

    if response.data:
        return response.data[0]

    return generate_daily_report(target_date)


def seconds_until_next_report() -> float:
    now = datetime.now(BOSTON_TIMEZONE)
    next_run = datetime.combine(now.date(), datetime_time(REPORT_HOUR, 0), tzinfo=BOSTON_TIMEZONE)
    if now >= next_run:
        next_run += timedelta(days=1)
    return max(1.0, (next_run - now).total_seconds())


def start_daily_report_scheduler() -> None:
    def run_loop() -> None:
        while True:
            time.sleep(seconds_until_next_report())
            try:
                generate_daily_report(current_report_date())
            except Exception as error:
                print(f"Daily report generation failed: {error}", flush=True)

    thread = threading.Thread(target=run_loop, daemon=True)
    thread.start()
