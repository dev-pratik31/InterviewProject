/**
 * Job List Page (HR)
 * 
 * View and manage all job postings.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { hrAPI } from '../api/apiClient';

function JobList() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({});

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
                <div className="page-header flex justify-between items-center">
                    <div>
                        <h1 className="page-title">Job Postings</h1>
                        <p className="page-subtitle">Manage your open positions</p>
                    </div>
                    <Link to="/hr/jobs/create" className="btn btn-primary">
                        + Create New Job
                    </Link>
                </div>

                {jobs.length === 0 ? (
                    <div className="card text-center" style={{ padding: 'var(--spacing-2xl)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}></div>
                        <h3>No Jobs Posted Yet</h3>
                        <p style={{ margin: 'var(--spacing-md) 0' }}>
                            Create your first job posting to start receiving applications.
                        </p>
                        <Link to="/hr/jobs/create" className="btn btn-primary">
                            Create Your First Job
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Job Title</th>
                                        <th>Location</th>
                                        <th>Type</th>
                                        <th>Status</th>
                                        <th>Applications</th>
                                        <th>Posted</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {jobs.map(job => (
                                        <tr key={job.id}>
                                            <td>
                                                <div style={{ fontWeight: 500 }}>{job.title}</div>
                                                <div style={{
                                                    fontSize: '0.75rem',
                                                    color: 'var(--color-text-muted)',
                                                    marginTop: '2px'
                                                }}>
                                                    {job.experience_required}+ years exp
                                                </div>
                                            </td>
                                            <td>{job.location || 'Not specified'}</td>
                                            <td>
                                                <span className="badge badge-primary">{job.remote_type}</span>
                                            </td>
                                            <td>
                                                <select
                                                    value={job.status}
                                                    onChange={(e) => handleStatusChange(job.id, e.target.value)}
                                                    className="form-select"
                                                    style={{
                                                        padding: 'var(--spacing-xs) var(--spacing-sm)',
                                                        background: job.status === 'published'
                                                            ? 'rgba(16, 185, 129, 0.2)'
                                                            : job.status === 'draft'
                                                                ? 'rgba(245, 158, 11, 0.2)'
                                                                : 'rgba(239, 68, 68, 0.2)',
                                                        border: 'none',
                                                        fontSize: '0.75rem',
                                                    }}
                                                >
                                                    <option value="draft">Draft</option>
                                                    <option value="published">Published</option>
                                                    <option value="closed">Closed</option>
                                                </select>
                                            </td>
                                            <td>
                                                <Link
                                                    to={`/hr/jobs/${job.id}/applications`}
                                                    className="badge badge-success"
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    {job.applications_count || 0} applications
                                                </Link>
                                            </td>
                                            <td style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                                                {new Date(job.created_at).toLocaleDateString()}
                                            </td>
                                            <td>
                                                <Link
                                                    to={`/hr/jobs/${job.id}/applications`}
                                                    className="btn btn-secondary btn-sm"
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination.total_pages > 1 && (
                            <div className="flex justify-center gap-sm mt-lg">
                                <button
                                    className="btn btn-secondary btn-sm"
                                    disabled={!pagination.has_prev}
                                    onClick={() => loadJobs(pagination.page - 1)}
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
                                    onClick={() => loadJobs(pagination.page + 1)}
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

export default JobList;
