/**
 * HR Dashboard
 * 
 * Overview page for HR users with stats and quick actions.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { hrAPI } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalJobs: 0,
        publishedJobs: 0,
        totalApplications: 0,
        scheduledInterviews: 0,
    });
    const [company, setCompany] = useState(null);
    const [recentJobs, setRecentJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            // Load company
            try {
                const companyRes = await hrAPI.getCompany();
                setCompany(companyRes.data);
            } catch (err) {
                // Company not created yet
                setCompany(null);
            }

            // Load jobs
            const jobsRes = await hrAPI.getJobs({ page: 1, page_size: 5 });
            const jobs = jobsRes.data.data || [];
            setRecentJobs(jobs);

            setStats({
                totalJobs: jobsRes.data.pagination?.total || 0,
                publishedJobs: jobs.filter(j => j.status === 'published').length,
                totalApplications: jobs.reduce((sum, j) => sum + (j.applications_count || 0), 0),
                scheduledInterviews: 0, // Would need separate API call
            });
        } catch (err) {
            console.error('Failed to load dashboard:', err);
        } finally {
            setLoading(false);
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

    return (
        <div className="page animate-fade-in">
            <div className="container">
                {/* Header */}
                <div className="page-header">
                    <h1 className="page-title">Welcome back, {user?.full_name}!</h1>
                    <p className="page-subtitle">
                        {company ? company.name : 'Set up your company to start hiring'}
                    </p>
                </div>

                {/* Company Setup Alert */}
                {!company && (
                    <div className="card mb-lg" style={{
                        borderColor: 'var(--color-warning)',
                        background: 'rgba(245, 158, 11, 0.1)'
                    }}>
                        <div className="flex items-center gap-md">
                            <span style={{ fontSize: '2rem' }}></span>
                            <div style={{ flex: 1 }}>
                                <h3>Complete Your Profile</h3>
                                <p style={{ margin: 0 }}>Create your company profile to start posting jobs.</p>
                            </div>
                            <Link to="/hr/jobs/create" className="btn btn-primary">
                                Set Up Company
                            </Link>
                        </div>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="dashboard-grid mb-lg">
                    <div className="stat-card">
                        <div className="stat-icon"></div>
                        <div>
                            <div className="stat-value">{stats.totalJobs}</div>
                            <div className="stat-label">Total Jobs</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'var(--gradient-accent)' }}></div>
                        <div>
                            <div className="stat-value">{stats.publishedJobs}</div>
                            <div className="stat-label">Published</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}></div>
                        <div>
                            <div className="stat-value">{stats.totalApplications}</div>
                            <div className="stat-label">Applications</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}></div>
                        <div>
                            <div className="stat-value">{stats.scheduledInterviews}</div>
                            <div className="stat-label">Interviews</div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-md mb-lg">
                    <Link to="/hr/jobs/create" className="btn btn-primary">
                        + Post New Job
                    </Link>
                    <Link to="/hr/jobs" className="btn btn-secondary">
                        View All Jobs
                    </Link>
                </div>

                {/* Recent Jobs */}
                <div className="card">
                    <div className="card-header flex justify-between items-center">
                        <h2 className="card-title">Recent Job Postings</h2>
                        <Link to="/hr/jobs" style={{ fontSize: '0.875rem' }}>View All →</Link>
                    </div>

                    {recentJobs.length === 0 ? (
                        <div className="text-center" style={{ padding: 'var(--spacing-xl)', color: 'var(--color-text-muted)' }}>
                            <p>No jobs posted yet. Create your first job posting!</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Status</th>
                                        <th>Applications</th>
                                        <th>Posted</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentJobs.map(job => (
                                        <tr key={job.id}>
                                            <td>
                                                <Link to={`/hr/jobs/${job.id}/applications`} style={{ fontWeight: 500 }}>
                                                    {job.title}
                                                </Link>
                                            </td>
                                            <td>
                                                <span className={`badge ${job.status === 'published' ? 'badge-success' :
                                                    job.status === 'draft' ? 'badge-warning' : 'badge-error'
                                                    }`}>
                                                    {job.status}
                                                </span>
                                            </td>
                                            <td>{job.applications_count || 0}</td>
                                            <td style={{ color: 'var(--color-text-muted)' }}>
                                                {new Date(job.created_at).toLocaleDateString()}
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

export default Dashboard;
