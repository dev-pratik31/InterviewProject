/**
 * Job Feed Page (Candidate)
 * 
 * Browse available job openings with search functionality.
 */

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { candidateAPI } from '../api/apiClient';

function JobFeed({ showApplications = false }) {
    const location = useLocation();
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
                const res = await candidateAPI.browseJobs({ page, page_size: 10, search: search || undefined });
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'badge-warning';
            case 'reviewing': return 'badge-primary';
            case 'interview_scheduled': return 'badge-success';
            case 'rejected': return 'badge-error';
            case 'hired': return 'badge-success';
            default: return 'badge-primary';
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

    // Applications View
    if (showApplications) {
        return (
            <div className="page animate-fade-in">
                <div className="container">
                    <div className="page-header">
                        <h1 className="page-title">My Applications</h1>
                        <p className="page-subtitle">Track your job applications</p>
                    </div>

                    {applications.length === 0 ? (
                        <div className="card text-center" style={{ padding: 'var(--spacing-2xl)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>📝</div>
                            <h3>No Applications Yet</h3>
                            <p style={{ margin: 'var(--spacing-md) 0' }}>
                                Start applying to jobs to see your applications here.
                            </p>
                            <Link to="/jobs" className="btn btn-primary">
                                Browse Jobs
                            </Link>
                        </div>
                    ) : (
                        <div className="dashboard-grid">
                            {applications.map(app => (
                                <div key={app.id} className="card">
                                    <div className="flex justify-between items-start mb-md">
                                        <div>
                                            <h3 className="card-title">{app.job_title}</h3>
                                            <p style={{ color: 'var(--color-primary-light)', fontSize: '0.875rem', margin: 0 }}>
                                                {app.company_name}
                                            </p>
                                        </div>
                                        <span className={`badge ${getStatusColor(app.status)}`}>
                                            {app.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                        Applied: {new Date(app.created_at).toLocaleDateString()}
                                    </div>
                                    {app.status === 'interview_scheduled' && (
                                        <Link
                                            to={`/applications/${app.id}/schedule`}
                                            className="btn btn-primary btn-sm mt-md"
                                        >
                                            View Interview
                                        </Link>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Jobs View
    return (
        <div className="page animate-fade-in">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">Find Your Next Role</h1>
                    <p className="page-subtitle">Discover opportunities that match your skills</p>
                </div>

                {/* Search */}
                <form onSubmit={handleSearch} className="card mb-lg">
                    <div className="flex gap-md">
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search jobs by title, skills, or keywords..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ flex: 1 }}
                        />
                        <button type="submit" className="btn btn-primary">
                            Search
                        </button>
                    </div>
                </form>

                {/* Job Cards */}
                {jobs.length === 0 ? (
                    <div className="card text-center" style={{ padding: 'var(--spacing-2xl)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>🔍</div>
                        <h3>No Jobs Found</h3>
                        <p>Try adjusting your search or check back later for new opportunities.</p>
                    </div>
                ) : (
                    <div className="dashboard-grid">
                        {jobs.map(job => (
                            <Link key={job.id} to={`/jobs/${job.id}`} style={{ textDecoration: 'none' }}>
                                <div className="job-card">
                                    <div className="job-header">
                                        <div>
                                            <h3 className="job-title">{job.title}</h3>
                                            <p className="job-company">{job.company_name}</p>
                                        </div>
                                    </div>

                                    <div className="job-meta">
                                        <span className="job-meta-item">
                                            📍 {job.location || 'Not specified'}
                                        </span>
                                        <span className="job-meta-item">
                                            💼 {job.experience_required}+ years
                                        </span>
                                        <span className="job-meta-item">
                                            🏠 {job.remote_type}
                                        </span>
                                    </div>

                                    <div className="flex gap-sm mt-md">
                                        <span className="badge badge-primary">{job.employment_type}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {pagination.total_pages > 1 && (
                    <div className="flex justify-center gap-sm mt-lg">
                        <button
                            className="btn btn-secondary btn-sm"
                            disabled={!pagination.has_prev}
                            onClick={() => loadData(pagination.page - 1)}
                        >
                            Previous
                        </button>
                        <span style={{
                            padding: 'var(--spacing-sm) var(--spacing-md)',
                            color: 'var(--color-text-secondary)'
                        }}>
                            Page {pagination.page} of {pagination.total_pages}
                        </span>
                        <button
                            className="btn btn-secondary btn-sm"
                            disabled={!pagination.has_next}
                            onClick={() => loadData(pagination.page + 1)}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default JobFeed;
