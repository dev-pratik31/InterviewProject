/**
 * Schedule Interview Modal
 * 
 * Popup for candidates to schedule their AI interview.
 * Options: Start Now or Schedule for Later
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidateAPI } from '../api/apiClient';

function ScheduleInterviewModal({ isOpen, onClose, job, onScheduled }) {
    const navigate = useNavigate();
    const [mode, setMode] = useState('choose'); // choose, schedule
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleStartNow = async () => {
        setLoading(true);
        setError('');

        try {
            // Apply with interview type 'now'
            await candidateAPI.applyToJob(job.id, {
                cover_letter: '',
                interview_type: 'now',
            });

            // Navigate to interview room
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

    // Get minimum date (today)
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="modal-overlay" style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
        }}>
            <div className="card animate-fade-in" style={{
                maxWidth: '500px',
                width: '90%',
                maxHeight: '90vh',
                overflow: 'auto',
            }}>
                {/* Header */}
                <div className="flex justify-between items-center mb-lg">
                    <h2 style={{ margin: 0 }}>🎤 Schedule AI Interview</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            color: 'var(--color-text-muted)',
                        }}
                    >×</button>
                </div>

                {/* Job Info */}
                <div style={{
                    padding: 'var(--spacing-md)',
                    background: 'var(--color-bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--spacing-lg)',
                }}>
                    <h4 style={{ margin: 0, marginBottom: 'var(--spacing-xs)' }}>{job.title}</h4>
                    <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                        {job.company_name}
                    </p>
                </div>

                {error && (
                    <div style={{
                        padding: 'var(--spacing-sm)',
                        background: 'rgba(239, 68, 68, 0.1)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-error)',
                        marginBottom: 'var(--spacing-md)',
                    }}>{error}</div>
                )}

                {mode === 'choose' && (
                    <>
                        <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-text-secondary)' }}>
                            Your application includes an AI-powered interview. When would you like to start?
                        </p>

                        {/* Start Now Option */}
                        <button
                            onClick={handleStartNow}
                            disabled={loading}
                            className="btn btn-primary"
                            style={{
                                width: '100%',
                                padding: 'var(--spacing-lg)',
                                marginBottom: 'var(--spacing-md)',
                                fontSize: '1.1rem',
                            }}
                        >
                            {loading ? 'Starting...' : '🚀 Start Interview Now'}
                        </button>

                        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', margin: 'var(--spacing-md) 0' }}>
                            — or —
                        </p>

                        {/* Schedule Later */}
                        <button
                            onClick={() => setMode('schedule')}
                            className="btn btn-secondary"
                            style={{
                                width: '100%',
                                padding: 'var(--spacing-lg)',
                            }}
                        >
                            📅 Schedule for Later
                        </button>
                    </>
                )}

                {mode === 'schedule' && (
                    <>
                        <button
                            onClick={() => setMode('choose')}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-text-muted)',
                                cursor: 'pointer',
                                marginBottom: 'var(--spacing-md)',
                            }}
                        >← Back</button>

                        <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-text-secondary)' }}>
                            Select your preferred interview date and time:
                        </p>

                        <div className="form-group">
                            <label className="form-label">Date</label>
                            <input
                                type="date"
                                className="form-input"
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                                min={today}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Time</label>
                            <input
                                type="time"
                                className="form-input"
                                value={scheduleTime}
                                onChange={(e) => setScheduleTime(e.target.value)}
                            />
                        </div>

                        <button
                            onClick={handleScheduleLater}
                            disabled={loading || !scheduleDate || !scheduleTime}
                            className="btn btn-primary"
                            style={{
                                width: '100%',
                                padding: 'var(--spacing-lg)',
                                marginTop: 'var(--spacing-md)',
                            }}
                        >
                            {loading ? 'Scheduling...' : '✅ Confirm Schedule'}
                        </button>
                    </>
                )}

                {/* Info Note */}
                <div style={{
                    marginTop: 'var(--spacing-lg)',
                    padding: 'var(--spacing-md)',
                    background: 'rgba(99, 102, 241, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem',
                    color: 'var(--color-text-secondary)',
                }}>
                    💡 The AI interview takes about 15-20 minutes. You'll be asked questions about your experience and skills.
                </div>
            </div>
        </div>
    );
}

export default ScheduleInterviewModal;
