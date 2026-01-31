/**
 * Create Job Page
 * 
 * Form for HR to create new job postings.
 * Also handles company creation if not exists.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hrAPI, aiAPI } from '../api/apiClient';

function CreateJob() {
    const navigate = useNavigate();
    const [step, setStep] = useState('loading'); // loading, company, job
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(false);
    const [generatingJD, setGeneratingJD] = useState(false);
    const [error, setError] = useState('');

    // Company form
    const [companyData, setCompanyData] = useState({
        name: '',
        industry: '',
        size: '11-50',
        description: '',
        location: '',
        website: '',
    });

    // Job form
    const [jobData, setJobData] = useState({
        title: '',
        description: '',
        experience_required: 0,
        skills_required: '',
        education: '',
        salary_min: '',
        salary_max: '',
        location: '',
        remote_type: 'onsite',
        employment_type: 'full-time',
        status: 'draft',
    });

    useEffect(() => {
        checkCompany();
    }, []);

    const checkCompany = async () => {
        try {
            const res = await hrAPI.getCompany();
            setCompany(res.data);
            setStep('job');
        } catch (err) {
            setStep('company');
        }
    };

    const handleCompanySubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await hrAPI.createCompany(companyData);
            setCompany(res.data);
            setStep('job');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create company');
        } finally {
            setLoading(false);
        }
    };

    // AI Job Description Generator
    const generateAIDescription = async () => {
        if (!jobData.title) {
            setError('Please enter a job title first');
            return;
        }

        setGeneratingJD(true);
        setError('');

        try {
            const skills = jobData.skills_required
                .split(',')
                .map(s => s.trim())
                .filter(s => s);

            const res = await aiAPI.generateJD({
                job_title: jobData.title,
                experience_required: parseInt(jobData.experience_required) || 0,
                industry: company?.industry || 'Technology',
                tech_stack: skills.length > 0 ? skills : null,
                company_name: company?.name,
            });

            // Build description from AI response
            const aiDescription = `${res.data.overview}\n\n**Responsibilities:**\n${res.data.responsibilities.map(r => `• ${r}`).join('\n')}\n\n**Requirements:**\n${res.data.requirements.map(r => `• ${r}`).join('\n')}\n\n**Nice to Have:**\n${res.data.nice_to_have.map(r => `• ${r}`).join('\n')}`;

            setJobData(prev => ({
                ...prev,
                description: aiDescription,
            }));

        } catch (err) {
            setError(err.response?.data?.detail || 'AI generation failed. Is the AI service running?');
        } finally {
            setGeneratingJD(false);
        }
    };

    const handleJobSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const formattedJob = {
                ...jobData,
                skills_required: jobData.skills_required
                    .split(',')
                    .map(s => s.trim())
                    .filter(s => s),
                salary_min: jobData.salary_min ? parseInt(jobData.salary_min) : null,
                salary_max: jobData.salary_max ? parseInt(jobData.salary_max) : null,
                experience_required: parseInt(jobData.experience_required),
            };

            await hrAPI.createJob(formattedJob);
            navigate('/hr/jobs');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create job');
        } finally {
            setLoading(false);
        }
    };

    if (step === 'loading') {
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
            <div className="container" style={{ maxWidth: '720px' }}>
                {/* Company Creation Step */}
                {step === 'company' && (
                    <>
                        <div className="page-header text-center">
                            <h1 className="page-title">Set Up Your Company</h1>
                            <p className="page-subtitle">
                                Create your company profile before posting jobs
                            </p>
                        </div>

                        <div className="card">
                            <form onSubmit={handleCompanySubmit}>
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
                                    <label className="form-label">Company Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={companyData.name}
                                        onChange={e => setCompanyData({ ...companyData, name: e.target.value })}
                                        placeholder="Acme Inc."
                                        required
                                    />
                                </div>

                                <div className="flex gap-md">
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Industry *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={companyData.industry}
                                            onChange={e => setCompanyData({ ...companyData, industry: e.target.value })}
                                            placeholder="Technology"
                                            required
                                        />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Company Size *</label>
                                        <select
                                            className="form-select"
                                            value={companyData.size}
                                            onChange={e => setCompanyData({ ...companyData, size: e.target.value })}
                                        >
                                            <option value="1-10">1-10 employees</option>
                                            <option value="11-50">11-50 employees</option>
                                            <option value="51-200">51-200 employees</option>
                                            <option value="201-1000">201-1000 employees</option>
                                            <option value="1000+">1000+ employees</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-textarea"
                                        value={companyData.description}
                                        onChange={e => setCompanyData({ ...companyData, description: e.target.value })}
                                        placeholder="Tell candidates about your company..."
                                        rows={3}
                                    />
                                </div>

                                <div className="flex gap-md">
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Location</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={companyData.location}
                                            onChange={e => setCompanyData({ ...companyData, location: e.target.value })}
                                            placeholder="San Francisco, CA"
                                        />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Website</label>
                                        <input
                                            type="url"
                                            className="form-input"
                                            value={companyData.website}
                                            onChange={e => setCompanyData({ ...companyData, website: e.target.value })}
                                            placeholder="https://example.com"
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
                                    {loading ? <span className="loading-spinner"></span> : 'Continue to Job Posting'}
                                </button>
                            </form>
                        </div>
                    </>
                )}

                {/* Job Creation Step */}
                {step === 'job' && (
                    <>
                        <div className="page-header">
                            <h1 className="page-title">Create Job Posting</h1>
                            <p className="page-subtitle">
                                {company?.name} • Fill in the details below
                            </p>
                        </div>

                        <div className="card">
                            <form onSubmit={handleJobSubmit}>
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
                                    <label className="form-label">Job Title *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={jobData.title}
                                        onChange={e => setJobData({ ...jobData, title: e.target.value })}
                                        placeholder="Senior Software Engineer"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <div className="flex justify-between items-center mb-xs">
                                        <label className="form-label" style={{ marginBottom: 0 }}>Job Description *</label>
                                        <button
                                            type="button"
                                            className="btn btn-sm"
                                            onClick={generateAIDescription}
                                            disabled={generatingJD || !jobData.title}
                                            style={{
                                                background: 'var(--gradient-primary)',
                                                color: 'white',
                                                fontSize: '0.75rem',
                                                padding: '4px 12px',
                                            }}
                                        >
                                            {generatingJD ? 'Generating...' : 'Generate with AI'}
                                        </button>
                                    </div>
                                    <textarea
                                        className="form-textarea"
                                        value={jobData.description}
                                        onChange={e => setJobData({ ...jobData, description: e.target.value })}
                                        placeholder="Describe the role, responsibilities, and what you're looking for... Or click 'Generate with AI' above!"
                                        rows={8}
                                        required
                                        minLength={50}
                                    />
                                    <small style={{ color: 'var(--color-text-muted)' }}>
                                        Tip: Enter job title and skills first, then use AI to generate a professional description.
                                    </small>
                                </div>

                                <div className="flex gap-md">
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Experience Required (years) *</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={jobData.experience_required}
                                            onChange={e => setJobData({ ...jobData, experience_required: e.target.value })}
                                            min="0"
                                            max="30"
                                            required
                                        />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Education</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={jobData.education}
                                            onChange={e => setJobData({ ...jobData, education: e.target.value })}
                                            placeholder="Bachelor's in CS"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Required Skills</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={jobData.skills_required}
                                        onChange={e => setJobData({ ...jobData, skills_required: e.target.value })}
                                        placeholder="Python, FastAPI, MongoDB (comma separated)"
                                    />
                                </div>

                                <div className="flex gap-md">
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Min Salary</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={jobData.salary_min}
                                            onChange={e => setJobData({ ...jobData, salary_min: e.target.value })}
                                            placeholder="80000"
                                        />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Max Salary</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={jobData.salary_max}
                                            onChange={e => setJobData({ ...jobData, salary_max: e.target.value })}
                                            placeholder="120000"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-md">
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Location</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={jobData.location}
                                            onChange={e => setJobData({ ...jobData, location: e.target.value })}
                                            placeholder="San Francisco, CA"
                                        />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Remote Type</label>
                                        <select
                                            className="form-select"
                                            value={jobData.remote_type}
                                            onChange={e => setJobData({ ...jobData, remote_type: e.target.value })}
                                        >
                                            <option value="onsite">On-site</option>
                                            <option value="remote">Remote</option>
                                            <option value="hybrid">Hybrid</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-md">
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Employment Type</label>
                                        <select
                                            className="form-select"
                                            value={jobData.employment_type}
                                            onChange={e => setJobData({ ...jobData, employment_type: e.target.value })}
                                        >
                                            <option value="full-time">Full-time</option>
                                            <option value="part-time">Part-time</option>
                                            <option value="contract">Contract</option>
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Status</label>
                                        <select
                                            className="form-select"
                                            value={jobData.status}
                                            onChange={e => setJobData({ ...jobData, status: e.target.value })}
                                        >
                                            <option value="draft">Save as Draft</option>
                                            <option value="published">Publish Now</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-md mt-lg">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => navigate('/hr/jobs')}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1 }} disabled={loading}>
                                        {loading ? <span className="loading-spinner"></span> : 'Create Job'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default CreateJob;
