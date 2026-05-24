import os
from functools import lru_cache

from openai import OpenAI


SEVERITIES = ("severity one", "severity two", "severity three")

SYSTEM_PROMPT = """
You classify medical delivery exception severity for a dispatch operations system.

You must return exactly one of these labels:
- severity one
- severity two
- severity three

Definitions:
- severity one: urgent action needed. Use for safety, specimen integrity, missed/failed delivery,
  redelivery risk, serious reassignment risk, major service failure, or urgent exception notes.
- severity two: review later. Use when there is a meaningful operational issue that should be
  reviewed, but does not require immediate action.
- severity three: just log. Use for routine notes, no exception, minor delays, or informational notes.

Weighting:
1. Urgent exception note content is most important.
2. Service priority is next; STAT is high priority and raises severity when paired with an issue.
3. Delay time is least important and should not override urgent note content.

Return only one label. Do not include punctuation, explanation, JSON, or extra text.
""".strip()


@lru_cache
def get_openai_client() -> OpenAI:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is required to classify order severity.")

    return OpenAI(api_key=api_key)


def build_user_prompt(exception_note: str | None, service: str | None, delay_minutes: int | None) -> str:
    return "\n".join(
        [
            f"exception note: {exception_note or 'none'}",
            f"service: {service or 'unknown'}",
            f"delay time: {delay_minutes if delay_minutes is not None else 'unknown'} minutes",
        ]
    )


def classify_severity(
    exception_note: str | None,
    service: str | None,
    delay_minutes: int | None,
) -> str:
    response = get_openai_client().chat.completions.create(
        model="gpt-4o-mini",
        temperature=0,
        max_tokens=8,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": build_user_prompt(exception_note, service, delay_minutes),
            },
        ],
    )
    severity = (response.choices[0].message.content or "").strip().lower()

    if severity not in SEVERITIES:
        raise ValueError(f"Unexpected severity label from model: {severity!r}")

    return severity
