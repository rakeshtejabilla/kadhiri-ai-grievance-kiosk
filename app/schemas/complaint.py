from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from app.models.models import ComplaintStatusEnum

class ComplaintBase(BaseModel):
    citizen_name: Optional[str] = None
    village: Optional[str] = None
    address: Optional[str] = None
    complaint: str
    category: Optional[str] = None
    priority: Optional[str] = None

class ComplaintCreate(ComplaintBase):
    machine_id: str
    transcript: str
    transcript_english: Optional[str] = None

class ComplaintResponse(ComplaintBase):
    complaint_id: str
    machine_id: str
    transcript: str
    transcript_english: Optional[str] = None
    status: ComplaintStatusEnum
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class ExtractionResult(BaseModel):
    name: Optional[str] = None
    village: Optional[str] = None
    address: Optional[str] = None
    complaint: str
    category: Optional[str] = None
    priority: Optional[str] = None
