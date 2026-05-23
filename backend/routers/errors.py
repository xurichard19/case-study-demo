from fastapi import HTTPException
from postgrest.exceptions import APIError


def supabase_error(error: APIError) -> HTTPException:
    message = error.args[0].get("message") if error.args and isinstance(error.args[0], dict) else str(error)

    if "schema cache" in message or "Could not find the table" in message:
        return HTTPException(
            status_code=503,
            detail="Supabase schema is not ready. Apply the migration in supabase/migrations first.",
        )

    return HTTPException(status_code=502, detail=message)
