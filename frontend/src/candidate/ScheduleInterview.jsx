/**
 * Schedule Interview / My Interviews Page (Candidate)
 * 
 * Schedule interviews for applications or view scheduled interviews.
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled': return 'badge-primary';
            case 'in_progress': return 'badge-warning';
            case 'completed': return 'badge-success';
            case 'cancelled': return 'badge-error';
            default: return 'badge-primary';
        }
    };

    if (loading) {
        return (
            <div className="page">
                <div className="container flex justify-center">
                    <div className="loading-spinner"></div>
                </div>
            </div>
        );
    }

    // Interviews List View
    if (showList) {
        return (
            <div className="page animate-fade-in">
                <div className="container">
                    <div className="page-header">
                        <h1 className="page-title">My Interviews</h1>
                        <p className="page-subtitle">View and manage your scheduled interviews</p>
                    </div>

                    {interviews.length === 0 ? (
                        <div className="card text-center" style={{ padding: 'var(--spacing-2xl)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>📅</div>
                            <h3>No Interviews Scheduled</h3>
                            <p style={{ margin: 'var(--spacing-md) 0' }}>
                                Your scheduled interviews will appear here.
                            </p>
                            <Link to="/applications" className="btn btn-primary">
                                View Applications
                            </Link>
                        </div>
                    ) : (
                        <div className="dashboard-grid">
                            {interviews.map(interview => (
                                <div key={interview.id} className="card">
                                    <div className="flex justify-between items-start mb-md">
                                        <div>
                                            <h3 className="card-title">{interview.job_title}</h3>
                                            <p style={{ color: 'var(--color-primary-light)', fontSize: '0.875rem', margin: 0 }}>
                                                {interview.company_name}
                                            </p>
                                        </div>
                                        <span className={`badge ${getStatusColor(interview.status)}`}>
                                            {interview.status.replace('_', ' ')}
                                        </span>
                                    </div>

                                    <div style={{
                                        padding: 'var(--spacing-md)',
                                        background: 'var(--color-bg-tertiary)',
                                        borderRadius: 'var(--radius-md)',
                                        marginTop: 'var(--spacing-md)'
                                    }}>
                                        <div className="flex gap-md">
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>DATE</div>
                                                <div style={{ fontWeight: 500 }}>
                                                    {new Date(interview.scheduled_time).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>TIME</div>
                                                <div style={{ fontWeight: 500 }}>
                                                    {new Date(interview.scheduled_time).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>DURATION</div>
                                                <div style={{ fontWeight: 500 }}>{interview.duration_minutes} min</div>
                                            </div>
                                        </div>
                                    </div>

                                    {interview.status === 'scheduled' && (
                                        <div className="mt-md" style={{
                                            padding: 'var(--spacing-sm)',
                                            background: 'rgba(99, 102, 241, 0.1)',
                                            borderRadius: 'var(--radius-sm)',
                                            fontSize: '0.875rem',
                                            color: 'var(--color-primary-light)'
                                        }}>
                                            ℹ️ Phase 2: AI interviews will be conducted here
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.total_pages > 1 && (
                        <div className="flex justify-center gap-sm mt-lg">
                            <button
                                className="btn btn-secondary btn-sm"
                                disabled={!pagination.has_prev}
                                onClick={() => loadInterviews(pagination.page - 1)}
                            >
                                Previous
                            </button>
                            <span style={{
                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                color: 'var(--color-text-secondary)'
                            }}>
                                Page {pagination.page} of {pagination.total_pages}
                            </span>
                            <button
                                className="btn btn-secondary btn-sm"
                                disabled={!pagination.has_next}
                                onClick={() => loadInterviews(pagination.page + 1)}
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
        <div className="page animate-fade-in">
            <div className="container" style={{ maxWidth: '600px' }}>
                <Link to="/applications" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                    marginBottom: 'var(--spacing-md)',
                    color: 'var(--color-text-secondary)'
                }}>
                    ← Back to Applications
                </Link>

                <div className="page-header text-center">
                    <h1 className="page-title">Schedule Interview</h1>
                    <p className="page-subtitle">
                        {application?.job_title} at {application?.company_name}
                    </p>
                </div>

                <div className="card">
                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div className="form-error mb-md" style={{
                                padding: 'var(--spacing-sm)',
                                background: 'rgba(239, 68, 68, 0.1)',
                                borderRadius: 'var(--radius-md)'
                            }}>
                                {error}
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Preferred Date & Time *</label>
                            <input
                                type="datetime-local"
                                className="form-input"
                                value={formData.scheduled_time}
                                onChange={e => setFormData({ ...formData, scheduled_time: e.target.value })}
                                min={new Date().toISOString().slice(0, 16)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Interview Duration</label>
                            <select
                                className="form-select"
                                value={formData.duration_minutes}
                                onChange={e => setFormData({ ...formData, duration_minutes: e.target.value })}
                            >
                                <option value="30">30 minutes</option>
                                <option value="45">45 minutes</option>
                                <option value="60">60 minutes</option>
                                <option value="90">90 minutes</option>
                            </select>
                        </div>

                        <div className="flex gap-md mt-lg">
                            <Link to="/applications" className="btn btn-secondary">
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                className="btn btn-primary btn-lg"
                                style={{ flex: 1 }}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <span className="loading-spinner"></span>
                                ) : (
                                    'Schedule Interview'
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Phase 2 Note */}
                <div className="card mt-lg" style={{
                    background: 'rgba(6, 182, 212, 0.1)',
                    borderColor: 'var(--color-accent)'
                }}>
                    <h4 style={{ marginBottom: 'var(--spacing-sm)', color: 'var(--color-accent)' }}>
                        🤖 Coming in Phase 2
                    </h4>
                    <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                        AI-powered interviews will be conducted at your scheduled time.
                        The interview will include technical questions, problem-solving challenges,
                        and immediate feedback powered by LangGraph and advanced LLMs.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default ScheduleInterview;
