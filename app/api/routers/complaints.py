from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.database import get_db
from app.api.deps import get_current_user
from app.models.models import Complaint, User
from app.schemas.complaint import ComplaintResponse

router = APIRouter()

@router.get("/", response_model=List[ComplaintResponse])
async def list_complaints(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    machine_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve all complaints (Admin API)
    """
    query = select(Complaint)
    
    if status:
        query = query.filter(Complaint.status == status)
    if machine_id:
        query = query.filter(Complaint.machine_id == machine_id)
        
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    complaints = result.scalars().all()
    return complaints

@router.get("/{complaint_id}", response_model=ComplaintResponse)
async def get_complaint(
    complaint_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get complaint details by ID (Admin API)
    """
    result = await db.execute(select(Complaint).filter(Complaint.complaint_id == complaint_id))
    complaint = result.scalars().first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint
