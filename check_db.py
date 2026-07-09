import asyncio
from app.db.database import AsyncSessionLocal
from app.models.models import Complaint
from sqlalchemy.future import select

async def check_db():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Complaint))
        complaints = result.scalars().all()
        if not complaints:
            print("No complaints found in the database.")
        for c in complaints:
            print(f"ID: {c.complaint_id} | Name: {c.citizen_name} | Complaint: {c.complaint}")

if __name__ == "__main__":
    asyncio.run(check_db())
