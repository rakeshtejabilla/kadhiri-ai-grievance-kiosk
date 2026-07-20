from openai import AsyncOpenAI
import json
import os
import asyncio
import logging
from app.core.config import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
logger = logging.getLogger(__name__)


async def convert_to_wav(input_path: str) -> str:
    """
    Converts any audio file (WebM, Opus, etc.) to a standard 16kHz mono PCM WAV
    using ffmpeg. This is critical for Whisper accuracy — WebM/Opus files recorded
    in real-time by the browser's MediaRecorder lack a proper duration header,
    which causes Whisper to truncate long transcripts.

    Returns the path to the new WAV file. The original input file is deleted.
    """
    wav_path = input_path.rsplit(".", 1)[0] + ".wav"
    try:
        proc = await asyncio.create_subprocess_exec(
            "ffmpeg", "-y",
            "-i", input_path,
            "-ar", "16000",   # 16kHz sample rate (optimal for Whisper)
            "-ac", "1",        # mono
            "-f", "wav",
            wav_path,
            stdout=asyncio.subprocess.DEVNULL,
            stderr=asyncio.subprocess.PIPE,
        )
        _, stderr = await proc.communicate()
        if proc.returncode != 0:
            err_msg = stderr.decode(errors="replace") if stderr else "unknown ffmpeg error"
            logger.error(f"ffmpeg conversion failed: {err_msg}")
            raise RuntimeError(f"ffmpeg conversion failed: {err_msg}")
        logger.info(f"[convert_to_wav] Converted {input_path} -> {wav_path}")
        return wav_path
    finally:
        # Always remove the original non-WAV file
        if os.path.exists(input_path):
            os.remove(input_path)


async def process_audio(file_path: str) -> str:
    """
    Converts the recorded audio to WAV, then sends it to OpenAI Whisper for transcription.
    Language is auto-detected (Telugu, Hindi, English, etc.).
    Returns the raw transcript exactly as Whisper produces it — no correction.

    WHY the conversion step?
    The browser's MediaRecorder produces WebM/Opus files in real-time. These files
    have no duration metadata in their headers, which causes Whisper to sometimes
    stop transcribing early — especially for long, non-English audio. Converting to
    a proper WAV first ensures Whisper sees the complete audio with correct headers.

    Both the original and the converted WAV are deleted after transcription.
    """
    # Step 1: Convert WebM → WAV (fixes Whisper truncation on real-time recordings)
    wav_path = await convert_to_wav(file_path)
    try:
        with open(wav_path, "rb") as f:
            transcript = await client.audio.transcriptions.create(
                model="whisper-1",
                file=f,
                prompt=(
                    "This is a long and detailed public grievance from a citizen of India. "
                    "The speaker may speak in Telugu, Hindi, English, or a mix. "
                    "Please transcribe the complete audio accurately in its original spoken language "
                    "without skipping, translating, or truncating any part."
                ),
                response_format="text"
            )
        return transcript
    except Exception as e:
        logger.error(f"Whisper transcription error: {e}")
        raise
    finally:
        # Delete the converted WAV after transcription
        if os.path.exists(wav_path):
            os.remove(wav_path)


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
