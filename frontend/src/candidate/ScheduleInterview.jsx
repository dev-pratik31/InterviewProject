/**
 * My Interviews Page (Candidate) - Premium Edition
 * 
 * Professional interface for viewing and managing scheduled interviews
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { candidateAPI } from '../api/apiClient';

function ScheduleInterview({ showList = false }) {
    const { applicationId } = useParams();
    const navigate = useNavigate();

    const [interviews, setInterviews] = useState([]);
    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [pagination, setPagination] = useState({});

    const [formData, setFormData] = useState({
        scheduled_time: '',
        duration_minutes: 60,
    });

    useEffect(() => {
        if (showList) {
            loadInterviews();
        } else if (applicationId) {
            loadApplication();
        }
    }, [showList, applicationId]);

    const loadInterviews = async (page = 1) => {
        try {
            const res = await candidateAPI.getMyInterviews({ page, page_size: 10 });
            setInterviews(res.data.data || []);
            setPagination(res.data.pagination || {});
        } catch (err) {
            console.error('Failed to load interviews:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadApplication = async () => {
        try {
            const res = await candidateAPI.getApplication(applicationId);
            setApplication(res.data);
        } catch (err) {
            console.error('Failed to load application:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            await candidateAPI.scheduleInterview({
                application_id: applicationId,
                scheduled_time: formData.scheduled_time,
                duration_minutes: parseInt(formData.duration_minutes),
            });

            navigate('/interviews', {
                state: { message: 'Interview scheduled successfully!' }
            });
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to schedule interview');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusStyle = (status) => {
        const styles = {
            scheduled: { background: '#3b82f620', color: '#3b82f6', border: '1px solid #3b82f640' },
            in_progress: { background: '#f59e0b20', color: '#f59e0b', border: '1px solid #f59e0b40' },
            completed: { background: '#10b98120', color: '#10b981', border: '1px solid #10b98140' },
            cancelled: { background: '#ef444420', color: '#ef4444', border: '1px solid #ef444440' }
        };
        return styles[status] || styles.scheduled;
    };

    if (loading) {
        return (
            <div className="page" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60vh'
            }}>
                <div className="loading-spinner"></div>
            </div>
        );
    }

    // Interviews List View
    if (showList) {
        return (
            <div className="page animate-fade-in" style={{ background: 'var(--color-bg-primary)' }}>
                <div className="container" style={{ maxWidth: '1400px' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        marginBottom: 'var(--spacing-2xl)',
                        flexWrap: 'wrap',
                        gap: 'var(--spacing-lg)'
                    }}>
                        <div>
                            <h1 style={{
                                fontSize: '2.5rem',
                                fontWeight: 700,
                                marginBottom: 'var(--spacing-xs)',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>
                                My Interviews
                            </h1>
                            <p style={{
                                color: 'var(--color-text-secondary)',
                                fontSize: '1rem'
                            }}>
                                View and manage your scheduled interviews
                            </p>
                        </div>
                        <Link
                            to="/applications"
                            className="btn"
                            style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                border: 'none',
                                padding: 'var(--spacing-sm) var(--spacing-lg)',
                                fontSize: '1rem',
                                fontWeight: 600
                            }}
                        >
                            View Applications
                        </Link>
                    </div>

                    {interviews.length === 0 ? (
                        <div className="card" style={{
                            padding: 'var(--spacing-2xl)',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                width: '120px',
                                height: '120px',
                                margin: '0 auto var(--spacing-lg)',
                                background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2" opacity="0.6">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                            </div>
                            <h3 style={{
                                fontSize: '1.5rem',
                                marginBottom: 'var(--spacing-sm)'
                            }}>
                                No Interviews Scheduled
                            </h3>
                            <p style={{
                                color: 'var(--color-text-secondary)',
                                marginBottom: 'var(--spacing-lg)',
                                maxWidth: '400px',
                                margin: '0 auto var(--spacing-lg)'
                            }}>
                                Your scheduled interviews will appear here once you apply to jobs
                            </p>
                            <Link
                                to="/applications"
                                className="btn"
                                style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white',
                                    border: 'none',
                                    padding: 'var(--spacing-sm) var(--spacing-xl)',
                                    fontSize: '1rem',
                                    fontWeight: 600
                                }}
                            >
                                View Applications
                            </Link>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
                            gap: 'var(--spacing-lg)'
                        }}>
                            {interviews.map(interview => (
                                <InterviewCard key={interview.id} interview={interview} getStatusStyle={getStatusStyle} />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.total_pages > 1 && (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: 'var(--spacing-md)',
                            marginTop: 'var(--spacing-2xl)'
                        }}>
                            <button
                                className="btn btn-secondary"
                                disabled={!pagination.has_prev}
                                onClick={() => loadInterviews(pagination.page - 1)}
                                style={{
                                    padding: 'var(--spacing-sm) var(--spacing-lg)',
                                    fontSize: '0.875rem',
                                    fontWeight: 600
                                }}
                            >
                                Previous
                            </button>
                            <span style={{
                                fontSize: '0.875rem',
                                color: 'var(--color-text-secondary)',
                                fontWeight: 600
                            }}>
                                Page {pagination.page} of {pagination.total_pages}
                            </span>
                            <button
                                className="btn btn-secondary"
                                disabled={!pagination.has_next}
                                onClick={() => loadInterviews(pagination.page + 1)}
                                style={{
                                    padding: 'var(--spacing-sm) var(--spacing-lg)',
                                    fontSize: '0.875rem',
                                    fontWeight: 600
                                }}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Schedule Form View
    return (
        <div className="page animate-fade-in" style={{ background: 'var(--color-bg-primary)' }}>
            <div className="container" style={{ maxWidth: '700px' }}>
                <Link
                    to="/applications"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-xs)',
                        marginBottom: 'var(--spacing-lg)',
                        color: 'var(--color-text-secondary)',
                        textDecoration: 'none',
                        fontSize: '0.9375rem',
                        fontWeight: 500
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                    Back to Applications
                </Link>

                <div style={{
                    textAlign: 'center',
                    marginBottom: 'var(--spacing-2xl)'
                }}>
                    <h1 style={{
                        fontSize: '2.5rem',
                        fontWeight: 700,
                        marginBottom: 'var(--spacing-xs)'
                    }}>
                        Schedule Interview
                    </h1>
                    <p style={{
                        color: 'var(--color-text-secondary)',
                        fontSize: '1.125rem'
                    }}>
                        {application?.job_title} at {application?.company_name}
                    </p>
                </div>

                <div className="card" style={{ padding: 'var(--spacing-xl)' }}>
                    <form onSubmit={handleSubmit}>
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

                        {/* Date & Time Input */}
                        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                marginBottom: 'var(--spacing-sm)',
                                color: 'var(--color-text-primary)'
                            }}>
                                Preferred Date & Time
                            </label>
                            <input
                                type="datetime-local"
                                value={formData.scheduled_time}
                                onChange={e => setFormData({ ...formData, scheduled_time: e.target.value })}
                                min={new Date().toISOString().slice(0, 16)}
                                required
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

                        {/* Duration Select */}
                        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                marginBottom: 'var(--spacing-sm)',
                                color: 'var(--color-text-primary)'
                            }}>
                                Interview Duration
                            </label>
                            <select
                                value={formData.duration_minutes}
                                onChange={e => setFormData({ ...formData, duration_minutes: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                    background: 'var(--color-bg-secondary)',
                                    border: '2px solid var(--color-border)',
                                    borderRadius: '10px',
                                    fontSize: '1rem',
                                    color: 'var(--color-text-primary)',
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="30">30 minutes</option>
                                <option value="45">45 minutes</option>
                                <option value="60">60 minutes</option>
                                <option value="90">90 minutes</option>
                            </select>
                        </div>

                        {/* Action Buttons */}
                        <div style={{
                            display: 'flex',
                            gap: 'var(--spacing-md)'
                        }}>
                            <Link
                                to="/applications"
                                className="btn btn-secondary"
                                style={{
                                    flex: '0 0 auto',
                                    padding: 'var(--spacing-md) var(--spacing-xl)',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    textDecoration: 'none'
                                }}
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={submitting}
                                style={{
                                    flex: 1,
                                    padding: 'var(--spacing-md)',
                                    background: submitting
                                        ? 'var(--color-bg-tertiary)'
                                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    cursor: submitting ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {submitting ? 'Scheduling...' : 'Schedule Interview'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Phase 2 Note */}
                <div className="card" style={{
                    marginTop: 'var(--spacing-lg)',
                    padding: 'var(--spacing-lg)',
                    background: 'linear-gradient(135deg, #06b6d415 0%, #06b6d410 100%)',
                    border: '1px solid #06b6d430'
                }}>
                    <div style={{
                        display: 'flex',
                        gap: 'var(--spacing-md)',
                        alignItems: 'flex-start'
                    }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: '#06b6d420',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                            </svg>
                        </div>
                        <div>
                            <h4 style={{
                                marginBottom: 'var(--spacing-xs)',
                                color: '#06b6d4',
                                fontSize: '1.125rem',
                                fontWeight: 700
                            }}>
                                Coming in Phase 2
                            </h4>
                            <p style={{
                                margin: 0,
                                color: 'var(--color-text-secondary)',
                                lineHeight: 1.6
                            }}>
                                AI-powered interviews will be conducted at your scheduled time. The interview will include technical questions, problem-solving challenges, and immediate feedback powered by LangGraph and advanced LLMs.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Interview Card Component
const InterviewCard = ({ interview, getStatusStyle }) => (
    <div className="card" style={{
        padding: 'var(--spacing-lg)',
        transition: 'all 0.3s',
        position: 'relative',
        overflow: 'hidden'
    }}
        onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#667eea40';
            e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.transform = 'translateY(0)';
        }}
    >
        {/* Top Accent */}
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
        }}></div>

        {/* Header */}
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 'var(--spacing-md)',
            paddingTop: 'var(--spacing-xs)'
        }}>
            <div style={{ flex: 1 }}>
                <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    marginBottom: 'var(--spacing-xs)'
                }}>
                    {interview.job_title}
                </h3>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                    color: 'var(--color-text-secondary)',
                    fontSize: '0.875rem'
                }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    </svg>
                    {interview.company_name}
                </div>
            </div>
            <span style={{
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'capitalize',
                whiteSpace: 'nowrap',
                ...getStatusStyle(interview.status)
            }}>
                {interview.status.replace('_', ' ')}
            </span>
        </div>

        {/* Interview Details */}
        <div style={{
            padding: 'var(--spacing-md)',
            background: 'var(--color-bg-secondary)',
            borderRadius: '12px',
            marginBottom: 'var(--spacing-md)'
        }}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 'var(--spacing-md)'
            }}>
                <div>
                    <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '4px',
                        fontWeight: 600
                    }}>
                        Date
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                        {new Date(interview.scheduled_time).toLocaleDateString('en', {
                            month: 'short',
                            day: 'numeric'
                        })}
                    </div>
                </div>
                <div>
                    <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '4px',
                        fontWeight: 600
                    }}>
                        Time
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                        {new Date(interview.scheduled_time).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </div>
                </div>
                <div>
                    <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '4px',
                        fontWeight: 600
                    }}>
                        Duration
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                        {interview.duration_minutes} min
                    </div>
                </div>
            </div>
        </div>

        {/* Phase 2 Note */}
        <div style={{
            padding: 'var(--spacing-sm)',
            background: '#f59e0b10',
            border: '1px solid #f59e0b30',
            borderRadius: '8px',
            fontSize: '0.75rem',
            color: 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-xs)'
        }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            AI interviews will be available in Phase 2
        </div>
    </div>
);

export default ScheduleInterview;