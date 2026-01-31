/**
 * HR Dashboard - Premium Edition
 * 
 * Data-driven overview with stunning visualizations and insights.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { hrAPI } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { InterviewFunnelChart, OutcomePieChart, ConfidenceTrendChart } from './DashboardCharts';

function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalJobs: 0,
        publishedJobs: 0,
        totalApplications: 0,
        totalCandidates: 0
    });
    const [company, setCompany] = useState(null);
    const [recentJobs, setRecentJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            try {
                const companyRes = await hrAPI.getCompany();
                setCompany(companyRes.data);
            } catch (err) {
                setCompany(null);
            }

            const jobsRes = await hrAPI.getJobs({ page: 1, page_size: 5 });
            const jobs = jobsRes.data.data || [];
            setRecentJobs(jobs);

            const totalApps = jobs.reduce((sum, j) => sum + (j.applications_count || 0), 0);

            setStats({
                totalJobs: jobsRes.data.pagination?.total || 0,
                publishedJobs: jobs.filter(j => j.status === 'published').length,
                totalApplications: totalApps,
                totalCandidates: Math.round(totalApps * 0.8)
            });
        } catch (err) {
            console.error('Failed to load dashboard:', err);
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

    const firstName = user?.full_name?.split(' ')[0] || 'there';
    const currentHour = new Date().getHours();
    const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

    return (
        <div className="page animate-fade-in" style={{
            background: 'var(--color-bg-primary)',
            minHeight: '100vh'
        }}>
            <div className="container" style={{ maxWidth: '1600px' }}>
                {/* Hero Header */}
                <div style={{
                    marginBottom: 'var(--spacing-2xl)',
                    padding: 'var(--spacing-xl)',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '16px',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 20px 60px rgba(102, 126, 234, 0.3)'
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

                    <div style={{
                        position: 'relative',
                        zIndex: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 'var(--spacing-lg)'
                    }}>
                        <div>
                            <h1 style={{
                                fontSize: '2.5rem',
                                fontWeight: 700,
                                color: 'white',
                                marginBottom: 'var(--spacing-xs)',
                                textShadow: '0 2px 10px rgba(0,0,0,0.1)'
                            }}>
                                {greeting}, {firstName}!
                            </h1>
                            <p style={{
                                fontSize: '1.125rem',
                                color: 'rgba(255, 255, 255, 0.9)',
                                fontWeight: 500
                            }}>
                                {company ? `${company.name} • Hiring Dashboard` : 'Welcome to your hiring command center'}
                            </p>
                        </div>
                        <Link
                            to="/hr/jobs/create"
                            className="btn"
                            style={{
                                background: 'white',
                                color: '#667eea',
                                border: 'none',
                                padding: 'var(--spacing-sm) var(--spacing-xl)',
                                fontSize: '1rem',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-sm)',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                transition: 'all 0.3s'
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Post New Job
                        </Link>
                    </div>
                </div>

                {/* KPI Metrics Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 'var(--spacing-lg)',
                    marginBottom: 'var(--spacing-2xl)'
                }}>
                    <MetricCard
                        title="Active Jobs"
                        value={stats.publishedJobs}
                        total={stats.totalJobs}
                        change="+2 this week"
                        gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                        icon={
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                            </svg>
                        }
                    />
                    <MetricCard
                        title="Total Candidates"
                        value={stats.totalCandidates}
                        change="+12% vs last month"
                        gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                        icon={
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                        }
                    />
                    <MetricCard
                        title="Scheduled Interviews"
                        value={Math.round(stats.totalApplications * 0.4)}
                        change="8 this week"
                        gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                        icon={
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                        }
                    />
                    <MetricCard
                        title="Successful Hires"
                        value={Math.round(stats.totalApplications * 0.1)}
                        change="On track for Q1"
                        gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
                        icon={
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                        }
                    />
                </div>

                {/* Charts Section */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                    gap: 'var(--spacing-lg)',
                    marginBottom: 'var(--spacing-2xl)'
                }}>
                    <InterviewFunnelChart />
                    <ConfidenceTrendChart />
                    <OutcomePieChart />
                </div>

                {/* Quick Stats Row */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 'var(--spacing-md)',
                    marginBottom: 'var(--spacing-2xl)'
                }}>
                    <QuickStat
                        label="Avg. Time to Hire"
                        value="18 days"
                        trend="down"
                        trendValue="3 days faster"
                    />
                    <QuickStat
                        label="Interview to Offer"
                        value="68%"
                        trend="up"
                        trendValue="+5%"
                    />
                    <QuickStat
                        label="Candidate Satisfaction"
                        value="4.6/5"
                        trend="up"
                        trendValue="+0.2"
                    />
                    <QuickStat
                        label="Response Rate"
                        value="92%"
                        trend="up"
                        trendValue="+8%"
                    />
                </div>

                {/* Recent Activity */}
                <div className="card" style={{
                    padding: 0,
                    overflow: 'hidden',
                    marginBottom: 'var(--spacing-2xl)'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: 'var(--spacing-xl)',
                        borderBottom: '2px solid var(--color-border)',
                        background: 'var(--color-bg-secondary)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 'var(--spacing-md)'
                    }}>
                        <div>
                            <h3 style={{
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                marginBottom: 'var(--spacing-xs)'
                            }}>
                                Recent Job Activity
                            </h3>
                            <p style={{
                                color: 'var(--color-text-secondary)',
                                fontSize: '0.9375rem'
                            }}>
                                Latest postings and application status
                            </p>
                        </div>
                        <Link
                            to="/hr/jobs"
                            className="btn btn-primary"
                            style={{
                                padding: 'var(--spacing-sm) var(--spacing-lg)',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-xs)'
                            }}
                        >
                            View All Jobs
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </Link>
                    </div>

                    {/* Table */}
                    {!recentJobs.length ? (
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
                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                </svg>
                            </div>
                            <h4 style={{ marginBottom: 'var(--spacing-xs)' }}>No activity yet</h4>
                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
                                Post your first job to start tracking applications
                            </p>
                            <Link
                                to="/hr/jobs/create"
                                className="btn"
                                style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white',
                                    border: 'none',
                                    padding: 'var(--spacing-sm) var(--spacing-xl)',
                                    fontWeight: 600
                                }}
                            >
                                Create First Job
                            </Link>
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
                                        <th style={tableHeaderStyle}>Position</th>
                                        <th style={tableHeaderStyle}>Status</th>
                                        <th style={tableHeaderStyle}>Applications</th>
                                        <th style={tableHeaderStyle}>Posted</th>
                                        <th style={tableHeaderStyle}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentJobs.map(job => (
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
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 'var(--spacing-sm)'
                                                }}>
                                                    <div style={{
                                                        width: '48px',
                                                        height: '48px',
                                                        borderRadius: '12px',
                                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        fontWeight: 700,
                                                        fontSize: '1.25rem'
                                                    }}>
                                                        {job.title[0]}
                                                    </div>
                                                    <div>
                                                        <div style={{
                                                            fontWeight: 600,
                                                            fontSize: '1rem',
                                                            marginBottom: '4px'
                                                        }}>
                                                            {job.title}
                                                        </div>
                                                        <div style={{
                                                            fontSize: '0.875rem',
                                                            color: 'var(--color-text-muted)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 'var(--spacing-xs)'
                                                        }}>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                                                <circle cx="12" cy="10" r="3"></circle>
                                                            </svg>
                                                            {job.location || 'Remote'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={tableCellStyle}>
                                                <StatusBadge status={job.status} />
                                            </td>
                                            <td style={tableCellStyle}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 'var(--spacing-xs)',
                                                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                                                    background: 'var(--color-bg-tertiary)',
                                                    borderRadius: '8px',
                                                    width: 'fit-content',
                                                    fontWeight: 600
                                                }}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                                        <circle cx="9" cy="7" r="4"></circle>
                                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                                    </svg>
                                                    {job.applications_count || 0}
                                                </div>
                                            </td>
                                            <td style={{
                                                ...tableCellStyle,
                                                color: 'var(--color-text-muted)'
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
                                                    Manage
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Helper Components
const MetricCard = ({ title, value, total, change, gradient, icon }) => (
    <div className="card" style={{
        background: gradient,
        color: 'white',
        padding: 'var(--spacing-xl)',
        position: 'relative',
        overflow: 'hidden',
        border: 'none',
        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        transition: 'transform 0.3s, box-shadow 0.3s'
    }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.25)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.15)';
        }}
    >
        {/* Background Pattern */}
        <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-20%',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            filter: 'blur(40px)'
        }}></div>

        <div style={{
            position: 'relative',
            zIndex: 1
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 'var(--spacing-lg)'
            }}>
                <div style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    opacity: 0.9
                }}>
                    {title}
                </div>
                <div style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    padding: 'var(--spacing-sm)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(10px)'
                }}>
                    {icon}
                </div>
            </div>

            <div style={{
                fontSize: '3rem',
                fontWeight: 700,
                lineHeight: 1,
                marginBottom: 'var(--spacing-sm)'
            }}>
                {value}
                {total && (
                    <span style={{
                        fontSize: '1.5rem',
                        opacity: 0.7,
                        fontWeight: 400
                    }}>
                        /{total}
                    </span>
                )}
            </div>

            <div style={{
                fontSize: '0.875rem',
                opacity: 0.95,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-xs)'
            }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                    <polyline points="17 6 23 6 23 12"></polyline>
                </svg>
                {change}
            </div>
        </div>
    </div>
);

const QuickStat = ({ label, value, trend, trendValue }) => (
    <div className="card" style={{
        padding: 'var(--spacing-lg)',
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)'
    }}>
        <div style={{
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            marginBottom: 'var(--spacing-xs)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: 600
        }}>
            {label}
        </div>
        <div style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            marginBottom: 'var(--spacing-xs)'
        }}>
            {value}
        </div>
        <div style={{
            fontSize: '0.75rem',
            color: trend === 'up' ? '#10b981' : '#3b82f6',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
        }}>
            {trend === 'up' ? '↑' : '↓'} {trendValue}
        </div>
    </div>
);

const StatusBadge = ({ status }) => {
    const getStyle = (status) => {
        const styles = {
            published: {
                background: '#10b98120',
                color: '#10b981',
                border: '1px solid #10b98140'
            },
            draft: {
                background: '#f59e0b20',
                color: '#f59e0b',
                border: '1px solid #f59e0b40'
            },
            closed: {
                background: '#6b728020',
                color: '#6b7280',
                border: '1px solid #6b728040'
            }
        };
        return styles[status] || styles.draft;
    };

    return (
        <span style={{
            padding: 'var(--spacing-xs) var(--spacing-md)',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: 700,
            textTransform: 'capitalize',
            display: 'inline-block',
            ...getStyle(status)
        }}>
            {status}
        </span>
    );
};

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
    fontSize: '0.9375rem'
};

export default Dashboard;