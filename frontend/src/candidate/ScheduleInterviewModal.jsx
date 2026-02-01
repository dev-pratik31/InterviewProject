/**
 * Schedule Interview Modal - Premium Edition
 * 
 * Beautiful popup for candidates to schedule their AI interview
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidateAPI } from '../api/apiClient';
import ResumeUpload from './ResumeUpload';

function ScheduleInterviewModal({ isOpen, onClose, job, onScheduled }) {
    const navigate = useNavigate();
    const [mode, setMode] = useState('upload'); // Start with upload
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resumeUrl, setResumeUrl] = useState('');

    if (!isOpen) return null;

    const handleStartNow = async () => {
        setLoading(true);
        setError('');

        try {
            await candidateAPI.applyToJob(job.id, {
                cover_letter: '',
                resume_url: resumeUrl,
                interview_type: 'now',
            });

            navigate(`/interview/start/${job.id}`, {
                state: { jobId: job.id, jobTitle: job.title }
            });
            onClose();
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to start interview');
            setLoading(false);
        }
    };

    const handleScheduleLater = async () => {
        if (!scheduleDate || !scheduleTime) {
            setError('Please select date and time');
            return;
        }

        setLoading(true);
        setError('');

        const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`);

        try {
            await candidateAPI.applyToJob(job.id, {
                cover_letter: '',
                resume_url: resumeUrl,
                interview_type: 'scheduled',
                interview_scheduled_at: scheduledAt.toISOString(),
            });

            onScheduled && onScheduled(scheduledAt);
            onClose();
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to schedule interview');
            setLoading(false);
        }
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 'var(--spacing-lg)'
        }}
            onClick={onClose}
        >
            <div
                className="card animate-fade-in"
                onClick={(e) => e.stopPropagation()}
                style={{
                    maxWidth: '550px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    padding: 'var(--spacing-xl)',
                    position: 'relative'
                }}
            >
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 'var(--spacing-lg)'
                }}>
                    <div>
                        <h2 style={{
                            fontSize: '1.75rem',
                            fontWeight: 700,
                            margin: 0,
                            marginBottom: 'var(--spacing-xs)'
                        }}>
                            Schedule AI Interview
                        </h2>
                        <p style={{
                            color: 'var(--color-text-secondary)',
                            fontSize: '0.9375rem',
                            margin: 0
                        }}>
                            Choose when to complete your interview
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'var(--color-bg-tertiary)',
                            border: 'none',
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'var(--color-text-muted)',
                            fontSize: '1.5rem',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--color-bg-secondary)';
                            e.currentTarget.style.color = 'var(--color-text-primary)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--color-bg-tertiary)';
                            e.currentTarget.style.color = 'var(--color-text-muted)';
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Job Info Card */}
                <div style={{
                    padding: 'var(--spacing-lg)',
                    background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                    borderRadius: '12px',
                    marginBottom: 'var(--spacing-lg)',
                    border: '1px solid #667eea20'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)',
                        marginBottom: 'var(--spacing-xs)'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '1.125rem'
                        }}>
                            {job.title[0]}
                        </div>
                        <div style={{ flex: 1 }}>
                            <h4 style={{
                                margin: 0,
                                marginBottom: '2px',
                                fontSize: '1.125rem',
                                fontWeight: 700
                            }}>
                                {job.title}
                            </h4>
                            <p style={{
                                margin: 0,
                                color: 'var(--color-text-muted)',
                                fontSize: '0.875rem'
                            }}>
                                {job.company_name}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div style={{
                        padding: 'var(--spacing-md)',
                        background: '#ef444410',
                        border: '1px solid #ef444440',
                        borderRadius: '12px',
                        marginBottom: 'var(--spacing-lg)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)',
                        color: '#ef4444'
                    }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        {error}
                    </div>
                )}

                {/* Resume Upload Mode */}
                {mode === 'upload' && (
                    <div className="animate-fade-in">
                        <h3 style={{ marginTop: 0, marginBottom: 'var(--spacing-md)' }}>
                            Step 1: Upload Resume
                        </h3>
                        <ResumeUpload onUploadComplete={(url) => {
                            setResumeUrl(url);
                            setMode('choose');
                        }} />
                    </div>
                )}


                {/* Choose Mode */}
                {mode === 'choose' && (
                    <>
                        <p style={{
                            marginBottom: 'var(--spacing-xl)',
                            color: 'var(--color-text-secondary)',
                            fontSize: '1rem',
                            lineHeight: 1.6
                        }}>
                            Your application includes an AI-powered interview. Choose your preferred option below.
                        </p>

                        {/* Start Now Button */}
                        <button
                            onClick={handleStartNow}
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: 'var(--spacing-lg)',
                                background: loading ? 'var(--color-bg-tertiary)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '1.125rem',
                                fontWeight: 700,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                marginBottom: 'var(--spacing-md)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 'var(--spacing-sm)',
                                transition: 'all 0.3s'
                            }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polygon points="10 8 16 12 10 16 10 8"></polygon>
                            </svg>
                            {loading ? 'Starting Interview...' : 'Start Interview Now'}
                        </button>

                        {/* Divider */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-md)',
                            margin: 'var(--spacing-lg) 0'
                        }}>
                            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }}></div>
                            <span style={{
                                color: 'var(--color-text-muted)',
                                fontSize: '0.875rem',
                                fontWeight: 500
                            }}>
                                or
                            </span>
                            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }}></div>
                        </div>

                        {/* Schedule Later Button */}
                        <button
                            onClick={() => setMode('schedule')}
                            style={{
                                width: '100%',
                                padding: 'var(--spacing-lg)',
                                background: 'var(--color-bg-secondary)',
                                color: 'var(--color-text-primary)',
                                border: '2px solid var(--color-border)',
                                borderRadius: '12px',
                                fontSize: '1.125rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 'var(--spacing-sm)',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#667eea';
                                e.currentTarget.style.background = '#667eea10';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--color-border)';
                                e.currentTarget.style.background = 'var(--color-bg-secondary)';
                            }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            Schedule for Later
                        </button>
                    </>
                )}

                {/* Schedule Mode */}
                {mode === 'schedule' && (
                    <>
                        <button
                            onClick={() => setMode('choose')}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-text-secondary)',
                                cursor: 'pointer',
                                marginBottom: 'var(--spacing-lg)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-xs)',
                                fontSize: '0.9375rem',
                                fontWeight: 500,
                                padding: 'var(--spacing-xs) 0'
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                            Back to options
                        </button>

                        <p style={{
                            marginBottom: 'var(--spacing-lg)',
                            color: 'var(--color-text-secondary)',
                            fontSize: '1rem'
                        }}>
                            Select your preferred interview date and time
                        </p>

                        {/* Date Input */}
                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                marginBottom: 'var(--spacing-sm)',
                                color: 'var(--color-text-primary)'
                            }}>
                                Date
                            </label>
                            <input
                                type="date"
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                                min={today}
                                style={{
                                    width: '100%',
                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                    background: 'var(--color-bg-secondary)',
                                    border: '2px solid var(--color-border)',
                                    borderRadius: '10px',
                                    fontSize: '1rem',
                                    color: 'var(--color-text-primary)',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        {/* Time Input */}
                        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                marginBottom: 'var(--spacing-sm)',
                                color: 'var(--color-text-primary)'
                            }}>
                                Time
                            </label>
                            <input
                                type="time"
                                value={scheduleTime}
                                onChange={(e) => setScheduleTime(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                    background: 'var(--color-bg-secondary)',
                                    border: '2px solid var(--color-border)',
                                    borderRadius: '10px',
                                    fontSize: '1rem',
                                    color: 'var(--color-text-primary)',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        {/* Confirm Button */}
                        <button
                            onClick={handleScheduleLater}
                            disabled={loading || !scheduleDate || !scheduleTime}
                            style={{
                                width: '100%',
                                padding: 'var(--spacing-lg)',
                                background: (loading || !scheduleDate || !scheduleTime)
                                    ? 'var(--color-bg-tertiary)'
                                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '1.125rem',
                                fontWeight: 700,
                                cursor: (loading || !scheduleDate || !scheduleTime) ? 'not-allowed' : 'pointer',
                                opacity: (loading || !scheduleDate || !scheduleTime) ? 0.6 : 1
                            }}
                        >
                            {loading ? 'Scheduling...' : 'Confirm Schedule'}
                        </button>
                    </>
                )}

                {/* Info Note */}
                <div style={{
                    marginTop: 'var(--spacing-xl)',
                    padding: 'var(--spacing-md)',
                    background: '#f59e0b10',
                    border: '1px solid #f59e0b30',
                    borderRadius: '12px',
                    display: 'flex',
                    gap: 'var(--spacing-sm)'
                }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <div>
                        <div style={{
                            fontSize: '0.875rem',
                            color: '#f59e0b',
                            fontWeight: 600,
                            marginBottom: '4px'
                        }}>
                            Interview Duration
                        </div>
                        <div style={{
                            fontSize: '0.875rem',
                            color: 'var(--color-text-secondary)',
                            lineHeight: 1.5
                        }}>
                            The AI interview takes approximately 15-20 minutes and includes questions about your experience and skills.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ScheduleInterviewModal;