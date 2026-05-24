import os
from functools import lru_cache

from openai import OpenAI


SYSTEM_PROMPT = """
You rate medical delivery exception notes for a dispatch operations system.

Return a single integer from 1 to 10.

Definitions:
- 10 means the note requires the most urgent action.
- 1 means the note is only a log/no-action item.

Rate only the exception note content. Do not consider service type, delay time, or any other
context. High scores should be used for safety concerns, specimen integrity risk, failed delivery,
redelivery risk, serious reassignment risk, or major service failure.

Return only the integer. Do not include punctuation, explanation, JSON, or extra text.
""".strip()


@lru_cache
def get_openai_client() -> OpenAI:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is required to classify order severity.")

    return OpenAI(api_key=api_key)


def rate_exception_note(exception_note: str) -> int:
    response = get_openai_client().chat.completions.create(
        model="gpt-4o-mini",
        temperature=0,
        max_tokens=3,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"exception note: {exception_note}"},
        ],
    )
    score_text = (response.choices[0].message.content or "").strip()

    try:
        score = int(score_text)
    except ValueError as error:
        raise ValueError(f"Unexpected severity score from model: {score_text!r}") from error

    if score < 1 or score > 10:
        raise ValueError(f"Unexpected severity score from model: {score!r}")

    return score
