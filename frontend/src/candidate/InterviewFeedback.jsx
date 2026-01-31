/**
 * Interview Feedback Page (Candidate)
 * 
 * Display AI-generated interview feedback and scores.
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { aiAPI } from '../api/apiClient';

function InterviewFeedback() {
    const { interviewId } = useParams();
    const navigate = useNavigate();

    const [feedback, setFeedback] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadFeedback();
    }, [interviewId]);

    const loadFeedback = async () => {
        try {
            const res = await aiAPI.completeInterview(interviewId);
            setFeedback(res.data);
        } catch (err) {
            setError('Failed to load feedback');
        } finally {
            setLoading(false);
        }
    };

    const getRecommendationColor = (rec) => {
        switch (rec) {
            case 'strong_hire': return 'var(--color-success)';
            case 'hire': return 'var(--color-success)';
            case 'maybe': return 'var(--color-warning)';
            case 'no_hire': return 'var(--color-error)';
            default: return 'var(--color-text-secondary)';
        }
    };

    const getRecommendationLabel = (rec) => {
        switch (rec) {
            case 'strong_hire': return '🌟 Strong Hire';
            case 'hire': return '✅ Hire';
            case 'maybe': return '🤔 Maybe';
            case 'no_hire': return '❌ No Hire';
            default: return rec;
        }
    };

    if (loading) {
        return (
            <div className="page">
                <div className="container flex justify-center items-center" style={{ minHeight: '60vh' }}>
                    <div className="text-center">
                        <div className="loading-spinner mb-md"></div>
                        <p>Generating your feedback...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !feedback) {
        return (
            <div className="page">
                <div className="container">
                    <div className="card text-center" style={{ padding: 'var(--spacing-2xl)' }}>
                        <h2>Feedback Unavailable</h2>
                        <p>{error || 'Could not load interview feedback'}</p>
                        <Link to="/applications" className="btn btn-primary mt-md">
                            View Applications
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page animate-fade-in">
            <div className="container" style={{ maxWidth: '800px' }}>
                <div className="page-header text-center">
                    <h1 className="page-title">Interview Complete!</h1>
                    <p className="page-subtitle">Here's your performance feedback</p>
                </div>

                {/* Recommendation */}
                <div className="card mb-lg text-center" style={{
                    background: 'var(--gradient-primary)',
                    border: 'none',
                    color: 'white'
                }}>
                    <h2 style={{ margin: 0, marginBottom: 'var(--spacing-sm)', color: 'white' }}>
                        Assessment
                    </h2>
                    <div style={{
                        fontSize: '2rem',
                        fontWeight: 700,
                        color: 'white'
                    }}>
                        {getRecommendationLabel(feedback.recommendation)}
                    </div>
                </div>

                {/* Scores */}
                <div className="card mb-lg">
                    <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Performance Scores</h3>
                    <div className="dashboard-grid">
                        <div className="text-center">
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                                {(feedback.scores?.technical * 10 || 0).toFixed(1)}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                Technical
                            </div>
                        </div>
                        <div className="text-center">
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-accent)' }}>
                                {(feedback.scores?.confidence * 10 || 0).toFixed(1)}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                Confidence
                            </div>
                        </div>
                        <div className="text-center">
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-success)' }}>
                                {(feedback.scores?.clarity * 10 || 0).toFixed(1)}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                Clarity
                            </div>
                        </div>
                        <div className="text-center">
                            <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                                {feedback.scores?.questions_answered || 0}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                Questions
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detailed Feedback */}
                {feedback.feedback && (
                    <>
                        {/* Strengths */}
                        {feedback.feedback.strengths?.length > 0 && (
                            <div className="card mb-md">
                                <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-success)' }}>
                                    💪 Strengths
                                </h3>
                                <ul style={{ margin: 0, paddingLeft: 'var(--spacing-lg)' }}>
                                    {feedback.feedback.strengths.map((s, i) => (
                                        <li key={i} style={{ marginBottom: 'var(--spacing-xs)' }}>{s}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Areas for Improvement */}
                        {feedback.feedback.areas_for_improvement?.length > 0 && (
                            <div className="card mb-md">
                                <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-warning)' }}>
                                    📈 Areas for Improvement
                                </h3>
                                <ul style={{ margin: 0, paddingLeft: 'var(--spacing-lg)' }}>
                                    {feedback.feedback.areas_for_improvement.map((a, i) => (
                                        <li key={i} style={{ marginBottom: 'var(--spacing-xs)' }}>{a}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Summary */}
                        {feedback.feedback.detailed_summary && (
                            <div className="card mb-lg">
                                <h3 style={{ marginBottom: 'var(--spacing-md)' }}>📝 Summary</h3>
                                <p style={{
                                    margin: 0,
                                    lineHeight: 1.8,
                                    color: 'var(--color-text-secondary)'
                                }}>
                                    {feedback.feedback.detailed_summary}
                                </p>
                            </div>
                        )}
                    </>
                )}

                {/* Actions */}
                <div className="flex gap-md justify-center">
                    <Link to="/applications" className="btn btn-secondary">
                        View Applications
                    </Link>
                    <Link to="/jobs" className="btn btn-primary">
                        Browse More Jobs
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default InterviewFeedback;
