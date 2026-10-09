from datetime import datetime, timezone
from sqlalchemy import create_engine, event, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.types import TypeDecorator
from . import config

engine = create_engine(config.DATABASE_URL, connect_args={"check_same_thread": False})


@event.listens_for(engine, "connect")
def _enable_fk(dbapi_conn, _):
    # SQLite ignores FOREIGN KEY constraints / ON DELETE CASCADE unless this is on.
    cur = dbapi_conn.cursor()
    cur.execute("PRAGMA foreign_keys=ON")
    cur.close()


class UTCDateTime(TypeDecorator):
    """Stores naive UTC in SQLite, always returns tz-aware UTC (so JSON has a 'Z' and
    the browser never shifts the time zone)."""
    impl = DateTime
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if value.tzinfo is not None:
            value = value.astimezone(timezone.utc).replace(tzinfo=None)
        return value

    def process_result_value(self, value, dialect):
        return value.replace(tzinfo=timezone.utc) if value is not None else None


SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def utcnow() -> datetime:
    return datetime.now(timezone.utc)
