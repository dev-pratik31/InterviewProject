/**
 * Applications Page (HR)
 * 
 * View and manage applications for a specific job.
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

    useEffect(() => {
        loadData();
    }, [jobId]);

    const loadData = async (page = 1) => {
        try {
            // Load job details
            const jobRes = await hrAPI.getJob(jobId);
            setJob(jobRes.data);

            // Load applications
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

    return (
        <div className="page animate-fade-in">
            <div className="container">
                {/* Back link */}
                <Link to="/hr/jobs" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                    marginBottom: 'var(--spacing-md)',
                    color: 'var(--color-text-secondary)'
                }}>
                    ← Back to Jobs
                </Link>

                <div className="page-header">
                    <h1 className="page-title">{job?.title}</h1>
                    <p className="page-subtitle">
                        {job?.company_name} • {applications.length} Applications
                    </p>
                </div>

                {/* Job Summary Card */}
                <div className="card mb-lg">
                    <div className="flex gap-lg flex-wrap">
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                                Experience
                            </div>
                            <div style={{ fontWeight: 500 }}>{job?.experience_required}+ years</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                                Location
                            </div>
                            <div style={{ fontWeight: 500 }}>{job?.location || 'Not specified'}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                                Remote
                            </div>
                            <div style={{ fontWeight: 500 }}>{job?.remote_type}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                                Status
                            </div>
                            <span className={`badge ${job?.status === 'published' ? 'badge-success' : 'badge-warning'}`}>
                                {job?.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Applications Table */}
                {applications.length === 0 ? (
                    <div className="card text-center" style={{ padding: 'var(--spacing-2xl)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>📭</div>
                        <h3>No Applications Yet</h3>
                        <p>Applications will appear here once candidates apply to this job.</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Candidate</th>
                                    <th>Email</th>
                                    <th>Applied</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.map(app => (
                                    <tr key={app.id}>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{app.candidate_name || 'Unknown'}</div>
                                            {app.resume_url && (
                                                <a
                                                    href={app.resume_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ fontSize: '0.75rem' }}
                                                >
                                                    View Resume
                                                </a>
                                            )}
                                        </td>
                                        <td style={{ color: 'var(--color-text-secondary)' }}>
                                            {app.candidate_email || '-'}
                                        </td>
                                        <td style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                                            {new Date(app.created_at).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <select
                                                value={app.status}
                                                onChange={(e) => handleStatusChange(app.id, e.target.value)}
                                                className="form-select"
                                                style={{
                                                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                                                    fontSize: '0.75rem',
                                                    minWidth: '140px'
                                                }}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="reviewing">Reviewing</option>
                                                <option value="interview_scheduled">Interview Scheduled</option>
                                                <option value="rejected">Rejected</option>
                                                <option value="hired">Hired</option>
                                            </select>
                                        </td>
                                        <td>
                                            <div className="flex gap-xs">
                                                {app.cover_letter && (
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={() => alert(app.cover_letter)}
                                                    >
                                                        Cover Letter
                                                    </button>
                                                )}
                                                <Link
                                                    to={`/hr/applications/${app.id}/feedback`}
                                                    className="btn btn-primary btn-sm"
                                                >
                                                    View Feedback
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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

export default Applications;
