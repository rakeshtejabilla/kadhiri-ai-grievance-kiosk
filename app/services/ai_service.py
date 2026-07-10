from openai import AsyncOpenAI
import json
import os
import logging
from app.core.config import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
logger = logging.getLogger(__name__)

async def process_audio(file_path: str) -> tuple[str, str]:
    """
    Sends the audio file to OpenAI Whisper API.
    Returns a tuple of (original_transcript, english_translation).

    - Transcription uses auto language detection (Telugu, Hindi, English, etc.)
    - Translation always outputs English via Whisper's dedicated translation endpoint.
    Both calls are made in parallel for efficiency.
    """
    import asyncio

    async def _transcribe(path: str) -> str:
        with open(path, "rb") as f:
            return await client.audio.transcriptions.create(
                model="whisper-1",
                file=f,
                response_format="text"
            )

    async def _translate(path: str) -> str:
        with open(path, "rb") as f:
            return await client.audio.translations.create(
                model="whisper-1",
                file=f,
                prompt="The following is a public grievance from a citizen. Please translate to English.",
                response_format="text"
            )

    try:
        # Run both Whisper calls in parallel
        transcript, translation = await asyncio.gather(
            _transcribe(file_path),
            _translate(file_path),
        )
        return transcript, translation
    except Exception as e:
        logger.error(f"Whisper API error: {e}")
        raise
    finally:
        # STRICT REQUIREMENT: Delete temporary audio immediately after transcription
        if os.path.exists(file_path):
            os.remove(file_path)

async def extract_complaint_info(raw_transcript: str, english_translation: str) -> dict:
    """
    Sends the transcript to OpenAI GPT to extract structured complaint info and 
    fix the spelling of the native language transcription using the English context.
    """
    system_prompt = (
        "You are a data extraction assistant for a public grievance kiosk in India. "
        "The user will provide a raw transcribed text (which may have phonetic errors) and its perfect English translation. "
        "Your task is to fix the raw transcript's spelling in its ORIGINAL spoken language (Telugu, Hindi, or English), "
        "and extract the required fields. Extract and return ONLY a valid JSON object with these exact keys:\n"
        "  - name (string or null): citizen's name if mentioned\n"
        "  - village (string or null): village or area name if mentioned\n"
        "  - address (string or null): full address if mentioned\n"
        "  - complaint (string): a clear English summary of the core grievance\n"
        "  - category (string or null): e.g. Water Supply, Electricity, Roads, Sanitation, Healthcare, etc.\n"
        "  - priority (string or null): 'High', 'Medium', or 'Low' based on urgency\n"
        "  - corrected_transcript (string): The cleaned-up, properly spelled transcript in the ORIGINAL spoken language.\n"
        "Output JSON only. No explanation, no markdown."
    )

    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Raw Transcript:\n{raw_transcript}\n\nEnglish Translation:\n{english_translation}"},
            ],
            response_format={"type": "json_object"},
            max_tokens=1024,
        )
        content = response.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        logger.error(f"GPT Extraction error: {e}")
        raise
