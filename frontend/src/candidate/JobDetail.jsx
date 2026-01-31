/**
 * Job Detail Page (Candidate)
 * 
 * View detailed job information and apply.
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
                        <p>This job posting may have been removed.</p>
                        <Link to="/jobs" className="btn btn-primary mt-md">
                            Browse Other Jobs
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page animate-fade-in">
            <div className="container" style={{ maxWidth: '900px' }}>
                {/* Back link */}
                <Link to="/jobs" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                    marginBottom: 'var(--spacing-md)',
                    color: 'var(--color-text-secondary)'
                }}>
                    ← Back to Jobs
                </Link>

                {/* Header Card */}
                <div className="card mb-lg">
                    <div className="flex justify-between items-start flex-wrap gap-md">
                        <div>
                            <h1 style={{
                                fontSize: '1.75rem',
                                fontWeight: 700,
                                marginBottom: 'var(--spacing-xs)'
                            }}>
                                {job.title}
                            </h1>
                            <p style={{
                                color: 'var(--color-primary-light)',
                                fontSize: '1.1rem',
                                margin: 0
                            }}>
                                {job.company_name}
                            </p>
                        </div>
                        <div className="flex gap-sm">
                            <button
                                onClick={() => setShowScheduleModal(true)}
                                className="btn btn-primary btn-lg"
                            >
                                Apply & Interview
                            </button>
                        </div>
                    </div>

                    {/* Meta badges */}
                    <div className="flex gap-sm flex-wrap mt-lg">
                        <span className="badge badge-primary">{job.location || 'Not specified'}</span>
                        <span className="badge badge-primary">{job.experience_required}+ years</span>
                        <span className="badge badge-primary">{job.remote_type}</span>
                        <span className="badge badge-primary">{job.employment_type}</span>
                    </div>

                    {/* Salary */}
                    {(job.salary_min || job.salary_max) && (
                        <div style={{
                            marginTop: 'var(--spacing-lg)',
                            padding: 'var(--spacing-md)',
                            background: 'rgba(16, 185, 129, 0.1)',
                            borderRadius: 'var(--radius-md)',
                            display: 'inline-block'
                        }}>
                            <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                                💰 ${job.salary_min?.toLocaleString() || '?'} - ${job.salary_max?.toLocaleString() || '?'} {job.salary_currency}
                            </span>
                        </div>
                    )}
                </div>

                {/* Description */}
                <div className="card mb-lg">
                    <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Job Description</h2>
                    <div style={{
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.8,
                        whiteSpace: 'pre-wrap'
                    }}>
                        {job.description}
                    </div>
                </div>

                {/* Requirements */}
                <div className="card mb-lg">
                    <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Requirements</h2>

                    {job.education && (
                        <div className="mb-md">
                            <h4 style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: 'var(--spacing-xs)' }}>
                                EDUCATION
                            </h4>
                            <p style={{ margin: 0 }}>{job.education}</p>
                        </div>
                    )}

                    <div className="mb-md">
                        <h4 style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: 'var(--spacing-xs)' }}>
                            EXPERIENCE
                        </h4>
                        <p style={{ margin: 0 }}>{job.experience_required}+ years of relevant experience</p>
                    </div>

                    {job.skills_required?.length > 0 && (
                        <div>
                            <h4 style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: 'var(--spacing-sm)' }}>
                                SKILLS
                            </h4>
                            <div className="flex gap-sm flex-wrap">
                                {job.skills_required.map((skill, i) => (
                                    <span key={i} className="badge badge-primary">{skill}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats */}
                <div className="card mb-lg">
                    <div className="flex gap-lg">
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                                Views
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{job.views_count}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                                Applicants
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{job.applications_count}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                                Posted
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: 500, marginTop: '4px' }}>
                                {new Date(job.published_at || job.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Apply CTA */}
                <div className="card text-center" style={{
                    background: 'var(--gradient-primary)',
                    border: 'none'
                }}>
                    <h3 style={{ marginBottom: 'var(--spacing-sm)', color: 'white' }}>
                        Ready to Apply?
                    </h3>
                    <p style={{ marginBottom: 'var(--spacing-lg)', color: 'rgba(255,255,255,0.8)' }}>
                        Don't miss this opportunity at {job.company_name}
                    </p>
                    <button
                        onClick={() => setShowScheduleModal(true)}
                        className="btn btn-lg"
                        style={{
                            background: 'white',
                            color: 'var(--color-primary-dark)'
                        }}
                    >
                        Apply & Interview
                    </button>
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

export default JobDetail;
