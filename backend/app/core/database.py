import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import settings


# Render Free has a writable /tmp directory.
# Use it when DATABASE_URL is not explicitly configured.
if os.getenv("DATABASE_URL") is None and os.getenv("RENDER") == "true":
    database_url = "sqlite:////tmp/webvulnx.db"
else:
    database_url = settings.DATABASE_URL


engine = create_engine(
    database_url,
    connect_args={
        "check_same_thread": False
    } if "sqlite" in database_url else {}
)


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
