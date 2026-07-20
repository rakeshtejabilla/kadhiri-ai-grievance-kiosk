from openai import AsyncOpenAI
import json
import os
import logging
from app.core.config import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
logger = logging.getLogger(__name__)

async def process_audio(file_path: str) -> str:
    """
    Sends the audio file to OpenAI Whisper API for transcription only.
    Language is auto-detected (Telugu, Hindi, English, etc.).
    Returns the raw transcript exactly as Whisper produces it — no correction.
    The audio file is deleted immediately after transcription.
    """
    try:
        with open(file_path, "rb") as f:
            transcript = await client.audio.transcriptions.create(
                model="whisper-1",
                file=f,
                response_format="text"
            )
        return transcript
    except Exception as e:
        logger.error(f"Whisper transcription error: {e}")
        raise
    finally:
        # STRICT REQUIREMENT: Delete temporary audio immediately after transcription
        if os.path.exists(file_path):
            os.remove(file_path)


async def translate_to_english(raw_transcript: str) -> str:
    """
    Uses ChatGPT to translate the raw transcript to English.
    The raw transcript is untouched — this only produces a clean English version.
    Works for Telugu, Hindi, English, or any mixed language input.
    """
    system_prompt = (
        "You are a translation assistant for a public grievance kiosk in India. "
        "The user will provide a raw transcribed text which may be in Telugu, Hindi, English, "
        "or a mix of languages. Translate it accurately into English. "
        "Output ONLY the English translation. No explanation, no markdown."
    )

    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": raw_transcript},
            ],
            max_tokens=1024,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"GPT translation error: {e}")
        raise


async def extract_complaint_info(english_translation: str) -> dict:
    """
    Uses ChatGPT to extract structured fields from the English translation.
    Extracts: name, village, address, complaint summary, category, priority.
    The raw transcript stored in DB is never touched by this function.
    """
    system_prompt = (
        "You are a data extraction assistant for a public grievance kiosk in India. "
        "The user will provide an English text of a citizen's grievance. "
        "Extract and return ONLY a valid JSON object with these exact keys:\n"
        "  - name (string or null): citizen's name if mentioned\n"
        "  - village (string or null): village or area name if mentioned\n"
        "  - address (string or null): full address if mentioned\n"
        "  - complaint (string): a clear English summary of the core grievance\n"
        "  - category (string or null): e.g. Water Supply, Electricity, Roads, Sanitation, Healthcare, etc.\n"
        "  - priority (string or null): 'High', 'Medium', or 'Low' based on urgency\n"
        "Output JSON only. No explanation, no markdown."
    )

    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": english_translation},
            ],
            response_format={"type": "json_object"},
            max_tokens=1024,
        )
        content = response.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        logger.error(f"GPT extraction error: {e}")
        raise
