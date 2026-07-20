import os
from gtts import gTTS

text = "దయచేసి మీ సమస్యను తెలపండి"
language = 'te'

audio_dir = os.path.join("public", "audio")
os.makedirs(audio_dir, exist_ok=True)

audio_path = os.path.join(audio_dir, "prompt.mp3")

tts = gTTS(text=text, lang=language, slow=False)
tts.save(audio_path)

print(f"Successfully generated audio at: {audio_path}")
