from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "Super Admin"
    DEPARTMENT_ADMIN = "Department Admin"

class ComplaintStatusEnum(str, enum.Enum):
    PROCESSING = "Processing"
    RECEIVED = "Received"
    IN_PROGRESS = "In Progress"
    RESOLVED = "Resolved"
    REJECTED = "Rejected"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.DEPARTMENT_ADMIN, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Machine(Base):
    __tablename__ = "machines"
    id = Column(String, primary_key=True, index=True) # e.g. MACH-001
    location = Column(String, nullable=False)
    district = Column(String, nullable=False)
    status = Column(String, default="Active")
    last_heartbeat = Column(DateTime(timezone=True), server_default=func.now())
    installation_date = Column(DateTime(timezone=True), server_default=func.now())
    complaints = relationship("Complaint", back_populates="machine")

class Complaint(Base):
    __tablename__ = "complaints"
    complaint_id = Column(String, primary_key=True, index=True) # e.g. KDH-2026-000001
    machine_id = Column(String, ForeignKey("machines.id"), nullable=False)
    citizen_name = Column(String, nullable=True)
    village = Column(String, nullable=True)
    address = Column(String, nullable=True)
    complaint = Column(Text, nullable=False)
    transcript = Column(Text, nullable=False)
    transcript_english = Column(Text, nullable=True)  # English translation of the original audio
    category = Column(String, nullable=True)
    priority = Column(String, nullable=True)
    status = Column(Enum(ComplaintStatusEnum), default=ComplaintStatusEnum.PROCESSING)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    machine = relationship("Machine", back_populates="complaints")
    status_history = relationship("ComplaintStatus", back_populates="complaint", cascade="all, delete-orphan")

class ComplaintStatus(Base):
    __tablename__ = "complaint_status_history"
    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(String, ForeignKey("complaints.complaint_id"))
    status = Column(Enum(ComplaintStatusEnum), nullable=False)
    updated_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now())
    comments = Column(Text, nullable=True)
    
    complaint = relationship("Complaint", back_populates="status_history")

class GovernmentExport(Base):
    __tablename__ = "government_exports"
    id = Column(Integer, primary_key=True, index=True)
    export_type = Column(String, nullable=False) # e.g. "CSV"
    file_path = Column(String, nullable=False)
    generated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String, nullable=False)
    entity_type = Column(String, nullable=False)
    entity_id = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    details = Column(Text, nullable=True)

class ProcessingQueue(Base):
    __tablename__ = "processing_queue"
    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(String, ForeignKey("machines.id"))
    file_path = Column(String, nullable=False)
    status = Column(String, default="Pending") # Pending, Processing, Completed, Failed
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SystemSettings(Base):
    __tablename__ = "system_settings"
    key = Column(String, primary_key=True, index=True)
    value = Column(String, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
