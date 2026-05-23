from fastapi import FastAPI


app = FastAPI(title="Dispatch Case Study API")


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
