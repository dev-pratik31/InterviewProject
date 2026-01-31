/**
 * useAudioAnalyser Hook
 * 
 * Provides audio amplitude analysis for lip-sync animation.
 * Uses Web Audio API to extract frequency data from audio playback.
 */

import { useRef, useCallback, useState } from 'react';

export function useAudioAnalyser() {
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const animationRef = useRef(null);

    const [amplitude, setAmplitude] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    // Initialize audio context and analyser
    const initializeAnalyser = useCallback((audioElement) => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Create analyser if not exists
        if (!analyserRef.current) {
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            analyserRef.current.connect(audioContextRef.current.destination);
        }

        // Create source from audio element
        if (!sourceRef.current) {
            sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement);
            sourceRef.current.connect(analyserRef.current);
        }

        return analyserRef.current;
    }, []);

    // Start amplitude monitoring
    const startMonitoring = useCallback(() => {
        if (!analyserRef.current) return;

        setIsPlaying(true);
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

        const updateAmplitude = () => {
            if (!analyserRef.current) return;

            analyserRef.current.getByteFrequencyData(dataArray);

            // Calculate average amplitude (0-1 range)
            const sum = dataArray.reduce((a, b) => a + b, 0);
            const avg = sum / dataArray.length;
            const normalizedAmplitude = Math.min(1, avg / 128);

            setAmplitude(normalizedAmplitude);
            animationRef.current = requestAnimationFrame(updateAmplitude);
        };

        animationRef.current = requestAnimationFrame(updateAmplitude);
    }, []);

    // Stop monitoring
    const stopMonitoring = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
        setIsPlaying(false);
        setAmplitude(0);
    }, []);

    // Cleanup
    const cleanup = useCallback(() => {
        stopMonitoring();
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
        audioContextRef.current = null;
        analyserRef.current = null;
        sourceRef.current = null;
    }, [stopMonitoring]);

    return {
        amplitude,
        isPlaying,
        initializeAnalyser,
        startMonitoring,
        stopMonitoring,
        cleanup,
    };
}

export default useAudioAnalyser;
