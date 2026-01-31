/**
 * JD Generator Component
 * 
 * AI-powered Job Description generator with ChatGPT-style typing animation.
 * Features split-panel layout, editable notepad, and direct job posting.
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hrAPI, aiAPI } from '../api/apiClient';
import './JDGenerator.css';

function JDGenerator() {
    const navigate = useNavigate();

    // Form inputs
    const [jobRole, setJobRole] = useState('');
    const [experience, setExperience] = useState('');

    // Generation state
    const [viewMode, setViewMode] = useState('input'); // 'input' | 'split'
    const [isGenerating, setIsGenerating] = useState(false);
    const [displayedText, setDisplayedText] = useState('');
    const [fullJD, setFullJD] = useState('');
    const [isComplete, setIsComplete] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editableJD, setEditableJD] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [postSuccess, setPostSuccess] = useState(false);
    const [error, setError] = useState('');

    // Refs
    const typingInterval = useRef(null);
    const notepadRef = useRef(null);
    const textareaRef = useRef(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (typingInterval.current) {
                clearInterval(typingInterval.current);
            }
        };
    }, []);

    // Auto-scroll notepad during typing
    useEffect(() => {
        if (notepadRef.current && !isEditing) {
            notepadRef.current.scrollTop = notepadRef.current.scrollHeight;
        }
    }, [displayedText, isEditing]);

    // Focus textarea when entering edit mode
    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [isEditing]);

    // Typing animation function
    const typeText = (text) => {
        let index = 0;
        setDisplayedText('');

        typingInterval.current = setInterval(() => {
            if (index < text.length) {
                setDisplayedText((prev) => prev + text.charAt(index));
                index++;
            } else {
                clearInterval(typingInterval.current);
                setIsGenerating(false);
                setIsComplete(true);
                setEditableJD(text);
            }
        }, 12); // 12ms per character for smooth typing
    };

    // Generate JD via API or mock
    const handleGenerate = async () => {
        if (!jobRole.trim() || !experience) {
            setError('Please fill in both fields');
            return;
        }

        setError('');
        setViewMode('split');
        setIsGenerating(true);
        setIsComplete(false);
        setIsEditing(false);
        setPostSuccess(false);
        setDisplayedText('');

        try {
            // Try API call first
            const response = await aiAPI.generateJD({
                job_title: jobRole,
                experience_years: parseInt(experience),
            });

            const jdContent = response.data.job_description || response.data.description;
            setFullJD(jdContent);
            typeText(jdContent);
        } catch (err) {
            // Use mock JD for development/demo
            const mockJD = generateMockJD(jobRole, experience);
            setFullJD(mockJD);
            typeText(mockJD);
        }
    };

    // Mock JD generator for development
    const generateMockJD = (role, exp) => {
        return `**Job Title**: ${role}

**Overview**
We are seeking an experienced ${role} with ${exp}+ years of professional experience to join our dynamic team. This role offers the opportunity to work on cutting-edge projects while collaborating with talented professionals in a fast-paced environment.

**Key Responsibilities**
• Lead and execute projects aligned with business objectives
• Collaborate with cross-functional teams to deliver high-quality solutions
• Mentor junior team members and foster a culture of continuous learning
• Drive innovation and implement best practices across the organization
• Participate in technical discussions and contribute to architectural decisions
• Ensure timely delivery of milestones while maintaining quality standards

**Required Skills**
• ${exp}+ years of hands-on experience in a ${role} capacity
• Strong problem-solving abilities and analytical thinking
• Excellent communication and interpersonal skills
• Proven track record of delivering results in a team environment
• Bachelor's degree in a relevant field or equivalent experience
• Proficiency in industry-standard tools and technologies

**Nice-to-Have Skills**
• Experience with agile methodologies and project management
• Prior experience in a leadership or mentorship role
• Familiarity with emerging trends and technologies in the field
• Professional certifications relevant to the role
• Experience working with distributed or remote teams`;
    };

    // Toggle edit mode
    const handleEdit = () => {
        setIsEditing(true);
    };

    // Save edits
    const handleSaveEdit = () => {
        setFullJD(editableJD);
        setDisplayedText(editableJD);
        setIsEditing(false);
    };

    // Cancel editing
    const handleCancelEdit = () => {
        setEditableJD(fullJD);
        setIsEditing(false);
    };

    // Post job directly via API
    const handlePostJob = async () => {
        setIsPosting(true);
        setError('');

        try {
            await hrAPI.createJob({
                title: jobRole,
                description: fullJD,
                experience_required: parseInt(experience),
                employment_type: 'full_time',
                remote_type: 'hybrid',
                status: 'published',
            });

            setPostSuccess(true);

            // Navigate to jobs list after 2 seconds
            setTimeout(() => {
                navigate('/hr/jobs');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to post job. Please try again.');
            setIsPosting(false);
        }
    };

    // Reset to generate new JD
    const handleReset = () => {
        setViewMode('input');
        setJobRole('');
        setExperience('');
        setDisplayedText('');
        setFullJD('');
        setEditableJD('');
        setIsComplete(false);
        setIsGenerating(false);
        setIsEditing(false);
        setPostSuccess(false);
        setError('');
    };

    return (
        <div className={`jd-generator ${viewMode === 'split' ? 'split-view' : ''}`}>
            {/* Left Panel - Input Section */}
            <div className={`jd-input-panel ${viewMode === 'split' ? 'collapsed' : ''}`}>
                <div className="jd-input-content">
                    {viewMode === 'input' && (
                        <div className="jd-header">
                            <h1>Generate Job Description</h1>
                            <p>Let AI create a professional job description in seconds</p>
                        </div>
                    )}

                    <div className="jd-form">
                        {viewMode === 'split' ? (
                            // Read-only display in split view
                            <div className="jd-summary">
                                <div className="summary-item">
                                    <label>Job Role</label>
                                    <div className="summary-value">{jobRole}</div>
                                </div>
                                <div className="summary-item">
                                    <label>Experience</label>
                                    <div className="summary-value">{experience}+ years</div>
                                </div>
                                <button
                                    onClick={handleReset}
                                    className="btn btn-secondary btn-sm"
                                    style={{ marginTop: 'var(--spacing-md)' }}
                                >
                                    Generate New
                                </button>
                            </div>
                        ) : (
                            // Input form in initial view
                            <>
                                <div className="form-group">
                                    <label className="form-label">Job Role</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g., Senior Software Engineer"
                                        value={jobRole}
                                        onChange={(e) => setJobRole(e.target.value)}
                                        disabled={isGenerating}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Years of Experience</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="e.g., 5"
                                        min="0"
                                        max="30"
                                        value={experience}
                                        onChange={(e) => setExperience(e.target.value)}
                                        disabled={isGenerating}
                                    />
                                </div>

                                {error && (
                                    <div className="form-error">{error}</div>
                                )}

                                <button
                                    onClick={handleGenerate}
                                    className="btn btn-primary btn-lg jd-generate-btn"
                                    disabled={isGenerating}
                                >
                                    {isGenerating ? 'Generating...' : 'Generate Job Description'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Panel - Notepad Output */}
            {viewMode === 'split' && (
                <div className="jd-output-panel">
                    <div className="notepad-container">
                        <div className="notepad-header">
                            <span className="notepad-title">
                                {isEditing ? 'Editing Job Description' : 'Job Description'}
                            </span>
                            <div className="notepad-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>

                        <div className="notepad-content" ref={notepadRef}>
                            {isEditing ? (
                                // Editable textarea
                                <textarea
                                    ref={textareaRef}
                                    className="jd-textarea"
                                    value={editableJD}
                                    onChange={(e) => setEditableJD(e.target.value)}
                                />
                            ) : (
                                // Display mode with typing animation
                                <div className="jd-text">
                                    {displayedText.split('\n').map((line, i) => (
                                        <p key={i} className={line.startsWith('**') ? 'jd-heading' : ''}>
                                            {line.replace(/\*\*/g, '')}
                                        </p>
                                    ))}
                                    {isGenerating && <span className="typing-cursor">|</span>}
                                </div>
                            )}
                        </div>

                        {/* Success message */}
                        {postSuccess && (
                            <div className="post-success">
                                Job posted successfully! Redirecting to jobs list...
                            </div>
                        )}

                        {/* Error message */}
                        {error && viewMode === 'split' && (
                            <div className="post-error">{error}</div>
                        )}

                        {/* Action buttons */}
                        {isComplete && !postSuccess && (
                            <div className="notepad-actions">
                                {isEditing ? (
                                    <>
                                        <button onClick={handleCancelEdit} className="btn btn-secondary">
                                            Cancel
                                        </button>
                                        <button onClick={handleSaveEdit} className="btn btn-primary">
                                            Save Changes
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={handleEdit} className="btn btn-secondary">
                                            Edit JD
                                        </button>
                                        <button
                                            onClick={handlePostJob}
                                            className="btn btn-primary"
                                            disabled={isPosting}
                                        >
                                            {isPosting ? 'Posting...' : 'Post Job'}
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default JDGenerator;
