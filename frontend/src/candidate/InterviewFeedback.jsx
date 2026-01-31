/**
 * Interview Feedback Page (Candidate) - Compact Edition
 * 
 * Non-scrollable, compact display of AI-generated interview feedback
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

    const getRecommendationStyle = (rec) => {
        const styles = {
            strong_hire: {
                gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                icon: '✓',
                label: 'Strong Hire'
            },
            hire: {
                gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                icon: '✓',
                label: 'Hire'
            },
            maybe: {
                gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                icon: '~',
                label: 'Maybe'
            },
            no_hire: {
                gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                icon: '✗',
                label: 'No Hire'
            }
        };
        return styles[rec] || styles.maybe;
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: 'var(--color-bg-primary)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="loading-spinner" style={{
                        width: '50px',
                        height: '50px',
                        marginBottom: 'var(--spacing-md)'
                    }}></div>
                    <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary)' }}>
                        Generating your feedback...
                    </p>
                </div>
            </div>
        );
    }

    if (error || !feedback) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: 'var(--color-bg-primary)',
                padding: 'var(--spacing-lg)'
            }}>
                <div className="card" style={{
                    padding: 'var(--spacing-xl)',
                    textAlign: 'center',
                    maxWidth: '500px'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        margin: '0 auto var(--spacing-md)',
                        background: 'var(--color-bg-tertiary)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.5">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    </div>
                    <h2 style={{ marginBottom: 'var(--spacing-xs)', fontSize: '1.5rem' }}>Feedback Unavailable</h2>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
                        {error || 'Could not load interview feedback'}
                    </p>
                    <Link
                        to="/applications"
                        className="btn"
                        style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            padding: 'var(--spacing-sm) var(--spacing-lg)',
                            fontSize: '0.9375rem',
                            fontWeight: 600
                        }}
                    >
                        View Applications
                    </Link>
                </div>
            </div>
        );
    }

    const recommendationStyle = getRecommendationStyle(feedback.recommendation);

    return (
        <div style={{
            height: '100vh',
            overflow: 'hidden',
            background: 'var(--color-bg-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--spacing-lg)'
        }}>
            <div className="animate-fade-in" style={{
                width: '100%',
                maxWidth: '1400px',
                height: '100%',
                maxHeight: '900px',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Header Section - Compact */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--spacing-lg)',
                    gap: 'var(--spacing-lg)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                        <div style={{
                            width: '70px',
                            height: '70px',
                            background: recommendationStyle.gradient,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2.5rem',
                            color: 'white',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                        }}>
                            {recommendationStyle.icon}
                        </div>
                        <div>
                            <h1 style={{
                                fontSize: '2rem',
                                fontWeight: 700,
                                margin: 0,
                                marginBottom: '4px'
                            }}>
                                Interview Complete!
                            </h1>
                            <p style={{
                                fontSize: '1rem',
                                color: 'var(--color-text-secondary)',
                                margin: 0
                            }}>
                                Assessment: <strong style={{ color: recommendationStyle.gradient.match(/#[0-9a-f]{6}/i)[0] }}>
                                    {recommendationStyle.label}
                                </strong>
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                        <Link
                            to="/applications"
                            className="btn btn-secondary"
                            style={{
                                padding: 'var(--spacing-sm) var(--spacing-lg)',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                whiteSpace: 'nowrap'
                            }}
                        >
                            Applications
                        </Link>
                        <Link
                            to="/jobs"
                            className="btn"
                            style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                border: 'none',
                                padding: 'var(--spacing-sm) var(--spacing-lg)',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                whiteSpace: 'nowrap'
                            }}
                        >
                            Browse Jobs
                        </Link>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div style={{
                    flex: 1,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 'var(--spacing-lg)',
                    minHeight: 0
                }}>
                    {/* Left Column */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--spacing-md)'
                    }}>
                        {/* Performance Scores */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 'var(--spacing-md)'
                        }}>
                            <ScoreCard
                                label="Technical"
                                score={(feedback.scores?.technical * 10 || 0).toFixed(1)}
                                color="#667eea"
                                percentage={(feedback.scores?.technical || 0) * 100}
                            />
                            <ScoreCard
                                label="Confidence"
                                score={(feedback.scores?.confidence * 10 || 0).toFixed(1)}
                                color="#06b6d4"
                                percentage={(feedback.scores?.confidence || 0) * 100}
                            />
                            <ScoreCard
                                label="Clarity"
                                score={(feedback.scores?.clarity * 10 || 0).toFixed(1)}
                                color="#10b981"
                                percentage={(feedback.scores?.clarity || 0) * 100}
                            />
                            <ScoreCard
                                label="Questions"
                                score={feedback.scores?.questions_answered || 0}
                                color="#8b5cf6"
                                percentage={100}
                                isCount={true}
                            />
                        </div>

                        {/* Summary */}
                        {feedback.feedback?.detailed_summary && (
                            <div className="card" style={{
                                padding: 'var(--spacing-md)',
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <h3 style={{
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    marginBottom: 'var(--spacing-sm)',
                                    paddingBottom: 'var(--spacing-xs)',
                                    borderBottom: '2px solid var(--color-border)'
                                }}>
                                    Summary
                                </h3>
                                <p style={{
                                    margin: 0,
                                    lineHeight: 1.6,
                                    fontSize: '0.875rem',
                                    color: 'var(--color-text-secondary)'
                                }}>
                                    {feedback.feedback.detailed_summary}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Column */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--spacing-md)'
                    }}>
                        {/* Strengths */}
                        {feedback.feedback?.strengths?.length > 0 && (
                            <div className="card" style={{
                                padding: 'var(--spacing-md)',
                                borderLeft: '3px solid #10b981',
                                flex: 1
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-xs)',
                                    marginBottom: 'var(--spacing-sm)'
                                }}>
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '8px',
                                        background: '#10b98120',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                    <h3 style={{
                                        fontSize: '1rem',
                                        fontWeight: 700,
                                        margin: 0,
                                        color: '#10b981'
                                    }}>
                                        Strengths
                                    </h3>
                                </div>
                                <ul style={{
                                    margin: 0,
                                    padding: 0,
                                    listStyle: 'none'
                                }}>
                                    {feedback.feedback.strengths.map((s, i) => (
                                        <li key={i} style={{
                                            marginBottom: 'var(--spacing-xs)',
                                            paddingLeft: 'var(--spacing-md)',
                                            position: 'relative',
                                            fontSize: '0.875rem',
                                            lineHeight: 1.5
                                        }}>
                                            <span style={{
                                                position: 'absolute',
                                                left: 0,
                                                color: '#10b981',
                                                fontWeight: 700
                                            }}>✓</span>
                                            {s}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Areas for Improvement */}
                        {feedback.feedback?.areas_for_improvement?.length > 0 && (
                            <div className="card" style={{
                                padding: 'var(--spacing-md)',
                                borderLeft: '3px solid #f59e0b',
                                flex: 1
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-xs)',
                                    marginBottom: 'var(--spacing-sm)'
                                }}>
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '8px',
                                        background: '#f59e0b20',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                        </svg>
                                    </div>
                                    <h3 style={{
                                        fontSize: '1rem',
                                        fontWeight: 700,
                                        margin: 0,
                                        color: '#f59e0b'
                                    }}>
                                        Areas to Improve
                                    </h3>
                                </div>
                                <ul style={{
                                    margin: 0,
                                    padding: 0,
                                    listStyle: 'none'
                                }}>
                                    {feedback.feedback.areas_for_improvement.map((a, i) => (
                                        <li key={i} style={{
                                            marginBottom: 'var(--spacing-xs)',
                                            paddingLeft: 'var(--spacing-md)',
                                            position: 'relative',
                                            fontSize: '0.875rem',
                                            lineHeight: 1.5
                                        }}>
                                            <span style={{
                                                position: 'absolute',
                                                left: 0,
                                                color: '#f59e0b',
                                                fontWeight: 700
                                            }}>→</span>
                                            {a}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Compact Score Card Component
const ScoreCard = ({ label, score, color, percentage, isCount = false }) => (
    <div className="card" style={{
        padding: 'var(--spacing-sm)',
        position: 'relative',
        overflow: 'hidden'
    }}>
        <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${isCount ? 100 : percentage}%`,
            background: `${color}10`,
            transition: 'height 0.8s ease'
        }}></div>

        <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--spacing-xs)'
            }}>
                <div style={{
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--color-text-muted)',
                    fontWeight: 700
                }}>
                    {label}
                </div>
                <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: `${color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                </div>
            </div>

            <div style={{
                fontSize: '2rem',
                fontWeight: 700,
                lineHeight: 1,
                color: color,
                marginBottom: 'var(--spacing-xs)'
            }}>
                {score}
            </div>

            {!isCount && (
                <div style={{
                    height: '4px',
                    background: 'var(--color-bg-tertiary)',
                    borderRadius: '2px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        height: '100%',
                        width: `${percentage}%`,
                        background: color,
                        borderRadius: '2px',
                        transition: 'width 0.8s ease'
                    }}></div>
                </div>
            )}
        </div>
    </div>
);

export default InterviewFeedback;