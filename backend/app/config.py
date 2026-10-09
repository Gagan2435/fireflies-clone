"""Environment-driven settings. No real auth: a single default user is assumed."""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'fireflies.db'}")
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",")]

DEFAULT_USER_NAME = os.getenv("DEFAULT_USER_NAME", "Gagandeep")
DEFAULT_USER_EMAIL = os.getenv("DEFAULT_USER_EMAIL", "gagandeep@example.com")

# Optional: if set, summaries / Ask Fred use Claude instead of the local heuristics.
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-5")
