/**
 * VideoCallInterview Component
 * 
 * Full-screen video call-style interview interface.
 * Natural conversation flow - auto-detects when you stop speaking.
 * No manual record/submit buttons - just talk naturally.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { aiAPI } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import useVoiceConversation from '../hooks/useVoiceConversation';
import useAudioAnalyser from '../hooks/useAudioAnalyser';
import useBrowserTTS from '../hooks/useBrowserTTS';
import AvatarCharacter from './AvatarCharacter';
import './VideoCallInterview.css';

// AI Service URL for audio files
const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8001';

function VideoCallInterview() {
    const { jobId, interviewId: existingInterviewId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Call state
    const [callStatus, setCallStatus] = useState('waiting'); // waiting | connecting | active | ended
    const [avatarState, setAvatarState] = useState('idle'); // idle | speaking | listening | processing

    // Interview state
    const [interviewId, setInterviewId] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [questionNumber, setQuestionNumber] = useState(0);
    const [totalQuestions] = useState(10);
    const [isAIProcessing, setIsAIProcessing] = useState(false);
    const [isMuted, setIsMuted] = useState(true);

    // Transcript (from Whisper)
    const [transcript, setTranscript] = useState('');
    const [isTranscribing, setIsTranscribing] = useState(false);

    // Audio playback
    const audioRef = useRef(null);
    const { amplitude, initializeAnalyser, startMonitoring, stopMonitoring } = useAudioAnalyser();

    // Refs for callback access and preventing race conditions
    const interviewIdRef = useRef(null);
    const isEnablingMicRef = useRef(false);
    const isSubmittingRef = useRef(false);

    // Sync ref with state
    useEffect(() => {
        interviewIdRef.current = interviewId;
    }, [interviewId]);

    // Browser TTS fallback
    const { speak: speakBrowserTTS, stop: stopBrowserTTS, isSpeaking: isBrowserSpeaking } = useBrowserTTS();
    const [ttsAmplitude, setTtsAmplitude] = useState(0);

    // Error state
    const [error, setError] = useState('');

    // Voice conversation with auto-detection
    const handleSpeechEnd = useCallback(async (audioBlob) => {
        console.log('handleSpeechEnd called, blob size:', audioBlob?.size);

        // Prevent duplicate submissions
        if (isSubmittingRef.current) {
            console.log('Already submitting, ignoring');
            return;
        }

        if (isAIProcessing || avatarState === 'speaking') {
            console.log('Skipping - AI is processing or speaking');
            return;
        }

        isSubmittingRef.current = true;
        setIsTranscribing(true);
        setAvatarState('processing');

        try {
            await submitAudioAnswer(audioBlob);
        } finally {
            isSubmittingRef.current = false;
        }
    }, [isAIProcessing, avatarState]);

    const {
        isListening,
        isSpeaking,
        volume,
        error: voiceError,
        startListening,
        stopListening,
    } = useVoiceConversation({
        onSpeechEnd: handleSpeechEnd,
        silenceThreshold: 1500,
    });

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopListening();
            stopBrowserTTS();
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, [stopListening, stopBrowserTTS]);

    // Show voice errors
    useEffect(() => {
        if (voiceError) {
            setError(voiceError);
        }
    }, [voiceError]);

    // Update avatar based on listening/speaking (but don't trigger mic changes)
    useEffect(() => {
        if (!isMuted && isListening && !isAIProcessing && avatarState !== 'speaking' && avatarState !== 'processing') {
            setAvatarState(isSpeaking ? 'listening' : 'idle');
        }
    }, [isListening, isSpeaking, isMuted, isAIProcessing, avatarState]);

    const initializeInterview = async () => {
        try {
            setCallStatus('connecting');

            const currentJobId = jobId || existingInterviewId || 'demo';

            const response = await aiAPI.startInterviewWithAudio({
                job_id: currentJobId,
                candidate_id: user?.id || 'demo-candidate',
                candidate_name: user?.name || user?.full_name || 'Demo User'
            });

            const data = response.data;
            setInterviewId(data.interview_id);
            setCurrentQuestion(data.current_question);
            setQuestionNumber(1);
            setCallStatus('active');

            if (data.audio_url) {
                await playQuestionAudio(data.audio_url);
            } else {
                await speakWithBrowserTTS(data.current_question);
            }
        } catch (err) {
            console.error('Failed to start interview:', err);
            const mockQuestion = "Hello! I'm Aria, your AI interviewer today. Tell me about yourself and your background.";
            setCurrentQuestion(mockQuestion);
            setQuestionNumber(1);
            setCallStatus('active');
            await speakWithBrowserTTS(mockQuestion);
        }
    };

    const speakWithBrowserTTS = async (text) => {
        setIsMuted(true);
        setAvatarState('speaking');

        try {
            await speakBrowserTTS(text, {
                rate: 0.95,
                pitch: 1.0,
                onAmplitude: (amp) => setTtsAmplitude(amp),
                onEnd: () => {
                    setTtsAmplitude(0);
                    setAvatarState('idle');
                    enableMic();
                }
            });
        } catch (err) {
            console.error('Browser TTS failed:', err);
            setAvatarState('idle');
            enableMic();
        }
    };

    const playQuestionAudio = async (audioUrl) => {
        if (!audioRef.current) return;

        setIsMuted(true);
        setAvatarState('speaking');

        try {
            const fullUrl = audioUrl.startsWith('http') ? audioUrl : `${AI_SERVICE_URL}${audioUrl}`;
            console.log('Playing audio from:', fullUrl);

            audioRef.current.src = fullUrl;
            initializeAnalyser(audioRef.current);

            audioRef.current.onplay = () => {
                console.log('Audio playing');
                startMonitoring();
            };

            audioRef.current.onended = () => {
                console.log('Audio ended');
                stopMonitoring();
                setAvatarState('idle');
                enableMic();
            };

            audioRef.current.onerror = (e) => {
                console.error('Audio playback error:', e);
                speakWithBrowserTTS(currentQuestion);
            };

            await audioRef.current.play();
        } catch (err) {
            console.error('Audio playback failed:', err);
            await speakWithBrowserTTS(currentQuestion);
        }
    };

    // ✅ FIXED: Only stop if already listening, otherwise just start
    const enableMic = async () => {
        // Prevent multiple simultaneous calls
        if (isEnablingMicRef.current) {
            console.log('Already enabling mic, skipping');
            return;
        }

        isEnablingMicRef.current = true;
        console.log('enableMic called, isListening:', isListening);

        try {
            // Only stop if currently listening
            if (isListening) {
                console.log('Stopping existing session...');
                stopListening();
                // Wait for cleanup
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            // Start fresh
            console.log('Starting fresh listening session...');
            await startListening();

            setIsMuted(false);
            setAvatarState('idle');
            console.log('Mic enabled successfully');
        } catch (err) {
            console.error('Failed to enable mic:', err);
            setError('Failed to access microphone');
        } finally {
            isEnablingMicRef.current = false;
        }
    };

    const toggleMic = async () => {
        if (isMuted) {
            await enableMic();
        } else {
            stopListening();
            setIsMuted(true);
            setAvatarState('idle');
        }
    };

    const submitAudioAnswer = async (blob) => {
        const currentId = interviewIdRef.current;
        console.log('submitAudioAnswer called with blob size:', blob?.size, 'Interview ID:', currentId);

        if (!blob || blob.size < 1000) {
            console.error('Audio blob too small or empty, size:', blob?.size);
            setIsTranscribing(false);
            setAvatarState('idle');
            // Re-enable mic to try again
            setTimeout(() => enableMic(), 500);
            return;
        }

        if (!currentId) {
            console.error('No interview ID available for submission');
            setIsTranscribing(false);
            setAvatarState('idle');
            return;
        }

        setIsAIProcessing(true);
        setIsMuted(true);

        try {
            console.log(`Submitting audio to /ai/interview/${currentId}/submit-audio...`);
            const response = await aiAPI.submitAudioResponse(currentId, blob);
            console.log('Audio submitted successfully, response:', response.data);
            const data = response.data;

            setTranscript(data.transcript);
            setIsTranscribing(false);
            setIsAIProcessing(false);

            if (data.is_complete) {
                endInterview();
            } else {
                setCurrentQuestion(data.next_question);
                setQuestionNumber(prev => prev + 1);

                if (data.audio_url) {
                    await playQuestionAudio(data.audio_url);
                } else {
                    await speakWithBrowserTTS(data.next_question);
                }
            }
        } catch (err) {
            console.error('Failed to submit audio:', err);
            setIsTranscribing(false);
            setIsAIProcessing(false);
            setError('Failed to process your response. Please try again.');

            // Re-enable mic after error
            setTimeout(() => enableMic(), 1000);
        }
    };

    const endInterview = async () => {
        stopListening();
        setIsMuted(true);
        setCallStatus('ended');
        setAvatarState('idle');

        try {
            await aiAPI.completeInterview(interviewId);
        } catch (err) {
            console.error('Failed to complete interview:', err);
        }

        setTimeout(() => {
            navigate(`/interviews/${interviewId}/feedback`);
        }, 3000);
    };

    const getStatusText = () => {
        if (callStatus === 'connecting') return 'Connecting...';
        if (isAIProcessing || isTranscribing) return 'Processing...';
        if (avatarState === 'speaking') return 'Aria is speaking...';
        if (isSpeaking && !isMuted) return '🎤 Listening...';
        if (!isMuted && isListening) return 'Your turn to speak';
        if (isMuted) return 'Mic muted';
        return 'Ready';
    };

    return (
        <div className="video-call-page">
            <audio ref={audioRef} crossOrigin="anonymous" />

            {/* Status overlay */}
            <div className="status-overlay">
                <div className={`status-badge ${isSpeaking && !isMuted ? 'speaking' : ''} ${avatarState === 'speaking' ? 'ai-speaking' : ''}`}>
                    {callStatus === 'connecting' && <span className="status-spinner"></span>}
                    {isSpeaking && !isMuted && <span className="speaking-indicator"></span>}
                    {getStatusText()}
                </div>
                <div className="question-progress">
                    Question {questionNumber} of ~{totalQuestions}
                </div>
            </div>

            {/* Voice level indicator */}
            {!isMuted && isListening && (
                <div className="voice-level-container">
                    <div
                        className="voice-level-bar"
                        style={{ transform: `scaleY(${0.2 + volume * 3})` }}
                    />
                </div>
            )}

            {/* Main video tile */}
            <div className="video-tile">
                <div className="video-tile-inner">
                    {callStatus === 'waiting' ? (
                        <div className="waiting-state">
                            <div className="avatar-preview">
                                <AvatarCharacter
                                    state="idle"
                                    amplitude={0}
                                    name="Aria"
                                />
                            </div>
                            <h2>Ready to Start Your Interview</h2>
                            <p>Click the button below to begin your AI interview with Aria</p>
                            <button
                                className="start-interview-btn"
                                onClick={initializeInterview}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                </svg>
                                Start Interview
                            </button>
                        </div>
                    ) : callStatus === 'connecting' ? (
                        <div className="connecting-state">
                            <div className="connecting-spinner"></div>
                            <p>Joining interview...</p>
                        </div>
                    ) : callStatus === 'ended' ? (
                        <div className="ended-state">
                            <div className="ended-icon">✓</div>
                            <h2>Interview Complete</h2>
                            <p>Redirecting to feedback...</p>
                        </div>
                    ) : (
                        <AvatarCharacter
                            state={avatarState}
                            amplitude={avatarState === 'speaking' ? (ttsAmplitude || amplitude) : (isSpeaking ? volume * 2 : 0)}
                            name="Aria"
                        />
                    )}
                </div>
            </div>

            {/* Current question display */}
            {callStatus === 'active' && currentQuestion && (
                <div className="question-display">
                    <div className="question-text">
                        "{currentQuestion}"
                    </div>
                </div>
            )}

            {/* Transcript display */}
            {callStatus === 'active' && (
                <div className="transcript-container">
                    <div className="transcript-label">
                        {isTranscribing ? 'Transcribing...' : 'Your last response:'}
                    </div>
                    <div className="transcript-text">
                        {isTranscribing ? (
                            <span className="transcribing-indicator">
                                <span className="dot"></span>
                                <span className="dot"></span>
                                <span className="dot"></span>
                            </span>
                        ) : transcript ? (
                            transcript
                        ) : (
                            <span className="transcript-placeholder">
                                {isMuted ? 'Click the mic to start talking' : 'Start speaking...'}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Error display */}
            {error && (
                <div className="error-toast">
                    {error}
                    <button onClick={() => setError('')}>×</button>
                </div>
            )}

            {/* Control bar */}
            <div className="control-bar">
                <div className="control-bar-inner">
                    {/* Mic toggle button */}
                    <button
                        className={`control-btn control-btn-mic ${isMuted ? 'muted' : ''} ${isSpeaking && !isMuted ? 'active' : ''}`}
                        onClick={toggleMic}
                        disabled={callStatus !== 'active' || avatarState === 'speaking' || isAIProcessing}
                        title={isMuted ? 'Unmute' : 'Mute'}
                    >
                        {isMuted ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="1" y1="1" x2="23" y2="23"></line>
                                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                                <line x1="12" y1="19" x2="12" y2="23"></line>
                                <line x1="8" y1="23" x2="16" y2="23"></line>
                            </svg>
                        ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                <line x1="12" y1="19" x2="12" y2="23"></line>
                                <line x1="8" y1="23" x2="16" y2="23"></line>
                            </svg>
                        )}
                    </button>

                    {/* Conversation hint */}
                    <div className="conversation-hint">
                        {isMuted
                            ? 'Click mic to speak'
                            : isAIProcessing
                                ? 'Processing...'
                                : 'Just talk naturally'}
                    </div>

                    {/* End interview button */}
                    <button
                        className="control-btn control-btn-end"
                        onClick={endInterview}
                        disabled={callStatus !== 'active'}
                        title="End Interview"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path>
                            <line x1="23" y1="1" x2="17" y2="7"></line>
                            <line x1="17" y1="1" x2="23" y2="7"></line>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default VideoCallInterview;