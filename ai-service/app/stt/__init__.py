"""
STT Module

Speech-to-Text services for interview transcription.
"""

from app.stt.whisper_stt import (
    WhisperSTT,
    get_whisper_stt,
    transcribe_audio,
)

__all__ = [
    "WhisperSTT",
    "get_whisper_stt",
    "transcribe_audio",
]
