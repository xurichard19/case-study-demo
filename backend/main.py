from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import clients, daily_reports, drivers, orders, reports
from services.daily_report_service import start_daily_report_scheduler


app = FastAPI(title="Dispatch Case Study API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(clients.router)
app.include_router(daily_reports.router)
app.include_router(drivers.router)
app.include_router(orders.router)
app.include_router(reports.router)


@app.on_event("startup")
def start_background_jobs() -> None:
    start_daily_report_scheduler()


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
