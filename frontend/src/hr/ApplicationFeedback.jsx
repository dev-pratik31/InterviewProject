/**
 * Application Feedback View (HR)
 * 
 * Displays AI interview feedback for a candidate.
 * HR can accept or reject based on AI recommendation and scores.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { hrAPI } from '../api/apiClient';

function ApplicationFeedback() {
    const { applicationId } = useParams();
    const navigate = useNavigate();
    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        loadApplication();
    }, [applicationId]);

    const loadApplication = async () => {
        try {
            const res = await hrAPI.getApplication(applicationId);
            setApplication(res.data);
        } catch (err) {
            console.error('Failed to load application:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDecision = async (status) => {
        setUpdating(true);
        try {
            await hrAPI.updateApplicationStatus(applicationId, { status });
            setApplication({ ...application, status });
        } catch (err) {
            console.error('Failed to update:', err);
        } finally {
            setUpdating(false);
        }
    };

    const getRecommendationStyle = (rec) => {
        const styles = {
            strong_hire: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', label: '🌟 Strong Hire' },
            hire: { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', label: '✅ Hire' },
            maybe: { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', label: '🤔 Maybe' },
            no_hire: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', label: '❌ No Hire' },
        };
        return styles[rec] || styles.maybe;
    };

    const renderScoreBar = (score, label) => (
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <div className="flex justify-between mb-xs">
                <span style={{ fontSize: '0.875rem' }}>{label}</span>
                <span style={{ fontWeight: 600 }}>{Math.round(score * 100)}%</span>
            </div>
            <div style={{
                height: '8px',
                background: 'var(--color-bg-tertiary)',
                borderRadius: '4px',
                overflow: 'hidden',
            }}>
                <div style={{
                    height: '100%',
                    width: `${score * 100}%`,
                    background: score >= 0.7 ? 'var(--color-success)' : score >= 0.5 ? 'var(--color-warning)' : 'var(--color-error)',
                    borderRadius: '4px',
                    transition: 'width 0.5s ease',
                }} />
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="page">
                <div className="container flex justify-center">
                    <div className="loading-spinner"></div>
                </div>
            </div>
        );
    }

    if (!application) {
        return (
            <div className="page">
                <div className="container">
                    <div className="card text-center">
                        <h2>Application Not Found</h2>
                        <Link to="/hr/applications" className="btn btn-primary mt-md">
                            Back to Applications
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const recStyle = getRecommendationStyle(application.ai_recommendation);
    const scores = application.interview_scores || {};
    const feedback = application.interview_feedback || {};

    return (
        <div className="page animate-fade-in">
            <div className="container" style={{ maxWidth: '900px' }}>
                {/* Header */}
                <div className="mb-lg">
                    <Link to="/hr/applications" style={{ color: 'var(--color-text-muted)' }}>
                        ← Back to Applications
                    </Link>
                </div>

                <div className="card mb-lg" style={{
                    background: 'var(--gradient-primary)',
                    border: 'none',
                    color: 'white',
                }}>
                    <h1 style={{ color: 'white', margin: 0, marginBottom: 'var(--spacing-sm)' }}>
                        AI Interview Feedback
                    </h1>
                    <p style={{ margin: 0, opacity: 0.9 }}>
                        Candidate: {application.candidate_name || 'Unknown'} • {application.job_title || 'Position'}
                    </p>
                </div>

                <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-lg)' }}>
                    {/* Main Content */}
                    <div>
                        {/* AI Recommendation Badge */}
                        <div className="card mb-lg text-center" style={{
                            background: recStyle.bg,
                            borderColor: recStyle.color,
                        }}>
                            <div style={{
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: recStyle.color,
                            }}>
                                {recStyle.label}
                            </div>
                            <p style={{ margin: 'var(--spacing-sm) 0 0', color: 'var(--color-text-secondary)' }}>
                                AI Recommendation
                            </p>
                        </div>

                        {/* Scores */}
                        <div className="card mb-lg">
                            <h3>Performance Scores</h3>
                            {renderScoreBar(scores.confidence || 0.5, '🎯 Confidence')}
                            {renderScoreBar(scores.technical || 0.5, '💻 Technical')}
                            {renderScoreBar(scores.clarity || 0.5, '📝 Clarity')}
                            {renderScoreBar(scores.depth || 0.5, '🔍 Depth')}
                        </div>

                        {/* Detailed Feedback */}
                        <div className="card mb-lg">
                            <h3>Detailed Feedback</h3>

                            {feedback.strengths && (
                                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                    <h4 style={{ color: 'var(--color-success)' }}>✅ Strengths</h4>
                                    <ul style={{ paddingLeft: 'var(--spacing-lg)' }}>
                                        {feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                </div>
                            )}

                            {feedback.areas_for_improvement && (
                                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                    <h4 style={{ color: 'var(--color-warning)' }}>📈 Areas for Improvement</h4>
                                    <ul style={{ paddingLeft: 'var(--spacing-lg)' }}>
                                        {feedback.areas_for_improvement.map((a, i) => <li key={i}>{a}</li>)}
                                    </ul>
                                </div>
                            )}

                            {feedback.summary && (
                                <div style={{
                                    padding: 'var(--spacing-md)',
                                    background: 'var(--color-bg-tertiary)',
                                    borderRadius: 'var(--radius-md)',
                                }}>
                                    <strong>Summary:</strong> {feedback.summary}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div>
                        {/* Decision Card */}
                        <div className="card mb-lg">
                            <h3>Your Decision</h3>

                            {application.status === 'pending' || application.status === 'reviewing' ? (
                                <div className="flex flex-col gap-sm">
                                    <button
                                        onClick={() => handleDecision('accepted')}
                                        disabled={updating}
                                        className="btn btn-success"
                                        style={{ width: '100%' }}
                                    >
                                        ✅ Accept Candidate
                                    </button>
                                    <button
                                        onClick={() => handleDecision('rejected')}
                                        disabled={updating}
                                        className="btn btn-error"
                                        style={{ width: '100%' }}
                                    >
                                        ❌ Reject Candidate
                                    </button>
                                </div>
                            ) : (
                                <div style={{
                                    padding: 'var(--spacing-md)',
                                    background: application.status === 'accepted'
                                        ? 'rgba(16, 185, 129, 0.1)'
                                        : 'rgba(239, 68, 68, 0.1)',
                                    borderRadius: 'var(--radius-md)',
                                    textAlign: 'center',
                                    fontWeight: 600,
                                    color: application.status === 'accepted'
                                        ? 'var(--color-success)'
                                        : 'var(--color-error)',
                                }}>
                                    {application.status === 'accepted' ? '✅ Accepted' : '❌ Rejected'}
                                </div>
                            )}
                        </div>

                        {/* Interview Details */}
                        <div className="card">
                            <h4>Interview Details</h4>
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                <p><strong>Questions Asked:</strong> {scores.questions_answered || 0}</p>
                                <p><strong>Duration:</strong> ~{Math.round((scores.questions_answered || 5) * 2)} mins</p>
                                <p><strong>Completed:</strong> {application.interview_completed_at
                                    ? new Date(application.interview_completed_at).toLocaleDateString()
                                    : 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ApplicationFeedback;
