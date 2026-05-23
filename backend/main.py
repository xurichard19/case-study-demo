from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import clients, drivers, orders


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
app.include_router(drivers.router)
app.include_router(orders.router)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
