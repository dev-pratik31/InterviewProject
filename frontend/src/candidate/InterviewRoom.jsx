/**
 * AI Interview Room (Candidate)
 * 
 * Real-time AI interview with speech support.
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { aiAPI } from '../api/apiClient';

function InterviewRoom() {
    const { interviewId, jobId: urlJobId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    // Interview state
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Speech
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Messages
    const [messages, setMessages] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState('');

    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);

    // Get job info from URL params or location state
    const jobId = urlJobId || location.state?.jobId;
    const jobTitle = location.state?.jobTitle || 'Position';

    useEffect(() => {
        if (interviewId) {
            loadExistingSession();
        } else if (jobId) {
            startNewInterview();
        } else {
            setError('No job or interview specified');
            setLoading(false);
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [interviewId, jobId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadExistingSession = async () => {
        try {
            const res = await aiAPI.getInterviewState(interviewId);
            setSession(res.data);
            if (res.data.is_complete) {
                navigate(`/interview/${interviewId}/feedback`);
            }
        } catch (err) {
            setError('Failed to load interview session');
        } finally {
            setLoading(false);
        }
    };

    const startNewInterview = async () => {
        try {
            const res = await aiAPI.startInterview({
                job_id: jobId,
                application_id: 'direct',
            });

            setSession(res.data);
            setCurrentQuestion(res.data.current_question);
            setMessages([{
                role: 'interviewer',
                content: res.data.current_question,
                timestamp: new Date().toISOString(),
            }]);

            // Speak the first question
            speak(res.data.current_question);

        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to start interview');
        } finally {
            setLoading(false);
        }
    };

    // Text-to-Speech
    const speak = (text) => {
        if ('speechSynthesis' in window) {
            setIsSpeaking(true);
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.onend = () => setIsSpeaking(false);
            speechSynthesis.speak(utterance);
        }
    };

    // Speech Recognition
    const startListening = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            setError('Speech recognition not supported in this browser');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                finalTranscript += event.results[i][0].transcript;
            }
            setTranscript(finalTranscript);
        };

        recognitionRef.current.onerror = (event) => {
            console.error('Speech error:', event.error);
            setIsListening(false);
        };

        recognitionRef.current.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current.start();
        setIsListening(true);
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsListening(false);
    };

    const submitResponse = async () => {
        if (!transcript.trim() || !session) return;

        setSubmitting(true);
        stopListening();

        // Add candidate message
        const candidateMsg = {
            role: 'candidate',
            content: transcript,
            timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, candidateMsg]);

        try {
            const res = await aiAPI.submitResponse({
                interview_id: session.interview_id,
                response: transcript,
            });

            setTranscript('');
            setSession(res.data);

            if (res.data.status === 'complete') {
                // Interview finished
                navigate(`/interview/${session.interview_id}/feedback`);
                return;
            }

            if (res.data.next_question) {
                setCurrentQuestion(res.data.next_question);
                setMessages(prev => [...prev, {
                    role: 'interviewer',
                    content: res.data.next_question,
                    timestamp: new Date().toISOString(),
                }]);
                speak(res.data.next_question);
            }

        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to submit response');
        } finally {
            setSubmitting(false);
        }
    };

    const endInterview = async () => {
        if (!session) return;

        try {
            await aiAPI.completeInterview(session.interview_id);
            navigate(`/interview/${session.interview_id}/feedback`);
        } catch (err) {
            setError('Failed to complete interview');
        }
    };

    if (loading) {
        return (
            <div className="page">
                <div className="container flex justify-center items-center" style={{ minHeight: '60vh' }}>
                    <div className="text-center">
                        <div className="loading-spinner mb-md"></div>
                        <p>Preparing your interview...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !session) {
        return (
            <div className="page">
                <div className="container">
                    <div className="card text-center" style={{ padding: 'var(--spacing-2xl)' }}>
                        <h2>Interview Error</h2>
                        <p style={{ color: 'var(--color-error)' }}>{error}</p>
                        <button onClick={() => navigate('/jobs')} className="btn btn-primary mt-md">
                            Back to Jobs
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page animate-fade-in" style={{ paddingBottom: '120px' }}>
            <div className="container" style={{ maxWidth: '900px' }}>
                {/* Header */}
                <div className="card mb-md" style={{
                    background: 'var(--gradient-primary)',
                    border: 'none',
                    color: 'white'
                }}>
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 style={{ margin: 0, color: 'white' }}>AI Interview</h2>
                            <p style={{ margin: 0, opacity: 0.9, fontSize: '0.875rem' }}>{jobTitle}</p>
                        </div>
                        <div className="flex items-center gap-md">
                            <span className="badge" style={{
                                background: 'rgba(255,255,255,0.2)',
                                color: 'white'
                            }}>
                                Stage: {session?.current_stage || 'Starting'}
                            </span>
                            <button
                                onClick={endInterview}
                                className="btn btn-sm"
                                style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
                            >
                                End Interview
                            </button>
                        </div>
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="card mb-md" style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        borderColor: 'var(--color-error)'
                    }}>
                        {error}
                    </div>
                )}

                {/* AI Avatar & Status */}
                <div className="card mb-md text-center">
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: isSpeaking ? 'var(--gradient-primary)' : 'var(--color-bg-tertiary)',
                        margin: '0 auto var(--spacing-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        transition: 'all 0.3s ease',
                        animation: isSpeaking ? 'pulse 1s infinite' : 'none',
                    }}>
                        🤖
                    </div>
                    <p style={{
                        color: 'var(--color-text-muted)',
                        fontSize: '0.875rem',
                        margin: 0
                    }}>
                        {isSpeaking ? 'AI is speaking...' : 'AI Interviewer'}
                    </p>
                </div>

                {/* Chat Messages */}
                <div className="card" style={{
                    maxHeight: '400px',
                    overflowY: 'auto',
                    marginBottom: 'var(--spacing-md)'
                }}>
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            style={{
                                marginBottom: 'var(--spacing-md)',
                                padding: 'var(--spacing-md)',
                                borderRadius: 'var(--radius-md)',
                                background: msg.role === 'interviewer'
                                    ? 'var(--color-bg-tertiary)'
                                    : 'rgba(99, 102, 241, 0.1)',
                                marginLeft: msg.role === 'candidate' ? 'auto' : 0,
                                marginRight: msg.role === 'interviewer' ? 'auto' : 0,
                                maxWidth: '80%',
                            }}
                        >
                            <div style={{
                                fontSize: '0.75rem',
                                color: 'var(--color-text-muted)',
                                marginBottom: 'var(--spacing-xs)'
                            }}>
                                {msg.role === 'interviewer' ? '🤖 AI Interviewer' : '👤 You'}
                            </div>
                            <div style={{ lineHeight: 1.6 }}>{msg.content}</div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area - Fixed at bottom */}
                <div style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: 'var(--spacing-md)',
                    background: 'var(--color-bg-secondary)',
                    borderTop: '1px solid var(--color-border)',
                }}>
                    <div className="container" style={{ maxWidth: '900px' }}>
                        {/* Transcript Display */}
                        {transcript && (
                            <div className="card mb-sm" style={{ padding: 'var(--spacing-sm)' }}>
                                <small style={{ color: 'var(--color-text-muted)' }}>Your response:</small>
                                <p style={{ margin: 0 }}>{transcript}</p>
                            </div>
                        )}

                        {/* Controls */}
                        <div className="flex gap-md items-center">
                            <button
                                onClick={isListening ? stopListening : startListening}
                                className={`btn ${isListening ? 'btn-error' : 'btn-primary'}`}
                                style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    fontSize: '1.5rem',
                                }}
                                disabled={isSpeaking || submitting}
                            >
                                {isListening ? '⏹️' : '🎤'}
                            </button>

                            <input
                                type="text"
                                className="form-input"
                                placeholder={isListening ? "Listening..." : "Or type your response..."}
                                value={transcript}
                                onChange={(e) => setTranscript(e.target.value)}
                                style={{ flex: 1 }}
                                disabled={isListening || submitting}
                            />

                            <button
                                onClick={submitResponse}
                                className="btn btn-primary"
                                disabled={!transcript.trim() || submitting}
                            >
                                {submitting ? '...' : 'Send'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
      `}</style>
        </div>
    );
}

export default InterviewRoom;
