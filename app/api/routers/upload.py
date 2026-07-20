import os
import aiofiles
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.core.config import settings
from app.services import ai_service
from app.models.models import Complaint, Machine
from app.schemas.complaint import ComplaintResponse
from sqlalchemy.future import select
import uuid
from datetime import datetime

router = APIRouter()

async def generate_complaint_id(db: AsyncSession) -> str:
    # Example logic: KDH-2026-000001
    year = datetime.now().year
    result = await db.execute(select(Complaint).order_by(Complaint.created_at.desc()).limit(1))
    last_complaint = result.scalars().first()
    
    if last_complaint and last_complaint.complaint_id.startswith(f"KDH-{year}-"):
        last_num = int(last_complaint.complaint_id.split("-")[-1])
        new_num = last_num + 1
    else:
        new_num = 1
    
    return f"KDH-{year}-{new_num:06d}"

@router.post("/upload")
async def upload_audio(
    machine_id: str = Form(...),
    timestamp: str = Form(...),
    location: str = Form(...),
    audio: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Receives an audio file from the kiosk, transcribes it, extracts details, and saves to DB.
    The audio file is NOT stored permanently.
    """
    if not audio.filename.endswith((".wav", ".webm")):
        raise HTTPException(status_code=400, detail="Only .wav or .webm audio files are supported")

    # Detect extension from content
    ext = ".webm" if audio.filename.endswith(".webm") else ".wav"

    # Ensure temp dir exists
    os.makedirs(settings.UPLOAD_TEMP_DIRECTORY, exist_ok=True)
    temp_file_path = os.path.join(settings.UPLOAD_TEMP_DIRECTORY, f"{uuid.uuid4()}{ext}")

    # Step 1: Save temporary audio
    async with aiofiles.open(temp_file_path, 'wb') as out_file:
        content = await audio.read()
        await out_file.write(content)

    try:
        # Step 2: Transcribe via Whisper — returns (original, english_translation)
        transcript, transcript_english = await ai_service.process_audio(temp_file_path)

        # Step 3: Extract structured data and correct the native spelling
        extracted_data = await ai_service.extract_complaint_info(transcript, transcript_english)

        # Step 4: Validate Machine ID
        machine_query = await db.execute(select(Machine).filter(Machine.id == machine_id))
        machine = machine_query.scalars().first()
        if not machine:
            # For demonstration, auto-create the machine if it doesn't exist
            machine = Machine(id=machine_id, location=location, district="Unknown")
            db.add(machine)
            await db.commit()
            await db.refresh(machine)

        # Step 5: Generate Complaint ID and Store
        complaint_id = await generate_complaint_id(db)
        
        new_complaint = Complaint(
            complaint_id=complaint_id,
            machine_id=machine_id,
            transcript=extracted_data.get("corrected_transcript", transcript),
            transcript_english=transcript_english,
            citizen_name=extracted_data.get("name"),
            village=extracted_data.get("village"),
            address=extracted_data.get("address"),
            complaint=extracted_data.get("complaint", "Unknown issue"),
            category=extracted_data.get("category"),
            priority=extracted_data.get("priority")
        )

        db.add(new_complaint)
        await db.commit()
        await db.refresh(new_complaint)

        return {
            "success": True,
            "complaint_id": complaint_id,
            "status": "Processing"
        }

    except Exception as e:
        # Ensure cleanup in case of unexpected outer errors
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=str(e))
