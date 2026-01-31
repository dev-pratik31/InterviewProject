import { useState, useRef, useCallback, useEffect } from 'react';

const useVoiceConversation = ({ onSpeechEnd, silenceThreshold = 1500 }) => {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [volume, setVolume] = useState(0);
    const [error, setError] = useState(null);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const streamRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animationFrameRef = useRef(null);
    const silenceTimeoutRef = useRef(null);
    const recordingStartTimeRef = useRef(null);
    const isSpeakingRef = useRef(false);
    const speechStartTimeRef = useRef(null);
    const lastSpeechTimeRef = useRef(null);

    // Speech detection parameters
    const VOLUME_THRESHOLD = 0.02;
    const MIN_RECORDING_TIME = 1000; // Minimum 1 second
    const MIN_SPEECH_DURATION = 300; // Minimum 300ms of continuous speech
    const SILENCE_DURATION = silenceThreshold; // Use prop value

    const checkAudioLevel = useCallback(() => {
        if (!analyserRef.current || !isListening) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average volume
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        const normalizedVolume = average / 255;

        // Update volume state for UI
        setVolume(normalizedVolume);

        const now = Date.now();
        const recordingDuration = recordingStartTimeRef.current
            ? now - recordingStartTimeRef.current
            : 0;

        // Detect speech
        if (normalizedVolume > VOLUME_THRESHOLD) {
            if (!isSpeakingRef.current) {
                // Speech just started
                speechStartTimeRef.current = now;
                isSpeakingRef.current = true;
                setIsSpeaking(true);
                console.log('Started speaking, volume:', normalizedVolume, 'duration so far:', recordingDuration, 'ms');
            }

            // Update last speech time
            lastSpeechTimeRef.current = now;

            // Clear any existing silence timeout
            if (silenceTimeoutRef.current) {
                clearTimeout(silenceTimeoutRef.current);
                silenceTimeoutRef.current = null;
            }
        } else if (isSpeakingRef.current) {
            // Currently in a speaking state but volume dropped
            const silenceDuration = now - (lastSpeechTimeRef.current || now);
            const speechDuration = lastSpeechTimeRef.current
                ? lastSpeechTimeRef.current - speechStartTimeRef.current
                : 0;

            // Only trigger end if we've had enough silence AND enough speech
            if (silenceDuration > SILENCE_DURATION &&
                speechDuration > MIN_SPEECH_DURATION &&
                recordingDuration > MIN_RECORDING_TIME) {

                console.log('Speech ended. Silence:', silenceDuration, 'ms, Speech:', speechDuration, 'ms, Total:', recordingDuration, 'ms');

                // Set timeout to finalize recording
                if (!silenceTimeoutRef.current) {
                    silenceTimeoutRef.current = setTimeout(() => {
                        if (isSpeakingRef.current && mediaRecorderRef.current?.state === 'recording') {
                            console.log('Finalizing recording after silence...');
                            finalizeRecording();
                        }
                    }, 500); // Additional 500ms buffer
                }
            }
        }

        animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
    }, [isListening, SILENCE_DURATION]);

    const finalizeRecording = useCallback(() => {
        console.log('finalizeRecording called');

        // Clear animation frame
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        // Clear silence timeout
        if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
        }

        // Stop recording
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            console.log('Stopping MediaRecorder...');
            mediaRecorderRef.current.stop();
        }

        // Stop media stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        // Close audio context
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        setIsListening(false);
        setIsSpeaking(false);
        setVolume(0);
        isSpeakingRef.current = false;
    }, []);

    const startListening = useCallback(async () => {
        try {
            console.log('startListening called');
            setError(null);

            // Clean up any existing resources first
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }

            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000
                }
            });

            streamRef.current = stream;
            console.log('Got media stream');

            // Set up audio analysis
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 2048;
            analyserRef.current.smoothingTimeConstant = 0.8;

            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);

            // Set up MediaRecorder
            audioChunksRef.current = [];

            const mimeTypes = [
                'audio/webm;codecs=opus',
                'audio/webm',
                'audio/ogg;codecs=opus',
                'audio/mp4'
            ];

            let selectedMimeType = '';
            for (const mimeType of mimeTypes) {
                if (MediaRecorder.isTypeSupported(mimeType)) {
                    selectedMimeType = mimeType;
                    break;
                }
            }

            console.log('Selected MIME type:', selectedMimeType);

            mediaRecorderRef.current = new MediaRecorder(stream, {
                mimeType: selectedMimeType,
                audioBitsPerSecond: 128000
            });

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                    console.log('Audio chunk received, size:', event.data.size);
                }
            };

            mediaRecorderRef.current.onstop = async () => {
                const duration = recordingStartTimeRef.current
                    ? Date.now() - recordingStartTimeRef.current
                    : 0;

                console.log('Recorder stopped. Chunks:', audioChunksRef.current.length, 'Duration:', duration, 'ms');

                if (audioChunksRef.current.length > 0) {
                    const audioBlob = new Blob(audioChunksRef.current, {
                        type: selectedMimeType || 'audio/webm'
                    });

                    console.log('Created audio blob. Size:', audioBlob.size, 'Type:', audioBlob.type);

                    // Check if recording is long enough and has sufficient data
                    const MIN_BLOB_SIZE = 5000; // 5KB minimum
                    if (audioBlob.size < MIN_BLOB_SIZE || duration < MIN_RECORDING_TIME) {
                        console.log('Recording too short or small, skipping. Size:', audioBlob.size, 'Duration:', duration, 'ms');
                        audioChunksRef.current = [];
                        return;
                    }

                    // Call the callback with the audio blob
                    if (onSpeechEnd) {
                        console.log('Calling onSpeechEnd callback with blob');
                        onSpeechEnd(audioBlob);
                    }
                }

                audioChunksRef.current = [];
                recordingStartTimeRef.current = null;
                speechStartTimeRef.current = null;
                lastSpeechTimeRef.current = null;
            };

            // Start recording
            mediaRecorderRef.current.start(100); // Collect data every 100ms
            recordingStartTimeRef.current = Date.now();
            isSpeakingRef.current = false;
            speechStartTimeRef.current = null;
            lastSpeechTimeRef.current = null;

            setIsListening(true);
            setIsSpeaking(false);
            setVolume(0);

            console.log('Recording started successfully at', new Date(recordingStartTimeRef.current).toISOString());

            // Start monitoring audio levels
            checkAudioLevel();

        } catch (err) {
            console.error('Error starting recording:', err);
            setError('Failed to access microphone');
            setIsListening(false);
        }
    }, [checkAudioLevel, onSpeechEnd]);

    const stopListening = useCallback(() => {
        console.log('stopListening called');
        finalizeRecording();
    }, [finalizeRecording]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopListening();
        };
    }, [stopListening]);

    return {
        isListening,
        isSpeaking,
        volume,
        error,
        startListening,
        stopListening
    };
};

export default useVoiceConversation;