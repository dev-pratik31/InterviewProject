"""
OpenAI TTS Service

Text-to-Speech using OpenAI API.
"""

import os
import io
from pathlib import Path
from uuid import uuid4
from typing import Optional
from openai import AsyncOpenAI

from app.config import settings


class OpenAITTS:
    """
    OpenAI TTS API wrapper for speech synthesis.
    """
    
    # Base directory for audio output
    BASE_DIR = Path(__file__).parent.parent.parent
    
    def __init__(self, output_dir: Optional[str] = None):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = "tts-1"  # or "tts-1-hd" for higher quality
        self.voice = "alloy"  # Options: alloy, echo, fable, onyx, nova, shimmer
        
        raw_output_dir = output_dir or os.getenv("TTS_OUTPUT_DIR", "./audio_output")
        if not Path(raw_output_dir).is_absolute():
            self.output_dir = self.BASE_DIR / raw_output_dir
        else:
            self.output_dir = Path(raw_output_dir)
        
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    async def synthesize(
        self,
        text: str,
        session_id: str = "",
        voice: Optional[str] = None
    ) -> dict:
        """
        Convert text to speech audio file.
        
        Args:
            text: Text to synthesize
            session_id: Optional session ID for file naming
            voice: Optional voice override
        
        Returns:
            dict with 'audio_url' and 'filename'
        """
        try:
            # Generate unique filename
            file_id = f"{session_id}_{uuid4().hex[:8]}" if session_id else uuid4().hex
            output_file = self.output_dir / f"{file_id}.mp3"
            
            # Call OpenAI TTS API
            response = await self.client.audio.speech.create(
                model=self.model,
                voice=voice or self.voice,
                input=text,
                response_format="mp3"
            )
            
            # Write audio to file - response content is bytes
            response.stream_to_file(str(output_file))
            
            return {
                "audio_url": f"/audio/{output_file.name}",
                "filename": output_file.name,
                "text": text,
            }
            
        except Exception as e:
            print(f"OpenAI TTS failed: {e}")
            raise RuntimeError(f"TTS failed: {str(e)}")
    
    def cleanup_old_files(self, max_age_hours: int = 1):
        """Remove audio files older than max_age_hours."""
        import time
        
        current_time = time.time()
        max_age_seconds = max_age_hours * 3600
        
        for file in self.output_dir.glob("*.mp3"):
            try:
                if current_time - file.stat().st_mtime > max_age_seconds:
                    file.unlink()
            except Exception:
                pass


# Singleton
_tts_instance: Optional[OpenAITTS] = None


def get_openai_tts() -> OpenAITTS:
    """Get or create OpenAI TTS instance."""
    global _tts_instance
    if _tts_instance is None:
        _tts_instance = OpenAITTS()
    return _tts_instance


async def generate_speech(text: str, session_id: str = "") -> dict:
    """
    Generate speech for text using OpenAI TTS.
    
    Returns:
        dict with 'audio_url', 'filename', 'text'
    """
    tts = get_openai_tts()
    return await tts.synthesize(text, session_id)
