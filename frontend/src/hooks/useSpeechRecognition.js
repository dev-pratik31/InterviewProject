/**
 * useSpeechRecognition Hook
 * 
 * Wrapper for Web Speech API with live transcription support.
 * Provides interim and final transcript handling.
 */

import { useRef, useCallback, useState, useEffect } from 'react';

export function useSpeechRecognition() {
    const recognitionRef = useRef(null);

    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [interimTranscript, setInterimTranscript] = useState('');
    const [finalTranscript, setFinalTranscript] = useState('');
    const [error, setError] = useState(null);

    // Check browser support
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        setIsSupported(!!SpeechRecognition);
    }, []);

    // Initialize speech recognition
    const initializeRecognition = useCallback(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setError('Speech recognition not supported in this browser');
            return null;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
            setError(null);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setError(event.error);
            setIsListening(false);
        };

        recognition.onresult = (event) => {
            let interim = '';
            let final = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;

                if (event.results[i].isFinal) {
                    final += transcript;
                } else {
                    interim += transcript;
                }
            }

            setInterimTranscript(interim);

            if (final) {
                setFinalTranscript(prev => prev + ' ' + final);
            }
        };

        return recognition;
    }, []);

    // Start listening
    const startListening = useCallback(async () => {
        if (!isSupported) {
            setError('Speech recognition not supported');
            return;
        }

        // Request microphone permission first
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop()); // Release immediately
        } catch (err) {
            console.error('Mic permission denied:', err);
            setError('Microphone permission denied. Please allow microphone access.');
            return;
        }

        // Stop any existing recognition
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                // Ignore
            }
        }

        // Create new recognition instance
        recognitionRef.current = initializeRecognition();

        if (recognitionRef.current) {
            try {
                recognitionRef.current.start();
                console.log('Speech recognition started');
            } catch (err) {
                console.error('Failed to start recognition:', err);
                setError('Failed to start speech recognition');
            }
        }
    }, [isSupported, initializeRecognition]);

    // Stop listening
    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        setIsListening(false);
    }, []);

    // Reset transcript
    const resetTranscript = useCallback(() => {
        setInterimTranscript('');
        setFinalTranscript('');
    }, []);

    // Get full transcript
    const getFullTranscript = useCallback(() => {
        return (finalTranscript + ' ' + interimTranscript).trim();
    }, [finalTranscript, interimTranscript]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    return {
        isListening,
        isSupported,
        interimTranscript,
        finalTranscript,
        error,
        startListening,
        stopListening,
        resetTranscript,
        getFullTranscript,
    };
}

export default useSpeechRecognition;
