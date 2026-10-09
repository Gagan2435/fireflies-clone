"""Optional LLM bridge. Used only when ANTHROPIC_API_KEY is set; otherwise callers fall back
to the local heuristics, so the app always works offline."""
from typing import Optional
import httpx
from .. import config


def enabled() -> bool:
    return bool(config.ANTHROPIC_API_KEY)


def complete(system: str, prompt: str, max_tokens: int = 700) -> Optional[str]:
    if not enabled():
        return None
    try:
        r = httpx.post(
            "https://api.anthropic.com/v1/messages",
            headers={"x-api-key": config.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01",
                     "content-type": "application/json"},
            json={"model": config.ANTHROPIC_MODEL, "max_tokens": max_tokens, "system": system,
                  "messages": [{"role": "user", "content": prompt}]},
            timeout=40,
        )
        r.raise_for_status()
        return "".join(b.get("text", "") for b in r.json().get("content", []))
    except Exception:
        return None
