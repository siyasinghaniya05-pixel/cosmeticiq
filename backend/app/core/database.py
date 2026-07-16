import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase


# Determine database URL - use SQLite by default
DB_URL = os.getenv("DATABASE_URL", "")

if not DB_URL:
    # No DATABASE_URL set - use SQLite
    db_path = os.path.join(os.path.dirname(__file__), "..", "..", "cosmeticiq.db")
    DB_URL = f"sqlite+aiosqlite:///{os.path.abspath(db_path)}"
elif "postgresql" in DB_URL:
    # Railway/Heroku provide postgresql:// URL, need postgresql+asyncpg://
    if not DB_URL.startswith("postgresql+asyncpg://"):
        DB_URL = DB_URL.replace("postgresql://", "postgresql+asyncpg://")
    # Also handle postgres:// format (some providers)
    if DB_URL.startswith("postgres://"):
        DB_URL = DB_URL.replace("postgres://", "postgresql+asyncpg://")
    try:
        import asyncpg  # noqa: F401
    except ImportError:
        db_path = os.path.join(os.path.dirname(__file__), "..", "..", "cosmeticiq.db")
        DB_URL = f"sqlite+aiosqlite:///{os.path.abspath(db_path)}"
        print("WARNING: asyncpg not found, falling back to SQLite")

print(f"Database: {DB_URL}")

engine = create_async_engine(DB_URL, echo=False, future=True)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
