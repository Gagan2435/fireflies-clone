from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import config, models  # noqa: F401  (models import registers tables)
from .database import Base, SessionLocal, engine
from .routers import library, meetings
from .services import meeting_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        meeting_service.default_user(db)       # "assume a default logged-in user"
        db.commit()
        if db.query(models.Meeting).count() == 0:
            from .seed.run import seed
            seed(db)                           # app is immediately usable on first boot
    finally:
        db.close()
    yield


app = FastAPI(title="Fireflies Clone API", version="2.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=config.CORS_ORIGINS, allow_methods=["*"], allow_headers=["*"],
                   expose_headers=["Content-Disposition"])
app.include_router(meetings.router)
app.include_router(library.router)
