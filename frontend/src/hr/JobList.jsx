/**
 * Job List Page (HR)
 * 
 * View and manage all job postings with enhanced UI.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { hrAPI } from '../api/apiClient';

function JobList() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({});
    const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        loadJobs();
    }, []);

    const loadJobs = async (page = 1) => {
        try {
            const res = await hrAPI.getJobs({ page, page_size: 10 });
            setJobs(res.data.data || []);
            setPagination(res.data.pagination || {});
        } catch (err) {
            console.error('Failed to load jobs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (jobId, newStatus) => {
        try {
            await hrAPI.updateJob(jobId, { status: newStatus });
            loadJobs();
        } catch (err) {
            console.error('Failed to update job:', err);
        }
    };

    // Calculate statistics
    const getStatistics = () => {
        const stats = {
            total: jobs.length,
            published: jobs.filter(j => j.status === 'published').length,
            draft: jobs.filter(j => j.status === 'draft').length,
            closed: jobs.filter(j => j.status === 'closed').length,
            totalApplications: jobs.reduce((sum, j) => sum + (j.applications_count || 0), 0)
        };
        return stats;
    };

    const getStatusStyle = (status) => {
        const styles = {
            published: {
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white'
            },
            draft: {
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white'
            },
            closed: {
                background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                color: 'white'
            }
        };
        return styles[status] || styles.draft;
    };

    if (loading) {
        return (
            <div className="page">
                <div className="container" style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '60vh'
                }}>
                    <div className="loading-spinner"></div>
                </div>
            </div>
        );
    }

    const stats = getStatistics();
    const filteredJobs = filterStatus === 'all'
        ? jobs
        : jobs.filter(job => job.status === filterStatus);

    return (
        <div className="page animate-fade-in" style={{ background: 'var(--color-bg-primary)' }}>
            <div className="container" style={{ maxWidth: '1400px' }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 'var(--spacing-2xl)',
                    gap: 'var(--spacing-lg)',
                    flexWrap: 'wrap'
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
                            Job Postings
                        </h1>
                        <p style={{
                            color: 'var(--color-text-secondary)',
                            fontSize: '1rem'
                        }}>
                            Manage your open positions and track applications
                        </p>
                    </div>
                    <Link
                        to="/hr/jobs/create"
                        className="btn"
                        style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            padding: 'var(--spacing-sm) var(--spacing-lg)',
                            fontSize: '1rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-xs)',
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                            transition: 'all 0.2s'
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Create New Job
                    </Link>
                </div>

                {/* Statistics Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 'var(--spacing-lg)',
                    marginBottom: 'var(--spacing-2xl)'
                }}>
                    <StatCard
                        label="Total Jobs"
                        value={stats.total}
                        gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                        icon={
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                            </svg>
                        }
                    />
                    <StatCard
                        label="Published"
                        value={stats.published}
                        gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
                        icon={
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                            </svg>
                        }
                    />
                    <StatCard
                        label="Drafts"
                        value={stats.draft}
                        gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                        icon={
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                            </svg>
                        }
                    />
                    <StatCard
                        label="Total Applications"
                        value={stats.totalApplications}
                        gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                        icon={
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                        }
                    />
                </div>

                {jobs.length === 0 ? (
                    <div className="card" style={{
                        padding: 'var(--spacing-2xl)',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            width: '120px',
                            height: '120px',
                            margin: '0 auto var(--spacing-lg)',
                            background: 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.5">
                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                            </svg>
                        </div>
                        <h3 style={{
                            fontSize: '1.5rem',
                            marginBottom: 'var(--spacing-sm)'
                        }}>
                            No Jobs Posted Yet
                        </h3>
                        <p style={{
                            margin: 'var(--spacing-md) 0',
                            color: 'var(--color-text-secondary)',
                            maxWidth: '400px',
                            marginLeft: 'auto',
                            marginRight: 'auto'
                        }}>
                            Create your first job posting to start receiving applications from qualified candidates.
                        </p>
                        <Link
                            to="/hr/jobs/create"
                            className="btn"
                            style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                border: 'none',
                                padding: 'var(--spacing-sm) var(--spacing-xl)',
                                fontSize: '1rem',
                                fontWeight: 600,
                                marginTop: 'var(--spacing-lg)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-xs)'
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Create Your First Job
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Filters and View Toggle */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 'var(--spacing-lg)',
                            gap: 'var(--spacing-md)',
                            flexWrap: 'wrap'
                        }}>
                            <div style={{
                                display: 'flex',
                                gap: 'var(--spacing-xs)',
                                flexWrap: 'wrap'
                            }}>
                                <FilterButton
                                    active={filterStatus === 'all'}
                                    onClick={() => setFilterStatus('all')}
                                    label="All Jobs"
                                    count={jobs.length}
                                />
                                <FilterButton
                                    active={filterStatus === 'published'}
                                    onClick={() => setFilterStatus('published')}
                                    label="Published"
                                    count={stats.published}
                                />
                                <FilterButton
                                    active={filterStatus === 'draft'}
                                    onClick={() => setFilterStatus('draft')}
                                    label="Drafts"
                                    count={stats.draft}
                                />
                                <FilterButton
                                    active={filterStatus === 'closed'}
                                    onClick={() => setFilterStatus('closed')}
                                    label="Closed"
                                    count={stats.closed}
                                />
                            </div>

                            <div style={{
                                display: 'flex',
                                gap: 'var(--spacing-xs)',
                                background: 'var(--color-bg-secondary)',
                                padding: '4px',
                                borderRadius: '8px',
                                border: '1px solid var(--color-border)'
                            }}>
                                <button
                                    onClick={() => setViewMode('cards')}
                                    style={{
                                        padding: 'var(--spacing-xs) var(--spacing-sm)',
                                        background: viewMode === 'cards' ? 'var(--color-primary)' : 'transparent',
                                        color: viewMode === 'cards' ? 'white' : 'var(--color-text-secondary)',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--spacing-xs)',
                                        fontSize: '0.875rem',
                                        fontWeight: 600
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="3" width="7" height="7"></rect>
                                        <rect x="14" y="3" width="7" height="7"></rect>
                                        <rect x="14" y="14" width="7" height="7"></rect>
                                        <rect x="3" y="14" width="7" height="7"></rect>
                                    </svg>
                                    Cards
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    style={{
                                        padding: 'var(--spacing-xs) var(--spacing-sm)',
                                        background: viewMode === 'table' ? 'var(--color-primary)' : 'transparent',
                                        color: viewMode === 'table' ? 'white' : 'var(--color-text-secondary)',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--spacing-xs)',
                                        fontSize: '0.875rem',
                                        fontWeight: 600
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="3" y1="12" x2="21" y2="12"></line>
                                        <line x1="3" y1="6" x2="21" y2="6"></line>
                                        <line x1="3" y1="18" x2="21" y2="18"></line>
                                    </svg>
                                    Table
                                </button>
                            </div>
                        </div>

                        {/* Jobs Display */}
                        {viewMode === 'cards' ? (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                                gap: 'var(--spacing-lg)'
                            }}>
                                {filteredJobs.map(job => (
                                    <JobCard
                                        key={job.id}
                                        job={job}
                                        onStatusChange={handleStatusChange}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{
                                        width: '100%',
                                        borderCollapse: 'collapse'
                                    }}>
                                        <thead>
                                            <tr style={{
                                                background: 'var(--color-bg-secondary)',
                                                borderBottom: '2px solid var(--color-border)'
                                            }}>
                                                <th style={tableHeaderStyle}>Job Title</th>
                                                <th style={tableHeaderStyle}>Location</th>
                                                <th style={tableHeaderStyle}>Type</th>
                                                <th style={tableHeaderStyle}>Status</th>
                                                <th style={tableHeaderStyle}>Applications</th>
                                                <th style={tableHeaderStyle}>Posted</th>
                                                <th style={tableHeaderStyle}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredJobs.map(job => (
                                                <tr
                                                    key={job.id}
                                                    style={{
                                                        borderBottom: '1px solid var(--color-border)',
                                                        transition: 'background-color 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    <td style={tableCellStyle}>
                                                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                                                            {job.title}
                                                        </div>
                                                        <div style={{
                                                            fontSize: '0.75rem',
                                                            color: 'var(--color-text-muted)'
                                                        }}>
                                                            {job.experience_required}+ years experience
                                                        </div>
                                                    </td>
                                                    <td style={tableCellStyle}>
                                                        {job.location || 'Not specified'}
                                                    </td>
                                                    <td style={tableCellStyle}>
                                                        <span style={{
                                                            padding: 'var(--spacing-xs) var(--spacing-sm)',
                                                            background: '#3b82f620',
                                                            color: '#3b82f6',
                                                            borderRadius: '6px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600
                                                        }}>
                                                            {job.remote_type}
                                                        </span>
                                                    </td>
                                                    <td style={tableCellStyle}>
                                                        <select
                                                            value={job.status}
                                                            onChange={(e) => handleStatusChange(job.id, e.target.value)}
                                                            style={{
                                                                padding: 'var(--spacing-xs) var(--spacing-sm)',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 600,
                                                                borderRadius: '6px',
                                                                border: '1px solid var(--color-border)',
                                                                cursor: 'pointer',
                                                                ...getStatusStyle(job.status)
                                                            }}
                                                        >
                                                            <option value="draft">Draft</option>
                                                            <option value="published">Published</option>
                                                            <option value="closed">Closed</option>
                                                        </select>
                                                    </td>
                                                    <td style={tableCellStyle}>
                                                        <Link
                                                            to={`/hr/jobs/${job.id}/applications`}
                                                            style={{
                                                                padding: 'var(--spacing-xs) var(--spacing-sm)',
                                                                background: '#10b98120',
                                                                color: '#10b981',
                                                                borderRadius: '6px',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 600,
                                                                textDecoration: 'none',
                                                                display: 'inline-block'
                                                            }}
                                                        >
                                                            {job.applications_count || 0} applications
                                                        </Link>
                                                    </td>
                                                    <td style={{
                                                        ...tableCellStyle,
                                                        color: 'var(--color-text-muted)',
                                                        fontSize: '0.875rem'
                                                    }}>
                                                        {new Date(job.created_at).toLocaleDateString('en', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </td>
                                                    <td style={tableCellStyle}>
                                                        <Link
                                                            to={`/hr/jobs/${job.id}/applications`}
                                                            className="btn btn-primary btn-sm"
                                                            style={{
                                                                padding: 'var(--spacing-xs) var(--spacing-md)',
                                                                fontSize: '0.875rem',
                                                                fontWeight: 600,
                                                                textDecoration: 'none'
                                                            }}
                                                        >
                                                            View Details
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Pagination */}
                        {pagination.total_pages > 1 && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: 'var(--spacing-md)',
                                marginTop: 'var(--spacing-xl)'
                            }}>
                                <button
                                    className="btn btn-secondary"
                                    disabled={!pagination.has_prev}
                                    onClick={() => loadJobs(pagination.page - 1)}
                                    style={{
                                        padding: 'var(--spacing-sm) var(--spacing-lg)',
                                        fontSize: '0.875rem',
                                        fontWeight: 600
                                    }}
                                >
                                    Previous
                                </button>
                                <span style={{
                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                    color: 'var(--color-text-secondary)',
                                    fontWeight: 600,
                                    fontSize: '0.875rem'
                                }}>
                                    Page {pagination.page} of {pagination.total_pages}
                                </span>
                                <button
                                    className="btn btn-secondary"
                                    disabled={!pagination.has_next}
                                    onClick={() => loadJobs(pagination.page + 1)}
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
                    </>
                )}
            </div>
        </div>
    );
}

// Helper Components
const StatCard = ({ label, value, gradient, icon }) => (
    <div className="card" style={{
        background: gradient,
        color: 'white',
        padding: 'var(--spacing-lg)',
        position: 'relative',
        overflow: 'hidden'
    }}>
        <div style={{
            position: 'absolute',
            top: '-10px',
            right: '-10px',
            opacity: 0.2,
            transform: 'scale(1.5)'
        }}>
            {icon}
        </div>
        <div style={{
            fontSize: '0.75rem',
            opacity: 0.95,
            marginBottom: 'var(--spacing-xs)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
        }}>
            {label}
        </div>
        <div style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            lineHeight: 1
        }}>
            {value}
        </div>
    </div>
);

const FilterButton = ({ active, onClick, label, count }) => (
    <button
        onClick={onClick}
        style={{
            padding: 'var(--spacing-xs) var(--spacing-md)',
            fontSize: '0.875rem',
            fontWeight: 600,
            borderRadius: '8px',
            border: active ? '2px solid #667eea' : '2px solid var(--color-border)',
            background: active ? '#667eea20' : 'var(--color-bg-secondary)',
            color: active ? '#667eea' : 'var(--color-text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap'
        }}
    >
        {label} {count > 0 && `(${count})`}
    </button>
);

const JobCard = ({ job, onStatusChange }) => {
    const getStatusStyle = (status) => {
        const styles = {
            published: { background: '#10b98120', color: '#10b981' },
            draft: { background: '#f59e0b20', color: '#f59e0b' },
            closed: { background: '#6b728020', color: '#6b7280' }
        };
        return styles[status] || styles.draft;
    };

    return (
        <div className="card" style={{
            padding: 'var(--spacing-lg)',
            transition: 'all 0.3s',
            border: '1px solid var(--color-border)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Status Badge */}
            <div style={{
                position: 'absolute',
                top: 'var(--spacing-md)',
                right: 'var(--spacing-md)'
            }}>
                <select
                    value={job.status}
                    onChange={(e) => onStatusChange(job.id, e.target.value)}
                    style={{
                        padding: 'var(--spacing-xs) var(--spacing-sm)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        ...getStatusStyle(job.status)
                    }}
                >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="closed">Closed</option>
                </select>
            </div>

            {/* Job Title */}
            <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                marginBottom: 'var(--spacing-sm)',
                paddingRight: '120px'
            }}>
                {job.title}
            </h3>

            {/* Job Details */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-sm)',
                marginBottom: 'var(--spacing-lg)'
            }}>
                <JobDetailRow
                    icon={
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                    }
                    label={job.location || 'Location not specified'}
                />
                <JobDetailRow
                    icon={
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                        </svg>
                    }
                    label={job.remote_type}
                />
                <JobDetailRow
                    icon={
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                    }
                    label={`${job.experience_required}+ years experience`}
                />
            </div>

            {/* Applications Count */}
            <div style={{
                padding: 'var(--spacing-md)',
                background: 'var(--color-bg-secondary)',
                borderRadius: '8px',
                marginBottom: 'var(--spacing-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)'
                }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    <span style={{
                        fontSize: '0.875rem',
                        color: 'var(--color-text-secondary)',
                        fontWeight: 500
                    }}>
                        Applications
                    </span>
                </div>
                <span style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: '#667eea'
                }}>
                    {job.applications_count || 0}
                </span>
            </div>

            {/* Posted Date */}
            <div style={{
                fontSize: '0.75rem',
                color: 'var(--color-text-muted)',
                marginBottom: 'var(--spacing-md)'
            }}>
                Posted on {new Date(job.created_at).toLocaleDateString('en', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                })}
            </div>

            {/* Action Button */}
            <Link
                to={`/hr/jobs/${job.id}/applications`}
                className="btn"
                style={{
                    width: '100%',
                    padding: 'var(--spacing-sm)',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.9375rem',
                    textDecoration: 'none',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--spacing-xs)'
                }}
            >
                View Applications
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </Link>
        </div>
    );
};

const JobDetailRow = ({ icon, label }) => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-xs)',
        color: 'var(--color-text-secondary)',
        fontSize: '0.875rem'
    }}>
        <span style={{ color: '#667eea' }}>{icon}</span>
        <span>{label}</span>
    </div>
);

// Table Styles
const tableHeaderStyle = {
    padding: 'var(--spacing-md) var(--spacing-lg)',
    textAlign: 'left',
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--color-text-secondary)'
};

const tableCellStyle = {
    padding: 'var(--spacing-lg)',
    color: 'var(--color-text-primary)'
};

export default JobList;