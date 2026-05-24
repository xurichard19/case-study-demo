from fastapi import APIRouter
from postgrest.exceptions import APIError

from daily_report_service import get_or_create_daily_report
from model import DailyReport
from routers.errors import supabase_error


router = APIRouter(prefix="/api/daily-report", tags=["daily-report"])


@router.get("", response_model=DailyReport)
def get_daily_report() -> dict:
    try:
        return get_or_create_daily_report()
    except APIError as error:
        raise supabase_error(error) from error
