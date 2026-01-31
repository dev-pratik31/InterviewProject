"""
Piper TTS Service

Text-to-Speech generation using Piper for interview questions.
Falls back to browser-based TTS if Piper is not available.
"""

import asyncio
import os
import io
import wave
from pathlib import Path
from uuid import uuid4
from typing import Optional

# Check if piper-tts is available
try:
    from piper import PiperVoice
    PIPER_AVAILABLE = True
except ImportError:
    PIPER_AVAILABLE = False
    PiperVoice = None


class PiperTTS:
    """
    Piper TTS wrapper for generating speech audio.
    
    Piper is a fast, local neural TTS engine.
    https://github.com/rhasspy/piper
    """
    
    # Base directory for resolving relative paths (ai-service root)
    BASE_DIR = Path(__file__).parent.parent.parent  # From app/tts/ to ai-service/
    
    def __init__(
        self,
        model_path: Optional[str] = None,
        output_dir: Optional[str] = None,
    ):
        # Get model path from env or param
        raw_model_path = model_path or os.getenv("PIPER_MODEL_PATH", "")
        raw_output_dir = output_dir or os.getenv("PIPER_OUTPUT_DIR", "./audio_output")
        
        # Resolve relative paths from BASE_DIR
        if raw_model_path and not Path(raw_model_path).is_absolute():
            self.model_path = str(self.BASE_DIR / raw_model_path)
        else:
            self.model_path = raw_model_path
            
        if not Path(raw_output_dir).is_absolute():
            self.output_dir = self.BASE_DIR / raw_output_dir
        else:
            self.output_dir = Path(raw_output_dir)
        
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self._voice: Optional[PiperVoice] = None
        self._available = None
    
    async def is_available(self) -> bool:
        """Check if Piper TTS is installed and configured."""
        if self._available is not None:
            return self._available
        
        if not PIPER_AVAILABLE:
            self._available = False
            print("⚠️ piper-tts not installed")
            return False
        
        if not self.model_path or not Path(self.model_path).exists():
            self._available = False
            print(f"⚠️ Piper model not found: {self.model_path}")
            return False
        
        self._available = True
        return True
    
    def _get_voice(self) -> Optional[PiperVoice]:
        """Lazily load the Piper voice model."""
        if self._voice is None and PIPER_AVAILABLE and Path(self.model_path).exists():
            try:
                self._voice = PiperVoice.load(self.model_path)
                print(f"✅ Loaded Piper voice model: {self.model_path}")
            except Exception as e:
                print(f"❌ Failed to load Piper model: {e}")
                self._voice = None
        return self._voice
    
    async def synthesize(self, text: str, session_id: str = "") -> Optional[str]:
        """
        Convert text to speech audio file.
        
        Args:
            text: Text to synthesize
            session_id: Optional session ID for file naming
        
        Returns:
            URL path to the generated audio file, or None if failed
        """
        if not await self.is_available():
            return None
        
        # Generate unique filename
        file_id = f"{session_id}_{uuid4().hex[:8]}" if session_id else uuid4().hex
        output_file = self.output_dir / f"{file_id}.wav"
        
        try:
            # Run synthesis in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, self._synthesize_sync, text, str(output_file))
            
            # Return relative URL for serving
            return f"/audio/{output_file.name}"
            
        except Exception as e:
            print(f"Piper TTS synthesis failed: {e}")
            return None
    
    def _synthesize_sync(self, text: str, output_path: str):
        """Synchronous synthesis (run in thread pool)."""
        voice = self._get_voice()
        if voice is None:
            raise RuntimeError("Piper voice not loaded")
        
        # Generate audio
        with wave.open(output_path, 'wb') as wav_file:
            voice.synthesize(text, wav_file)
    
    def cleanup_old_files(self, max_age_hours: int = 1):
        """Remove audio files older than max_age_hours."""
        import time
        
        current_time = time.time()
        max_age_seconds = max_age_hours * 3600
        
        for file in self.output_dir.glob("*.wav"):
            try:
                if current_time - file.stat().st_mtime > max_age_seconds:
                    file.unlink()
            except Exception:
                pass


class BrowserTTSFallback:
    """
    Fallback TTS that instructs frontend to use Web Speech API synthesis.
    
    When Piper is not available, we return a special response that tells
    the frontend to use the browser's built-in speech synthesis.
    """
    
    @staticmethod
    def get_fallback_response(text: str) -> dict:
        """
        Return a response indicating browser TTS should be used.
        
        The frontend will detect this and use window.speechSynthesis.
        """
        return {
            "use_browser_tts": True,
            "text": text,
            "audio_url": None,
        }


# Singleton instance
_piper_instance: Optional[PiperTTS] = None


def get_piper_tts() -> PiperTTS:
    """Get or create Piper TTS instance."""
    global _piper_instance
    if _piper_instance is None:
        _piper_instance = PiperTTS()
    return _piper_instance


async def generate_speech(text: str, session_id: str = "") -> dict:
    """
    Generate speech for text, falling back to browser TTS if needed.
    
    Returns:
        dict with 'audio_url' (if Piper available) or 'use_browser_tts' flag
    """
    piper = get_piper_tts()
    
    if await piper.is_available():
        audio_url = await piper.synthesize(text, session_id)
        if audio_url:
            return {"audio_url": audio_url, "use_browser_tts": False, "text": text}
    
    # Fall back to browser TTS
    return BrowserTTSFallback.get_fallback_response(text)
