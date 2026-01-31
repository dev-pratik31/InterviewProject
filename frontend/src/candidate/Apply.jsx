/**
 * Apply Page (Candidate)
 * 
 * Job application form with cover letter.
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { candidateAPI } from '../api/apiClient';

function Apply() {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        cover_letter: '',
        resume_url: '',
    });

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            await candidateAPI.applyToJob({
                job_id: jobId,
                cover_letter: formData.cover_letter || null,
                resume_url: formData.resume_url || null,
            });

            navigate('/applications', {
                state: { message: 'Application submitted successfully!' }
            });
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to submit application');
        } finally {
            setSubmitting(false);
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

    if (!job) {
        return (
            <div className="page">
                <div className="container">
                    <div className="card text-center" style={{ padding: 'var(--spacing-2xl)' }}>
                        <h2>Job Not Found</h2>
                        <Link to="/jobs" className="btn btn-primary mt-md">
                            Browse Jobs
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page animate-fade-in">
            <div className="container" style={{ maxWidth: '720px' }}>
                {/* Back link */}
                <Link to={`/jobs/${jobId}`} style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                    marginBottom: 'var(--spacing-md)',
                    color: 'var(--color-text-secondary)'
                }}>
                    ← Back to Job Details
                </Link>

                <div className="page-header">
                    <h1 className="page-title">Apply for Position</h1>
                    <p className="page-subtitle">
                        {job.title} at {job.company_name}
                    </p>
                </div>

                {/* Job Summary */}
                <div className="card mb-lg">
                    <div className="flex gap-lg flex-wrap">
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                                Position
                            </div>
                            <div style={{ fontWeight: 500 }}>{job.title}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                                Company
                            </div>
                            <div style={{ fontWeight: 500 }}>{job.company_name}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                                Location
                            </div>
                            <div style={{ fontWeight: 500 }}>{job.location || 'Not specified'}</div>
                        </div>
                    </div>
                </div>

                {/* Application Form */}
                <div className="card">
                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div className="form-error mb-md" style={{
                                padding: 'var(--spacing-sm)',
                                background: 'rgba(239, 68, 68, 0.1)',
                                borderRadius: 'var(--radius-md)'
                            }}>
                                {error}
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Cover Letter (Optional)</label>
                            <textarea
                                className="form-textarea"
                                value={formData.cover_letter}
                                onChange={e => setFormData({ ...formData, cover_letter: e.target.value })}
                                placeholder="Tell the hiring manager why you're a great fit for this role..."
                                rows={8}
                            />
                            <small style={{ color: 'var(--color-text-muted)' }}>
                                A good cover letter can significantly increase your chances of getting noticed.
                            </small>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Resume URL (Optional)</label>
                            <input
                                type="url"
                                className="form-input"
                                value={formData.resume_url}
                                onChange={e => setFormData({ ...formData, resume_url: e.target.value })}
                                placeholder="https://example.com/my-resume.pdf"
                            />
                            <small style={{ color: 'var(--color-text-muted)' }}>
                                Link to your resume on Google Drive, Dropbox, or personal website.
                            </small>
                        </div>

                        <div className="flex gap-md mt-lg">
                            <Link to={`/jobs/${jobId}`} className="btn btn-secondary">
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                className="btn btn-primary btn-lg"
                                style={{ flex: 1 }}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <span className="loading-spinner"></span>
                                ) : (
                                    'Submit Application'
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Tips */}
                <div className="card mt-lg" style={{
                    background: 'rgba(99, 102, 241, 0.1)',
                    borderColor: 'var(--color-primary)'
                }}>
                    <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>💡 Application Tips</h4>
                    <ul style={{
                        color: 'var(--color-text-secondary)',
                        paddingLeft: 'var(--spacing-lg)',
                        margin: 0,
                        lineHeight: 1.8
                    }}>
                        <li>Customize your cover letter for this specific role</li>
                        <li>Highlight relevant experience and skills</li>
                        <li>Keep it concise but compelling</li>
                        <li>Proofread before submitting</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default Apply;
