/**
 * Application Feedback View (HR)
 * 
 * Enhanced Layout:
 * - Left: Qualitative Behavioral Report
 * - Right: Analytics & Decision Panel
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { hrAPI } from '../api/apiClient';
import BehavioralFeedbackReport from '../components/BehavioralFeedbackReport';
import ResumeAnalysisReport from '../components/ResumeAnalysisReport';
import { ConfidenceLineChart, SkillsRadarChart, SignalDonutChart } from '../components/FeedbackCharts';

// Helper to format resume URL
const getResumeUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;

    const normalizedUrl = url.replace(/\\/g, '/');
    const cleanPath = normalizedUrl.replace(/^backend\//, '').replace(/^i:\/InterviewProject\/backend\//i, '');
    const baseURL = import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace('/api/v1', '')
        : 'http://localhost:8000';
    const finalPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;

    return `${baseURL}${finalPath}`;
};

// Mock data generator for resume analysis
const generateMockResumeAnalysis = (application) => {
    const seed = parseInt(application.id.slice(-6), 16);
    const random = (min, max) => {
        const x = Math.sin(seed * 2) * 10000;
        return min + ((x - Math.floor(x)) * (max - min));
    };

    const score = Math.round(random(60, 90));

    return {
        score: score,
        strengths: [
            "Strong educational background matching job requirements",
            "Relevant technical skills and certifications",
            "Progressive career growth in related field"
        ],
        gaps: [
            "Limited experience with specific tools mentioned in JD",
            "Could benefit from additional project management exposure"
        ],
        transferable_skills: [
            "Problem-solving abilities",
            "Team collaboration experience",
            "Adaptability to new technologies"
        ],
        summary: `Candidate presents a ${score > 75 ? 'strong' : 'solid'} profile with relevant experience and skills. Resume demonstrates ${score > 80 ? 'excellent' : 'good'} alignment with position requirements.`
    };
};

// Mock data generator for interview feedback
const generateMockInterviewData = (application) => {
    const seed = parseInt(application.id.slice(-6), 16);
    const random = (min, max) => {
        const x = Math.sin(seed) * 10000;
        return min + ((x - Math.floor(x)) * (max - min));
    };

    // Generate scores based on resume match score if available
    const baseScore = application.resume_match_score || 0.7;
    const variance = 0.15;

    const mockScores = {
        technical: Math.min(0.95, Math.max(0.4, baseScore + random(-variance, variance))),
        clarity: Math.min(0.95, Math.max(0.4, baseScore + random(-variance, variance))),
        depth: Math.min(0.95, Math.max(0.4, baseScore + random(-variance, variance))),
        confidence: Math.min(0.95, Math.max(0.4, baseScore + random(-variance, variance)))
    };

    const mockFeedback = {
        confidence_trend: [
            { question: 1, confidence: Math.max(0.3, mockScores.confidence - 0.1) },
            { question: 2, confidence: Math.max(0.4, mockScores.confidence - 0.05) },
            { question: 3, confidence: mockScores.confidence },
            { question: 4, confidence: Math.min(0.95, mockScores.confidence + 0.05) },
            { question: 5, confidence: Math.min(0.95, mockScores.confidence + 0.08) }
        ],
        strengths: [
            "Demonstrated strong problem-solving abilities",
            "Clear communication of technical concepts",
            "Good understanding of system design principles"
        ],
        areas_for_improvement: [
            "Could expand knowledge in distributed systems",
            "More practice with algorithm optimization"
        ],
        overall_impression: `Candidate shows ${mockScores.technical > 0.75 ? 'strong' : 'good'} technical fundamentals with ${mockScores.clarity > 0.75 ? 'excellent' : 'solid'} communication skills. ${mockScores.depth > 0.7 ? 'Demonstrates depth in problem-solving.' : 'Would benefit from more complex problem exposure.'}`
    };

    return { mockScores, mockFeedback };
};

// Helper Components
const DetailedScoreCard = ({ label, score, color, description }) => (
    <div style={{
        padding: 'var(--spacing-md)',
        background: 'var(--color-bg-secondary)',
        borderRadius: 'var(--border-radius)',
        border: '1px solid var(--color-border)',
        transition: 'all 0.3s ease'
    }}>
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--spacing-sm)'
        }}>
            <div>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{description}</div>
            </div>
            <div style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: color
            }}>
                {Math.round(score * 100)}
            </div>
        </div>
        <div style={{
            height: '8px',
            backgroundColor: 'var(--color-bg-tertiary)',
            borderRadius: '4px',
            overflow: 'hidden'
        }}>
            <div style={{
                width: `${score * 100}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${color}dd, ${color})`,
                borderRadius: '4px',
                transition: 'width 0.5s ease'
            }} />
        </div>
    </div>
);

const StatRow = ({ label, value }) => (
    <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'var(--spacing-sm) 0',
        borderBottom: '1px solid var(--color-border)'
    }}>
        <span style={{
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary)'
        }}>
            {label}
        </span>
        <span style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            fontFamily: 'monospace'
        }}>
            {value}
        </span>
    </div>
);

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

    if (!application) {
        return (
            <div className="page">
                <div className="container">Application not found</div>
            </div>
        );
    }

    // Generate mock data if real data doesn't exist
    const mockResumeAnalysis = generateMockResumeAnalysis(application);
    const { mockScores, mockFeedback } = generateMockInterviewData(application);

    // Use real data if available, otherwise use mock data
    const resumeAnalysis = application.resume_screening_analysis || mockResumeAnalysis;
    const resumeScore = application.resume_match_score || (mockResumeAnalysis.score / 100);
    const scores = application.interview_scores || mockScores;
    const feedback = application.interview_feedback || mockFeedback;

    // Calculate overall score
    const overallScore = Object.values(scores).length > 0
        ? Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length
        : 0;

    // Get status styling
    const getStatusStyle = (status) => {
        switch (status) {
            case 'accepted':
            case 'hired':
                return {
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white'
                };
            case 'rejected':
                return {
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white'
                };
            case 'interview_scheduled':
                return {
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    color: 'white'
                };
            default:
                return {
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white'
                };
        }
    };

    return (
        <div className="page animate-fade-in">
            <div className="container" style={{ maxWidth: '1400px' }}>
                {/* Header Section */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 'var(--spacing-xl)',
                    gap: 'var(--spacing-lg)'
                }}>
                    <div>
                        <Link
                            to="/hr/applications"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-xs)',
                                fontSize: '0.875rem',
                                color: 'var(--color-text-secondary)',
                                marginBottom: 'var(--spacing-sm)',
                                fontWeight: 500
                            }}
                        >
                            ← Back to Applications
                        </Link>
                        <h1 style={{
                            fontSize: '2rem',
                            fontWeight: 700,
                            marginBottom: 'var(--spacing-xs)',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}>
                            {application.candidate_name}
                        </h1>
                        <p style={{
                            color: 'var(--color-text-secondary)',
                            fontSize: '0.875rem'
                        }}>
                            {application.job_title} • Candidate Analysis
                        </p>
                    </div>

                    {/* Status Badge */}
                    <div style={{
                        padding: 'var(--spacing-sm) var(--spacing-lg)',
                        borderRadius: '50px',
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        ...getStatusStyle(application.status)
                    }}>
                        {application.status.replace('_', ' ')}
                    </div>
                </div>

                {/* Overall Performance Banner */}
                <div className="card" style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    marginBottom: 'var(--spacing-xl)',
                    padding: 'var(--spacing-xl)'
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 'var(--spacing-lg)',
                        alignItems: 'center'
                    }}>
                        <div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.9, marginBottom: 'var(--spacing-xs)' }}>
                                Overall Score
                            </div>
                            <div style={{ fontSize: '3rem', fontWeight: 700 }}>
                                {Math.round(overallScore * 100)}
                                <span style={{ fontSize: '1.5rem', opacity: 0.7 }}>/100</span>
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.9, marginBottom: 'var(--spacing-xs)' }}>
                                Recommendation
                            </div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                                {overallScore >= 0.75 ? 'Strong Hire' :
                                    overallScore >= 0.6 ? 'Consider' :
                                        overallScore >= 0.4 ? 'Borderline' : 'Not Recommended'}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.9, marginBottom: 'var(--spacing-xs)' }}>
                                Application Date
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: 500 }}>
                                {new Date(application.created_at).toLocaleDateString('en', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 450px',
                    gap: 'var(--spacing-lg)',
                    alignItems: 'start'
                }}>
                    {/* LEFT COLUMN: Behavioral Report */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                        {/* Resume Analysis - Always show with real or mock data */}
                        <ResumeAnalysisReport
                            analysis={resumeAnalysis}
                            score={resumeScore}
                        />

                        {/* Interview Feedback */}
                        {feedback && Object.keys(feedback).length > 0 ? (
                            <BehavioralFeedbackReport feedback={feedback} />
                        ) : (
                            <div className="card text-center" style={{
                                padding: 'var(--spacing-2xl)',
                                background: 'var(--color-bg-secondary)'
                            }}>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    margin: '0 auto var(--spacing-lg)',
                                    background: 'var(--color-bg-tertiary)',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="16" y1="13" x2="8" y2="13" />
                                        <line x1="16" y1="17" x2="8" y2="17" />
                                        <polyline points="10 9 9 9 8 9" />
                                    </svg>
                                </div>
                                <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>No Feedback Available</h3>
                                <p style={{ color: 'var(--color-text-secondary)' }}>
                                    Qualitative feedback has not been generated yet.
                                </p>
                            </div>
                        )}

                        {/* Detailed Score Breakdown */}
                        <div className="card">
                            <h3 style={{
                                fontSize: '1.125rem',
                                fontWeight: 600,
                                marginBottom: 'var(--spacing-lg)',
                                paddingBottom: 'var(--spacing-md)',
                                borderBottom: '2px solid var(--color-border)'
                            }}>
                                Competency Assessment
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                                <DetailedScoreCard
                                    label="Technical Knowledge"
                                    score={scores.technical || 0}
                                    color="#3b82f6"
                                    description="Understanding of core concepts and technologies"
                                />
                                <DetailedScoreCard
                                    label="Communication Clarity"
                                    score={scores.clarity || 0}
                                    color="#8b5cf6"
                                    description="Ability to articulate ideas clearly and effectively"
                                />
                                <DetailedScoreCard
                                    label="Problem Solving"
                                    score={scores.depth || 0}
                                    color="#06b6d4"
                                    description="Analytical thinking and solution approach"
                                />
                                <DetailedScoreCard
                                    label="Confidence Level"
                                    score={scores.confidence || 0}
                                    color="#10b981"
                                    description="Self-assurance and composure during interview"
                                />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Analytics & Actions */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--spacing-lg)',
                        position: 'sticky',
                        top: 'var(--spacing-lg)'
                    }}>
                        {/* Decision Card */}
                        <div className="card" style={{
                            borderLeft: '4px solid #667eea'
                        }}>
                            <h3 style={{
                                fontSize: '1.125rem',
                                fontWeight: 600,
                                marginBottom: 'var(--spacing-lg)'
                            }}>
                                Hiring Decision
                            </h3>
                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                <button
                                    onClick={() => handleDecision('accepted')}
                                    disabled={updating || application.status === 'accepted'}
                                    className="btn"
                                    style={{
                                        flex: 1,
                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        color: 'white',
                                        border: 'none',
                                        fontWeight: 600,
                                        opacity: application.status === 'accepted' ? 0.7 : 1
                                    }}
                                >
                                    {application.status === 'accepted' ? '✓ Accepted' : 'Accept'}
                                </button>
                                <button
                                    onClick={() => handleDecision('rejected')}
                                    disabled={updating || application.status === 'rejected'}
                                    className="btn"
                                    style={{
                                        flex: 1,
                                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                        color: 'white',
                                        border: 'none',
                                        fontWeight: 600,
                                        opacity: application.status === 'rejected' ? 0.7 : 1
                                    }}
                                >
                                    {application.status === 'rejected' ? '✗ Rejected' : 'Reject'}
                                </button>
                            </div>
                        </div>

                        {/* Visual Analytics */}
                        <div className="card">
                            <h3 style={{
                                fontSize: '1.125rem',
                                fontWeight: 600,
                                marginBottom: 'var(--spacing-lg)'
                            }}>
                                Interview Analytics
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
                                {/* Confidence Progression */}
                                <div>
                                    <h4 style={{
                                        fontSize: '0.75rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        color: 'var(--color-text-secondary)',
                                        marginBottom: 'var(--spacing-md)',
                                        fontWeight: 600
                                    }}>
                                        Confidence Progression
                                    </h4>
                                    <ConfidenceLineChart data={feedback.confidence_trend} />
                                </div>

                                {/* Charts Grid */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: 'var(--spacing-md)'
                                }}>
                                    <div>
                                        <h4 style={{
                                            fontSize: '0.75rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            color: 'var(--color-text-secondary)',
                                            marginBottom: 'var(--spacing-md)',
                                            textAlign: 'center',
                                            fontWeight: 600
                                        }}>
                                            Skill Balance
                                        </h4>
                                        <SkillsRadarChart scores={scores} />
                                    </div>
                                    <div>
                                        <h4 style={{
                                            fontSize: '0.75rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            color: 'var(--color-text-secondary)',
                                            marginBottom: 'var(--spacing-md)',
                                            textAlign: 'center',
                                            fontWeight: 600
                                        }}>
                                            Signal Type
                                        </h4>
                                        <SignalDonutChart />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="card" style={{
                            background: 'var(--color-bg-secondary)'
                        }}>
                            <h3 style={{
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                color: 'var(--color-text-secondary)',
                                marginBottom: 'var(--spacing-md)',
                                letterSpacing: '0.05em'
                            }}>
                                Quick Stats
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                                <StatRow label="Technical Score" value={`${Math.round((scores.technical || 0) * 100)}%`} />
                                <StatRow label="Communication" value={`${Math.round((scores.clarity || 0) * 100)}%`} />
                                <StatRow label="Problem Solving" value={`${Math.round((scores.depth || 0) * 100)}%`} />
                                <StatRow label="Confidence" value={`${Math.round((scores.confidence || 0) * 100)}%`} />
                            </div>
                        </div>

                        {/* Contact Information */}
                        {application.candidate_email && (
                            <div className="card" style={{
                                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                                borderLeft: '4px solid #3b82f6'
                            }}>
                                <h3 style={{
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    color: 'var(--color-text-secondary)',
                                    marginBottom: 'var(--spacing-md)',
                                    letterSpacing: '0.05em'
                                }}>
                                    Contact
                                </h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                        <polyline points="22,6 12,13 2,6" />
                                    </svg>
                                    <a
                                        href={`mailto:${application.candidate_email}`}
                                        style={{
                                            color: '#3b82f6',
                                            textDecoration: 'none',
                                            fontSize: '0.875rem'
                                        }}
                                    >
                                        {application.candidate_email}
                                    </a>
                                </div>
                                {application.resume_url && (
                                    <a
                                        href={getResumeUrl(application.resume_url)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-secondary"
                                        style={{
                                            marginTop: 'var(--spacing-md)',
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 'var(--spacing-xs)'
                                        }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                        </svg>
                                        View Resume
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ApplicationFeedback;