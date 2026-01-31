/**
 * useBrowserTTS Hook
 * 
 * Fallback TTS using Web Speech API synthesis.
 * Used when Piper TTS is not available on the server.
 */

import { useRef, useCallback, useState } from 'react';

export function useBrowserTTS() {
    const utteranceRef = useRef(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isSupported, setIsSupported] = useState(
        typeof window !== 'undefined' && 'speechSynthesis' in window
    );

    // Speak text using browser TTS
    const speak = useCallback((text, options = {}) => {
        return new Promise((resolve, reject) => {
            if (!isSupported) {
                reject(new Error('Speech synthesis not supported'));
                return;
            }

            // Cancel any ongoing speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utteranceRef.current = utterance;

            // Configure voice options
            utterance.rate = options.rate || 1.0;
            utterance.pitch = options.pitch || 1.0;
            utterance.volume = options.volume || 1.0;
            utterance.lang = options.lang || 'en-US';

            // Find a good voice
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v =>
                v.name.includes('Google') ||
                v.name.includes('Samantha') ||
                v.name.includes('Microsoft')
            ) || voices.find(v => v.lang.startsWith('en')) || voices[0];

            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }

            utterance.onstart = () => {
                setIsSpeaking(true);
                if (options.onStart) options.onStart();
            };

            utterance.onend = () => {
                setIsSpeaking(false);
                resolve();
                if (options.onEnd) options.onEnd();
            };

            utterance.onerror = (event) => {
                setIsSpeaking(false);
                reject(event.error);
                if (options.onError) options.onError(event);
            };

            // Provide amplitude callback for lip sync (approximate)
            if (options.onAmplitude) {
                let amplitudeInterval;
                utterance.onstart = () => {
                    setIsSpeaking(true);
                    if (options.onStart) options.onStart();

                    // Simulate amplitude changes for animation
                    amplitudeInterval = setInterval(() => {
                        // Random amplitude between 0.3 and 0.9 to simulate speech
                        const amplitude = 0.3 + Math.random() * 0.6;
                        options.onAmplitude(amplitude);
                    }, 100);
                };

                utterance.onend = () => {
                    clearInterval(amplitudeInterval);
                    options.onAmplitude(0);
                    setIsSpeaking(false);
                    resolve();
                    if (options.onEnd) options.onEnd();
                };
            }

            window.speechSynthesis.speak(utterance);
        });
    }, [isSupported]);

    // Stop speaking
    const stop = useCallback(() => {
        if (isSupported) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }, [isSupported]);

    // Pause speaking
    const pause = useCallback(() => {
        if (isSupported) {
            window.speechSynthesis.pause();
        }
    }, [isSupported]);

    // Resume speaking
    const resume = useCallback(() => {
        if (isSupported) {
            window.speechSynthesis.resume();
        }
    }, [isSupported]);

    return {
        speak,
        stop,
        pause,
        resume,
        isSpeaking,
        isSupported,
    };
}

export default useBrowserTTS;
