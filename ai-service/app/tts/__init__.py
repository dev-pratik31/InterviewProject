"""
TTS Module

Text-to-Speech services for interview audio generation.
"""

from app.tts.openai_tts import (
    OpenAITTS,
    get_openai_tts,
    generate_speech,
)

# Legacy Piper TTS (optional fallback)
try:
    from app.tts.piper_tts import PiperTTS, get_piper_tts
except ImportError:
    PiperTTS = None
    get_piper_tts = None

__all__ = [
    "OpenAITTS",
    "get_openai_tts",
    "generate_speech",
    "PiperTTS",
    "get_piper_tts",
]
