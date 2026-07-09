from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# We need an async driver for database connection, ensure it starts with postgresql+asyncpg
# if the provided one is just postgresql://
db_url = settings.DATABASE_URL
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# Neon DB (and other cloud Postgres providers) require SSL.
# The ?sslmode=require param in the URL is handled at the driver level via connect_args.
connect_args = {}
if "neon.tech" in db_url or "sslmode=require" in db_url:
    # Strip sslmode from URL query string — asyncpg handles it via connect_args instead
    db_url = db_url.replace("?sslmode=require", "").replace("&sslmode=require", "")
    connect_args = {"ssl": "require"}

engine = create_async_engine(db_url, echo=False, connect_args=connect_args)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
