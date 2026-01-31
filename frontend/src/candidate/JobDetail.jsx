/**
 * Job Detail Page (Candidate) - Premium Edition
 * 
 * Professional, clean UI for viewing job details and applying
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { candidateAPI } from '../api/apiClient';
import ScheduleInterviewModal from './ScheduleInterviewModal';

function JobDetail() {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduled, setScheduled] = useState(null);

    useEffect(() => {
        loadJob();
    }, [jobId]);

    const loadJob = async () => {
        try {
            const res = await candidateAPI.getJob(jobId);
            setJob(res.data);
        } catch (err) {
            console.error('Failed to load job:', err);
        } finally {
            setLoading(false);
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

    if (!job) {
        return (
            <div className="page">
                <div className="container" style={{ maxWidth: '600px' }}>
                    <div className="card" style={{
                        padding: 'var(--spacing-2xl)',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            width: '100px',
                            height: '100px',
                            margin: '0 auto var(--spacing-lg)',
                            background: 'var(--color-bg-tertiary)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.5">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                        </div>
                        <h2 style={{ marginBottom: 'var(--spacing-sm)' }}>Job Not Found</h2>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
                            This job posting may have been removed or is no longer available
                        </p>
                        <Link
                            to="/jobs"
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
                            Browse Other Jobs
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page animate-fade-in" style={{ background: 'var(--color-bg-primary)' }}>
            <div className="container" style={{ maxWidth: '1000px' }}>
                {/* Back Link */}
                <Link
                    to="/jobs"
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
                    Back to Jobs
                </Link>

                {/* Header Card */}
                <div className="card" style={{
                    padding: 'var(--spacing-2xl)',
                    marginBottom: 'var(--spacing-lg)',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Background Pattern */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        opacity: 0.1,
                        backgroundImage: 'radial-gradient(circle at 20px 20px, white 2px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }}></div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: 'var(--spacing-lg)',
                            flexWrap: 'wrap',
                            marginBottom: 'var(--spacing-lg)'
                        }}>
                            <div style={{ flex: 1 }}>
                                <h1 style={{
                                    fontSize: '2.5rem',
                                    fontWeight: 700,
                                    marginBottom: 'var(--spacing-sm)',
                                    color: 'white'
                                }}>
                                    {job.title}
                                </h1>
                                <div style={{
                                    fontSize: '1.25rem',
                                    fontWeight: 500,
                                    opacity: 0.95,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-xs)'
                                }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                    </svg>
                                    {job.company_name}
                                </div>
                            </div>
                            <button
                                onClick={() => setShowScheduleModal(true)}
                                style={{
                                    background: 'white',
                                    color: '#667eea',
                                    border: 'none',
                                    borderRadius: '12px',
                                    padding: 'var(--spacing-md) var(--spacing-xl)',
                                    fontSize: '1.125rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                Apply Now
                            </button>
                        </div>

                        {/* Meta Tags */}
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 'var(--spacing-sm)'
                        }}>
                            <MetaBadge
                                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>}
                                text={job.location || 'Remote'}
                            />
                            <MetaBadge
                                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>}
                                text={`${job.experience_required}+ years`}
                            />
                            <MetaBadge
                                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                </svg>}
                                text={job.remote_type}
                            />
                            <MetaBadge
                                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>}
                                text={job.employment_type}
                            />
                        </div>

                        {/* Salary */}
                        {(job.salary_min || job.salary_max) && (
                            <div style={{
                                marginTop: 'var(--spacing-lg)',
                                padding: 'var(--spacing-md) var(--spacing-lg)',
                                background: 'rgba(255, 255, 255, 0.2)',
                                borderRadius: '12px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-sm)',
                                backdropFilter: 'blur(10px)'
                            }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <line x1="12" y1="1" x2="12" y2="23"></line>
                                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                </svg>
                                <span style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                                    ${job.salary_min?.toLocaleString() || '?'} - ${job.salary_max?.toLocaleString() || '?'} {job.salary_currency}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Stats */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 'var(--spacing-md)',
                    marginBottom: 'var(--spacing-lg)'
                }}>
                    <StatCard
                        label="Views"
                        value={job.views_count || 0}
                        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>}
                    />
                    <StatCard
                        label="Applicants"
                        value={job.applications_count || 0}
                        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>}
                    />
                    <StatCard
                        label="Posted"
                        value={new Date(job.published_at || job.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>}
                    />
                </div>

                {/* Description */}
                <div className="card" style={{
                    padding: 'var(--spacing-xl)',
                    marginBottom: 'var(--spacing-lg)'
                }}>
                    <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        marginBottom: 'var(--spacing-lg)',
                        paddingBottom: 'var(--spacing-md)',
                        borderBottom: '2px solid var(--color-border)'
                    }}>
                        Job Description
                    </h2>
                    <div style={{
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.8,
                        fontSize: '1rem',
                        whiteSpace: 'pre-wrap'
                    }}>
                        {job.description}
                    </div>
                </div>

                {/* Requirements */}
                <div className="card" style={{
                    padding: 'var(--spacing-xl)',
                    marginBottom: 'var(--spacing-lg)'
                }}>
                    <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        marginBottom: 'var(--spacing-lg)',
                        paddingBottom: 'var(--spacing-md)',
                        borderBottom: '2px solid var(--color-border)'
                    }}>
                        Requirements
                    </h2>

                    {job.education && (
                        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                            <h4 style={{
                                fontSize: '0.75rem',
                                color: 'var(--color-text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                marginBottom: 'var(--spacing-sm)',
                                fontWeight: 700
                            }}>
                                Education
                            </h4>
                            <p style={{
                                fontSize: '1rem',
                                color: 'var(--color-text-primary)',
                                margin: 0
                            }}>
                                {job.education}
                            </p>
                        </div>
                    )}

                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <h4 style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            marginBottom: 'var(--spacing-sm)',
                            fontWeight: 700
                        }}>
                            Experience
                        </h4>
                        <p style={{
                            fontSize: '1rem',
                            color: 'var(--color-text-primary)',
                            margin: 0
                        }}>
                            {job.experience_required}+ years of relevant experience
                        </p>
                    </div>

                    {job.skills_required?.length > 0 && (
                        <div>
                            <h4 style={{
                                fontSize: '0.75rem',
                                color: 'var(--color-text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                marginBottom: 'var(--spacing-md)',
                                fontWeight: 700
                            }}>
                                Required Skills
                            </h4>
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 'var(--spacing-sm)'
                            }}>
                                {job.skills_required.map((skill, i) => (
                                    <span
                                        key={i}
                                        style={{
                                            padding: 'var(--spacing-xs) var(--spacing-md)',
                                            background: '#667eea15',
                                            color: '#667eea',
                                            borderRadius: '8px',
                                            fontSize: '0.875rem',
                                            fontWeight: 600,
                                            border: '1px solid #667eea40'
                                        }}
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Apply CTA */}
                <div className="card" style={{
                    padding: 'var(--spacing-2xl)',
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    position: 'relative',
                    overflow: 'hidden',
                    marginBottom: 'var(--spacing-2xl)'
                }}>
                    {/* Background Pattern */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        opacity: 0.1,
                        backgroundImage: 'radial-gradient(circle at 20px 20px, white 2px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }}></div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h3 style={{
                            fontSize: '1.75rem',
                            fontWeight: 700,
                            marginBottom: 'var(--spacing-sm)',
                            color: 'white'
                        }}>
                            Ready to Apply?
                        </h3>
                        <p style={{
                            fontSize: '1.125rem',
                            marginBottom: 'var(--spacing-xl)',
                            opacity: 0.95
                        }}>
                            Don't miss this opportunity at {job.company_name}
                        </p>
                        <button
                            onClick={() => setShowScheduleModal(true)}
                            style={{
                                background: 'white',
                                color: '#667eea',
                                border: 'none',
                                borderRadius: '12px',
                                padding: 'var(--spacing-md) var(--spacing-2xl)',
                                fontSize: '1.125rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                            }}
                        >
                            Apply & Schedule Interview
                        </button>
                    </div>
                </div>
            </div>

            {/* Schedule Interview Modal */}
            <ScheduleInterviewModal
                isOpen={showScheduleModal}
                onClose={() => setShowScheduleModal(false)}
                job={job}
                onScheduled={(date) => setScheduled(date)}
            />
        </div>
    );
}

// Helper Components
const MetaBadge = ({ icon, text }) => (
    <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--spacing-xs)',
        padding: 'var(--spacing-xs) var(--spacing-md)',
        background: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '8px',
        fontSize: '0.875rem',
        fontWeight: 600,
        backdropFilter: 'blur(10px)'
    }}>
        {icon}
        {text}
    </span>
);

const StatCard = ({ label, value, icon }) => (
    <div className="card" style={{
        padding: 'var(--spacing-lg)',
        background: 'var(--color-bg-secondary)'
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
                background: '#667eea15',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#667eea'
            }}>
                {icon}
            </div>
            <div>
                <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 600
                }}>
                    {label}
                </div>
                <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: 'var(--color-text-primary)'
                }}>
                    {value}
                </div>
            </div>
        </div>
    </div>
);

export default JobDetail;