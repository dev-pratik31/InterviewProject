/**
 * Job Feed Page (Candidate) - Premium Edition
 * 
 * Professional layout with modern design and clean aesthetics
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { candidateAPI } from '../api/apiClient';

function JobFeed({ showApplications = false }) {
    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({});

    useEffect(() => {
        loadData();
    }, [showApplications]);

    const loadData = async (page = 1) => {
        setLoading(true);
        try {
            if (showApplications) {
                const res = await candidateAPI.getMyApplications({ page, page_size: 10 });
                setApplications(res.data.data || []);
                setPagination(res.data.pagination || {});
            } else {
                const res = await candidateAPI.browseJobs({ page, page_size: 12, search: search || undefined });
                setJobs(res.data.data || []);
                setPagination(res.data.pagination || {});
            }
        } catch (err) {
            console.error('Failed to load data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        loadData(1);
    };

    const getStatusStyle = (status) => {
        const styles = {
            pending: { background: '#f59e0b20', color: '#f59e0b', border: '1px solid #f59e0b40' },
            reviewing: { background: '#3b82f620', color: '#3b82f6', border: '1px solid #3b82f640' },
            interview_scheduled: { background: '#8b5cf620', color: '#8b5cf6', border: '1px solid #8b5cf640' },
            rejected: { background: '#ef444420', color: '#ef4444', border: '1px solid #ef444440' },
            hired: { background: '#10b98120', color: '#10b981', border: '1px solid #10b98140' }
        };
        return styles[status] || styles.pending;
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

    // Applications View
    if (showApplications) {
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
                                My Applications
                            </h1>
                            <p style={{
                                color: 'var(--color-text-secondary)',
                                fontSize: '1rem'
                            }}>
                                Track your status and upcoming interviews
                            </p>
                        </div>
                        <Link
                            to="/jobs"
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
                            Browse More Jobs
                        </Link>
                    </div>

                    {applications.length === 0 ? (
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
                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                </svg>
                            </div>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-sm)' }}>
                                No applications yet
                            </h3>
                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
                                Start your journey by finding the perfect role
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
                                Explore Opportunities
                            </Link>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
                            gap: 'var(--spacing-lg)'
                        }}>
                            {applications.map(app => (
                                <ApplicationCard key={app.id} application={app} getStatusStyle={getStatusStyle} />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.total_pages > 1 && (
                        <Pagination pagination={pagination} onPageChange={loadData} />
                    )}
                </div>
            </div>
        );
    }

    // Jobs Feed View
    return (
        <div className="page animate-fade-in" style={{ background: 'var(--color-bg-primary)' }}>
            <div className="container" style={{ maxWidth: '1400px' }}>
                {/* Hero Section */}
                <div style={{
                    textAlign: 'center',
                    padding: 'var(--spacing-2xl) 0',
                    marginBottom: 'var(--spacing-xl)'
                }}>
                    <h1 style={{
                        fontSize: '3rem',
                        fontWeight: 700,
                        marginBottom: 'var(--spacing-md)',
                        lineHeight: 1.2
                    }}>
                        Find Your{' '}
                        <span style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}>
                            Dream Job
                        </span>
                    </h1>
                    <p style={{
                        fontSize: '1.125rem',
                        color: 'var(--color-text-secondary)',
                        maxWidth: '600px',
                        margin: '0 auto'
                    }}>
                        Discover roles that match your skills at top companies
                    </p>
                </div>

                {/* Search Bar */}
                <div style={{
                    maxWidth: '800px',
                    margin: '0 auto var(--spacing-2xl)'
                }}>
                    <form onSubmit={handleSearch}>
                        <div style={{
                            position: 'relative',
                            background: 'var(--color-bg-secondary)',
                            borderRadius: '16px',
                            padding: 'var(--spacing-sm)',
                            border: '2px solid var(--color-border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-sm)',
                            transition: 'all 0.3s'
                        }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" style={{ marginLeft: 'var(--spacing-sm)' }}>
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.35-4.35"></path>
                            </svg>
                            <input
                                type="text"
                                placeholder="Search by role, skill, or keyword..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{
                                    flex: 1,
                                    background: 'transparent',
                                    border: 'none',
                                    fontSize: '1rem',
                                    color: 'var(--color-text-primary)',
                                    outline: 'none',
                                    padding: 'var(--spacing-sm)'
                                }}
                            />
                            <button
                                type="submit"
                                style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    padding: 'var(--spacing-sm) var(--spacing-xl)',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                Search Jobs
                            </button>
                        </div>
                    </form>
                </div>

                {/* Job Grid */}
                {jobs.length === 0 ? (
                    <div className="card" style={{
                        padding: 'var(--spacing-2xl)',
                        textAlign: 'center'
                    }}>
                        <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>No jobs found</h3>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
                            Try adjusting your search criteria
                        </p>
                        <button
                            onClick={() => { setSearch(''); loadData(1); }}
                            className="btn btn-secondary"
                        >
                            Clear Search
                        </button>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                        gap: 'var(--spacing-lg)'
                    }}>
                        {jobs.map(job => (
                            <JobCard key={job.id} job={job} />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {pagination.total_pages > 1 && (
                    <Pagination pagination={pagination} onPageChange={loadData} />
                )}
            </div>
        </div>
    );
}

// Job Card Component
const JobCard = ({ job }) => (
    <Link
        to={`/jobs/${job.id}`}
        style={{
            textDecoration: 'none',
            display: 'block',
            height: '100%'
        }}
    >
        <div className="card" style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.3s',
            position: 'relative',
            overflow: 'hidden'
        }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = '#667eea40';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.boxShadow = 'none';
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

            <div style={{ padding: 'var(--spacing-lg)' }}>
                {/* Header */}
                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                    <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        marginBottom: 'var(--spacing-xs)',
                        color: 'var(--color-text-primary)'
                    }}>
                        {job.title}
                    </h3>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-xs)',
                        color: 'var(--color-text-secondary)',
                        fontSize: '0.9375rem'
                    }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                        </svg>
                        {job.company_name}
                    </div>
                </div>

                {/* Tags */}
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 'var(--spacing-xs)',
                    marginBottom: 'var(--spacing-lg)'
                }}>
                    <Tag
                        icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>}
                        text={job.location || 'Remote'}
                    />
                    <Tag
                        icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                        </svg>}
                        text={job.employment_type || 'Full-time'}
                    />
                    <Tag
                        icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>}
                        text={`${job.experience_required}+ yrs`}
                    />
                </div>

                {/* Footer */}
                <div style={{
                    paddingTop: 'var(--spacing-md)',
                    borderTop: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 'auto'
                }}>
                    <span style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-text-muted)'
                    }}>
                        Posted {new Date(job.created_at).toLocaleDateString()}
                    </span>
                    <span style={{
                        color: '#667eea',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        View Details
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </span>
                </div>
            </div>
        </div>
    </Link>
);

// Application Card Component
const ApplicationCard = ({ application, getStatusStyle }) => (
    <div className="card" style={{
        padding: 'var(--spacing-lg)',
        transition: 'all 0.3s'
    }}
        onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#667eea40';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
        }}
    >
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 'var(--spacing-md)'
        }}>
            <div style={{ flex: 1 }}>
                <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    marginBottom: 'var(--spacing-xs)'
                }}>
                    {application.job_title}
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
                    {application.company_name}
                </div>
            </div>
            <span style={{
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'capitalize',
                whiteSpace: 'nowrap',
                ...getStatusStyle(application.status)
            }}>
                {application.status.replace('_', ' ')}
            </span>
        </div>

        <div style={{
            paddingTop: 'var(--spacing-md)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        }}>
            <span style={{
                fontSize: '0.75rem',
                color: 'var(--color-text-muted)'
            }}>
                Applied {new Date(application.created_at).toLocaleDateString()}
            </span>
            {application.status === 'interview_scheduled' && (
                <Link
                    to={`/applications/${application.id}/schedule`}
                    className="btn btn-primary btn-sm"
                    style={{
                        padding: 'var(--spacing-xs) var(--spacing-md)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        textDecoration: 'none'
                    }}
                >
                    View Interview
                </Link>
            )}
        </div>
    </div>
);

// Tag Component
const Tag = ({ icon, text }) => (
    <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: 'var(--spacing-xs) var(--spacing-sm)',
        background: 'var(--color-bg-tertiary)',
        borderRadius: '6px',
        fontSize: '0.75rem',
        color: 'var(--color-text-secondary)',
        border: '1px solid var(--color-border)'
    }}>
        {icon}
        {text}
    </span>
);

// Pagination Component
const Pagination = ({ pagination, onPageChange }) => (
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
            onClick={() => onPageChange(pagination.page - 1)}
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
            onClick={() => onPageChange(pagination.page + 1)}
            style={{
                padding: 'var(--spacing-sm) var(--spacing-lg)',
                fontSize: '0.875rem',
                fontWeight: 600
            }}
        >
            Next
        </button>
    </div>
);

export default JobFeed;