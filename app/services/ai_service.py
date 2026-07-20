from openai import AsyncOpenAI
import json
import os
import logging
from app.core.config import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
logger = logging.getLogger(__name__)

async def process_audio(file_path: str) -> str:
    """
    Sends the audio file to OpenAI Audio API.
    Returns the raw transcript.
    """
    try:
        with open(file_path, "rb") as f:
            transcript = await client.audio.transcriptions.create(
                model="gpt-4o-transcribe",
                file=f,
                response_format="text"
            )
        return transcript
    except Exception as e:
        logger.error(f"Whisper API error: {e}")
        raise
    finally:
        # STRICT REQUIREMENT: Delete temporary audio immediately after transcription
        if os.path.exists(file_path):
            os.remove(file_path)

async def extract_complaint_info(raw_transcript: str) -> dict:
    """
    Sends the transcript to OpenAI GPT to extract structured complaint info, 
    translate it to English, and fix the spelling of the native language transcription.
    """
    system_prompt = (
        "You are a data extraction assistant for a public grievance kiosk in India. "
        "The user will provide a raw transcribed text (which may have phonetic errors). "
        "Your task is to:\n"
        "1. Translate the transcript into English.\n"
        "2. Extract the citizen's name, village, and address.\n"
        "3. Generate a concise English complaint summary.\n"
        "4. Determine the complaint category.\n"
        "5. Determine the priority (High, Medium, Low).\n"
        "6. Correct spelling and grammar of the transcript. IMPORTANT: `corrected_transcript` MUST be in the EXACT ORIGINAL LANGUAGE AND SCRIPT (e.g., Telugu script for Telugu, Hindi script for Hindi). DO NOT translate it into English.\n"
        "Extract and return ONLY a valid JSON object with these exact keys:\n"
        "  - name (string or null)\n"
        "  - village (string or null)\n"
        "  - address (string or null)\n"
        "  - complaint (string)\n"
        "  - category (string or null)\n"
        "  - priority (string or null)\n"
        "  - english_translation (string)\n"
        "  - corrected_transcript (string)\n"
        "Output JSON only. No explanation, no markdown."
    )

    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Raw Transcript:\n{raw_transcript}"},
            ],
            response_format={"type": "json_object"},
            max_tokens=1024,
        )
        content = response.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        logger.error(f"GPT Extraction error: {e}")
        raise
