"""
Whisper STT Service

Speech-to-Text using OpenAI Whisper API.
"""

import io
from typing import Optional
from openai import AsyncOpenAI

from app.config import settings


class WhisperSTT:
    """
    OpenAI Whisper API wrapper for speech-to-text transcription.
    """

    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = "whisper-1"

    async def transcribe(
        self, audio_bytes: bytes, filename: str = "audio.webm", language: str = "en"
    ) -> dict:
        """
        Transcribe audio to text using Whisper.

        Args:
            audio_bytes: Raw audio data
            filename: Original filename with extension
            language: Language code (default: en)

        Returns:
            dict with 'transcript' and 'duration_seconds'
        """
        try:
            # Ensure filename has a valid extension
            if not filename:
                filename = "audio.webm"

            # Normalize filename - ensure it has .webm extension
            if not any(
                filename.lower().endswith(ext)
                for ext in [
                    ".webm",
                    ".wav",
                    ".mp3",
                    ".m4a",
                    ".ogg",
                    ".flac",
                    ".mp4",
                    ".mpeg",
                    ".mpga",
                    ".oga",
                ]
            ):
                filename = "audio.webm"

            print(f"DEBUG STT: Audio bytes size: {len(audio_bytes)}")
            print(f"DEBUG STT: Filename: {filename}")
            print(
                f"DEBUG STT: First 20 bytes: {audio_bytes[:20] if audio_bytes else 'empty'}"
            )

            # Validate audio data
            if not audio_bytes or len(audio_bytes) < 100:
                raise RuntimeError("Audio data is empty or too small")

            # Check for webm magic bytes (0x1A 0x45 0xDF 0xA3 for EBML header)
            # or other common audio formats
            is_valid_audio = (
                audio_bytes[:4] == b"\x1aE\xdf\xa3"  # WebM/Matroska
                or audio_bytes[:4] == b"RIFF"  # WAV
                or audio_bytes[:3] == b"ID3"  # MP3 with ID3
                or audio_bytes[:2] == b"\xff\xfb"  # MP3 without ID3
                or audio_bytes[:4] == b"OggS"  # OGG
                or audio_bytes[:4] == b"fLaC"  # FLAC
            )

            if not is_valid_audio:
                print(
                    f"WARNING: Audio may not be valid. First 10 bytes: {audio_bytes[:10].hex()}"
                )

            # Create file-like object with proper name attribute
            audio_file = io.BytesIO(audio_bytes)
            audio_file.name = filename  # Critical: Whisper uses this to detect format

            print(f"DEBUG STT: Sending to Whisper API with filename: {audio_file.name}")

            # Call Whisper API
            response = await self.client.audio.transcriptions.create(
                model=self.model,
                file=audio_file,
                language=language,
                response_format="verbose_json",
            )

            transcript = response.text.strip() if response.text else ""
            print(f"DEBUG STT: Transcription successful: {transcript[:100]}...")

            return {
                "transcript": transcript,
                "duration_seconds": getattr(response, "duration", 0),
                "language": getattr(response, "language", language),
            }

        except Exception as e:
            print(f"Whisper transcription failed: {e}")
            import traceback

            traceback.print_exc()
            raise RuntimeError(f"Transcription failed: {str(e)}")


# Singleton
_whisper_instance: Optional[WhisperSTT] = None


def get_whisper_stt() -> WhisperSTT:
    """Get or create Whisper STT instance."""
    global _whisper_instance
    if _whisper_instance is None:
        _whisper_instance = WhisperSTT()
    return _whisper_instance


async def transcribe_audio(audio_bytes: bytes, filename: str = "audio.webm") -> dict:
    """
    Convenience function to transcribe audio.

    Returns:
        dict with 'transcript', 'duration_seconds', 'language'
    """
    stt = get_whisper_stt()
    return await stt.transcribe(audio_bytes, filename)
