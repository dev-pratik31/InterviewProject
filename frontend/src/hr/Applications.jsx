/**
 * Applications Page (HR)
 * 
 * View and manage applications for a specific job with analytics.
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { hrAPI } from '../api/apiClient';

function Applications() {
    const { jobId } = useParams();
    const [job, setJob] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({});
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        loadData();
    }, [jobId]);

    const loadData = async (page = 1) => {
        try {
            const jobRes = await hrAPI.getJob(jobId);
            setJob(jobRes.data);

            const appsRes = await hrAPI.getJobApplications(jobId, { page, page_size: 10 });
            setApplications(appsRes.data.data || []);
            setPagination(appsRes.data.pagination || {});
        } catch (err) {
            console.error('Failed to load data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (applicationId, newStatus) => {
        try {
            await hrAPI.updateApplicationStatus(applicationId, newStatus);
            loadData();
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    // Analytics calculations
    const getAnalytics = () => {
        const statusCounts = {
            pending: 0,
            reviewing: 0,
            interview_scheduled: 0,
            rejected: 0,
            hired: 0
        };

        applications.forEach(app => {
            if (statusCounts.hasOwnProperty(app.status)) {
                statusCounts[app.status]++;
            }
        });

        const total = applications.length;
        const statusLabels = {
            pending: 'Pending',
            reviewing: 'Reviewing',
            interview_scheduled: 'Interview',
            rejected: 'Rejected',
            hired: 'Hired'
        };

        const colors = {
            pending: '#f59e0b',
            reviewing: '#3b82f6',
            interview_scheduled: '#8b5cf6',
            rejected: '#ef4444',
            hired: '#10b981'
        };

        return Object.entries(statusCounts).map(([status, count]) => ({
            status,
            label: statusLabels[status],
            count,
            percentage: total > 0 ? (count / total) * 100 : 0,
            color: colors[status]
        }));
    };

    // Application timeline data (last 7 days)
    const getTimelineData = () => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            return date.toISOString().split('T')[0];
        });

        const counts = {};
        last7Days.forEach(date => counts[date] = 0);

        applications.forEach(app => {
            const appDate = new Date(app.created_at).toISOString().split('T')[0];
            if (counts.hasOwnProperty(appDate)) {
                counts[appDate]++;
            }
        });

        const maxCount = Math.max(...Object.values(counts), 1);

        return last7Days.map(date => ({
            date,
            count: counts[date],
            height: (counts[date] / maxCount) * 100,
            label: new Date(date).toLocaleDateString('en', { weekday: 'short' })
        }));
    };

    const getStatusBadgeStyle = (status) => {
        const styles = {
            pending: { background: '#f59e0b', color: 'white' },
            reviewing: { background: '#3b82f6', color: 'white' },
            interview_scheduled: { background: '#8b5cf6', color: 'white' },
            rejected: { background: '#ef4444', color: 'white' },
            hired: { background: '#10b981', color: 'white' }
        };
        return styles[status] || styles.pending;
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

    const analytics = getAnalytics();
    const timeline = getTimelineData();
    const conversionRate = applications.length > 0
        ? ((analytics.find(a => a.status === 'hired')?.count || 0) / applications.length * 100).toFixed(1)
        : 0;

    const filteredApplications = filterStatus === 'all'
        ? applications
        : applications.filter(app => app.status === filterStatus);

    return (
        <div className="page animate-fade-in" style={{ background: 'var(--color-bg-primary)' }}>
            <div className="container" style={{ maxWidth: '1400px' }}>
                {/* Navigation */}
                <Link to="/hr/jobs" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                    marginBottom: 'var(--spacing-lg)',
                    color: 'var(--color-text-secondary)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    textDecoration: 'none',
                    transition: 'color 0.2s'
                }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                    Back to Jobs
                </Link>

                {/* Header */}
                <div style={{
                    marginBottom: 'var(--spacing-2xl)'
                }}>
                    <h1 style={{
                        fontSize: '2.5rem',
                        fontWeight: 700,
                        marginBottom: 'var(--spacing-xs)',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>
                        {job?.title}
                    </h1>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-md)',
                        flexWrap: 'wrap'
                    }}>
                        <span style={{
                            color: 'var(--color-text-secondary)',
                            fontSize: '1rem'
                        }}>
                            {job?.company_name}
                        </span>
                        <span style={{
                            width: '4px',
                            height: '4px',
                            borderRadius: '50%',
                            background: 'var(--color-text-muted)'
                        }}></span>
                        <span style={{
                            padding: 'var(--spacing-xs) var(--spacing-sm)',
                            background: job?.status === 'published' ? '#10b98120' : '#f59e0b20',
                            color: job?.status === 'published' ? '#10b981' : '#f59e0b',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontWeight: 600
                        }}>
                            {job?.status?.toUpperCase()}
                        </span>
                        <span style={{
                            color: 'var(--color-text-muted)',
                            fontSize: '0.875rem'
                        }}>
                            {applications.length} {applications.length === 1 ? 'Application' : 'Applications'}
                        </span>
                    </div>
                </div>

                {/* Key Metrics */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: 'var(--spacing-lg)',
                    marginBottom: 'var(--spacing-2xl)'
                }}>
                    <MetricCard
                        label="Total Applications"
                        value={applications.length}
                        gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                        icon={
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="8.5" cy="7" r="4"></circle>
                                <polyline points="17 11 19 13 23 9"></polyline>
                            </svg>
                        }
                    />
                    <MetricCard
                        label="Pending Review"
                        value={analytics.find(a => a.status === 'pending')?.count || 0}
                        gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                        icon={
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                        }
                    />
                    <MetricCard
                        label="Interviews"
                        value={analytics.find(a => a.status === 'interview_scheduled')?.count || 0}
                        gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                        icon={
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                        }
                    />
                    <MetricCard
                        label="Hired"
                        value={analytics.find(a => a.status === 'hired')?.count || 0}
                        subtext={`${conversionRate}% conversion`}
                        gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
                        icon={
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                        }
                    />
                </div>

                {/* Analytics Section */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                    gap: 'var(--spacing-lg)',
                    marginBottom: 'var(--spacing-2xl)'
                }}>
                    {/* Status Distribution Chart */}
                    <div className="card">
                        <h3 style={{
                            fontSize: '1.125rem',
                            fontWeight: 600,
                            marginBottom: 'var(--spacing-lg)',
                            color: 'var(--color-text-primary)'
                        }}>
                            Application Pipeline
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                            {analytics.filter(item => item.count > 0).map(item => (
                                <div key={item.status}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: 'var(--spacing-xs)'
                                    }}>
                                        <span style={{
                                            fontSize: '0.875rem',
                                            fontWeight: 600,
                                            color: 'var(--color-text-primary)'
                                        }}>
                                            {item.label}
                                        </span>
                                        <span style={{
                                            fontSize: '0.875rem',
                                            color: 'var(--color-text-secondary)',
                                            fontWeight: 600
                                        }}>
                                            {item.count} ({item.percentage.toFixed(0)}%)
                                        </span>
                                    </div>
                                    <div style={{
                                        height: '12px',
                                        backgroundColor: 'var(--color-bg-tertiary)',
                                        borderRadius: '6px',
                                        overflow: 'hidden',
                                        position: 'relative'
                                    }}>
                                        <div style={{
                                            width: `${item.percentage}%`,
                                            height: '100%',
                                            background: `linear-gradient(90deg, ${item.color}dd, ${item.color})`,
                                            borderRadius: '6px',
                                            transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: `0 0 8px ${item.color}40`
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Weekly Timeline Chart */}
                    <div className="card">
                        <h3 style={{
                            fontSize: '1.125rem',
                            fontWeight: 600,
                            marginBottom: 'var(--spacing-lg)',
                            color: 'var(--color-text-primary)'
                        }}>
                            Application Trend (7 Days)
                        </h3>
                        <div style={{
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'space-between',
                            height: '200px',
                            gap: 'var(--spacing-xs)',
                            padding: 'var(--spacing-md) 0'
                        }}>
                            {timeline.map((day, index) => (
                                <div key={index} style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-xs)',
                                    height: '100%',
                                    justifyContent: 'flex-end'
                                }}>
                                    {day.count > 0 && (
                                        <div style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            color: '#667eea',
                                            marginBottom: 'var(--spacing-xs)'
                                        }}>
                                            {day.count}
                                        </div>
                                    )}
                                    <div style={{
                                        width: '100%',
                                        height: day.count > 0 ? `${Math.max(day.height, 10)}%` : '0%',
                                        background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
                                        borderRadius: '6px 6px 0 0',
                                        transition: 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: day.count > 0 ? '0 -4px 12px rgba(102, 126, 234, 0.3)' : 'none',
                                        position: 'relative'
                                    }}>
                                        {day.count > 0 && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '-2px',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                width: '8px',
                                                height: '8px',
                                                background: '#667eea',
                                                borderRadius: '50%',
                                                border: '2px solid white'
                                            }} />
                                        )}
                                    </div>
                                    <div style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--color-text-muted)',
                                        marginTop: 'var(--spacing-xs)',
                                        fontWeight: 500
                                    }}>
                                        {day.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Job Details Card */}
                <div className="card" style={{
                    marginBottom: 'var(--spacing-2xl)',
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                    border: '1px solid var(--color-border)'
                }}>
                    <h3 style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        marginBottom: 'var(--spacing-lg)',
                        color: 'var(--color-text-primary)'
                    }}>
                        Position Details
                    </h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 'var(--spacing-lg)'
                    }}>
                        <DetailItem
                            icon={
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                            }
                            label="Experience Required"
                            value={`${job?.experience_required}+ years`}
                        />
                        <DetailItem
                            icon={
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                            }
                            label="Location"
                            value={job?.location || 'Not specified'}
                        />
                        <DetailItem
                            icon={
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                </svg>
                            }
                            label="Work Type"
                            value={job?.remote_type || 'On-site'}
                        />
                        <DetailItem
                            icon={
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="2" y1="12" x2="22" y2="12"></line>
                                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                                </svg>
                            }
                            label="Department"
                            value={job?.department || 'Engineering'}
                        />
                    </div>
                </div>

                {/* Applications List */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {/* Header with Filters */}
                    <div style={{
                        padding: 'var(--spacing-lg)',
                        borderBottom: '2px solid var(--color-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 'var(--spacing-md)'
                    }}>
                        <h3 style={{
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            margin: 0
                        }}>
                            All Applications
                        </h3>
                        <div style={{
                            display: 'flex',
                            gap: 'var(--spacing-xs)',
                            flexWrap: 'wrap'
                        }}>
                            <FilterButton
                                active={filterStatus === 'all'}
                                onClick={() => setFilterStatus('all')}
                                label="All"
                                count={applications.length}
                            />
                            <FilterButton
                                active={filterStatus === 'pending'}
                                onClick={() => setFilterStatus('pending')}
                                label="Pending"
                                count={analytics.find(a => a.status === 'pending')?.count || 0}
                            />
                            <FilterButton
                                active={filterStatus === 'reviewing'}
                                onClick={() => setFilterStatus('reviewing')}
                                label="Reviewing"
                                count={analytics.find(a => a.status === 'reviewing')?.count || 0}
                            />
                            <FilterButton
                                active={filterStatus === 'interview_scheduled'}
                                onClick={() => setFilterStatus('interview_scheduled')}
                                label="Interview"
                                count={analytics.find(a => a.status === 'interview_scheduled')?.count || 0}
                            />
                        </div>
                    </div>

                    {/* Applications Table/List */}
                    {filteredApplications.length === 0 ? (
                        <div style={{
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
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                            </div>
                            <h3 style={{ marginBottom: 'var(--spacing-sm)', fontSize: '1.25rem' }}>
                                No Applications Found
                            </h3>
                            <p style={{ color: 'var(--color-text-secondary)' }}>
                                {filterStatus === 'all'
                                    ? 'Applications will appear here once candidates apply to this position.'
                                    : `No applications with status "${filterStatus.replace('_', ' ')}".`}
                            </p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{
                                width: '100%',
                                borderCollapse: 'collapse'
                            }}>
                                <thead>
                                    <tr style={{
                                        background: 'var(--color-bg-secondary)',
                                        borderBottom: '1px solid var(--color-border)'
                                    }}>
                                        <th style={{
                                            padding: 'var(--spacing-md) var(--spacing-lg)',
                                            textAlign: 'left',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            color: 'var(--color-text-secondary)'
                                        }}>
                                            Candidate
                                        </th>
                                        <th style={{
                                            padding: 'var(--spacing-md) var(--spacing-lg)',
                                            textAlign: 'left',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            color: 'var(--color-text-secondary)'
                                        }}>
                                            Contact
                                        </th>
                                        <th style={{
                                            padding: 'var(--spacing-md) var(--spacing-lg)',
                                            textAlign: 'left',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            color: 'var(--color-text-secondary)'
                                        }}>
                                            Applied
                                        </th>
                                        <th style={{
                                            padding: 'var(--spacing-md) var(--spacing-lg)',
                                            textAlign: 'left',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            color: 'var(--color-text-secondary)'
                                        }}>
                                            Status
                                        </th>
                                        <th style={{
                                            padding: 'var(--spacing-md) var(--spacing-lg)',
                                            textAlign: 'right',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            color: 'var(--color-text-secondary)'
                                        }}>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredApplications.map(app => (
                                        <tr key={app.id} style={{
                                            borderBottom: '1px solid var(--color-border)',
                                            transition: 'background-color 0.2s'
                                        }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <td style={{
                                                padding: 'var(--spacing-lg)'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 'var(--spacing-sm)'
                                                }}>
                                                    <div style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '50%',
                                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        fontWeight: 700,
                                                        fontSize: '1rem'
                                                    }}>
                                                        {(app.candidate_name || 'U')[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{
                                                            fontWeight: 600,
                                                            fontSize: '0.9375rem',
                                                            marginBottom: '2px'
                                                        }}>
                                                            {app.candidate_name || 'Unknown Candidate'}
                                                        </div>
                                                        {app.resume_url && (
                                                            <a
                                                                href={app.resume_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                style={{
                                                                    fontSize: '0.75rem',
                                                                    color: '#667eea',
                                                                    textDecoration: 'none',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px',
                                                                    fontWeight: 500
                                                                }}
                                                            >
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                                    <polyline points="14 2 14 8 20 8" />
                                                                </svg>
                                                                Resume
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{
                                                padding: 'var(--spacing-lg)',
                                                color: 'var(--color-text-secondary)',
                                                fontSize: '0.875rem'
                                            }}>
                                                {app.candidate_email || '-'}
                                            </td>
                                            <td style={{
                                                padding: 'var(--spacing-lg)',
                                                color: 'var(--color-text-muted)',
                                                fontSize: '0.875rem'
                                            }}>
                                                {new Date(app.created_at).toLocaleDateString('en', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </td>
                                            <td style={{
                                                padding: 'var(--spacing-lg)'
                                            }}>
                                                <select
                                                    value={app.status}
                                                    onChange={(e) => handleStatusChange(app.id, e.target.value)}
                                                    style={{
                                                        padding: 'var(--spacing-xs) var(--spacing-sm)',
                                                        fontSize: '0.875rem',
                                                        fontWeight: 600,
                                                        minWidth: '180px',
                                                        borderRadius: '6px',
                                                        border: '1px solid var(--color-border)',
                                                        background: 'var(--color-bg-secondary)',
                                                        color: 'var(--color-text-primary)',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                        ...getStatusBadgeStyle(app.status)
                                                    }}
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="reviewing">Reviewing</option>
                                                    <option value="interview_scheduled">Interview Scheduled</option>
                                                    <option value="rejected">Rejected</option>
                                                    <option value="hired">Hired</option>
                                                </select>
                                            </td>
                                            <td style={{
                                                padding: 'var(--spacing-lg)',
                                                textAlign: 'right'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    gap: 'var(--spacing-xs)',
                                                    justifyContent: 'flex-end'
                                                }}>
                                                    {app.cover_letter && (
                                                        <button
                                                            className="btn btn-secondary btn-sm"
                                                            onClick={() => alert(app.cover_letter)}
                                                            style={{
                                                                padding: 'var(--spacing-xs) var(--spacing-sm)',
                                                                fontSize: '0.875rem',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            Cover Letter
                                                        </button>
                                                    )}
                                                    <Link
                                                        to={`/hr/applications/${app.id}/feedback`}
                                                        className="btn btn-primary btn-sm"
                                                        style={{
                                                            padding: 'var(--spacing-xs) var(--spacing-md)',
                                                            fontSize: '0.875rem',
                                                            fontWeight: 600,
                                                            whiteSpace: 'nowrap',
                                                            textDecoration: 'none',
                                                            display: 'inline-block'
                                                        }}
                                                    >
                                                        View Details
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {pagination.total_pages > 1 && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 'var(--spacing-md)',
                        marginTop: 'var(--spacing-xl)',
                        paddingBottom: 'var(--spacing-xl)'
                    }}>
                        <button
                            className="btn btn-secondary"
                            disabled={!pagination.has_prev}
                            onClick={() => loadData(pagination.page - 1)}
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
                            onClick={() => loadData(pagination.page + 1)}
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

// Helper Components
const MetricCard = ({ label, value, subtext, gradient, icon }) => (
    <div className="card" style={{
        background: gradient,
        color: 'white',
        padding: 'var(--spacing-lg)',
        position: 'relative',
        overflow: 'hidden'
    }}>
        <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            opacity: 0.2,
            transform: 'scale(2)'
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
        {subtext && (
            <div style={{
                fontSize: '0.875rem',
                opacity: 0.9,
                marginTop: 'var(--spacing-xs)',
                fontWeight: 500
            }}>
                {subtext}
            </div>
        )}
    </div>
);

const DetailItem = ({ icon, label, value }) => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-sm)'
    }}>
        <div style={{
            color: '#667eea',
            flexShrink: 0
        }}>
            {icon}
        </div>
        <div>
            <div style={{
                fontSize: '0.75rem',
                color: 'var(--color-text-muted)',
                marginBottom: '2px',
                fontWeight: 500
            }}>
                {label}
            </div>
            <div style={{
                fontSize: '0.9375rem',
                fontWeight: 600
            }}>
                {value}
            </div>
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
            borderRadius: '6px',
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

export default Applications;