/**
 * Resume Analysis Report Component
 * 
 * Displays the AI-generated resume screening analysis.
 */

function ResumeAnalysisReport({ analysis, score }) {
    if (!analysis) return null;

    const { strengths, gaps, summary, transferable_skills } = analysis;

    return (
        <div className="card animate-fade-in" style={{ marginBottom: 'var(--spacing-lg)' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-lg)',
                borderBottom: '2px solid var(--color-border)',
                paddingBottom: 'var(--spacing-md)'
            }}>
                <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)'
                }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    Resume Analysis
                </h3>
                {score && (
                    <div style={{
                        background: score >= 80 ? '#10b98120' : score >= 60 ? '#f59e0b20' : '#ef444420',
                        color: score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontWeight: 700,
                        fontSize: '0.875rem'
                    }}>
                        Match Score: {score}%
                    </div>
                )}
            </div>

            {/* Summary */}
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h4 style={{
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    color: 'var(--color-text-secondary)',
                    marginBottom: 'var(--spacing-sm)',
                    letterSpacing: '0.05em'
                }}>
                    Executive Summary
                </h4>
                <p style={{
                    fontSize: '1rem',
                    lineHeight: 1.6,
                    color: 'var(--color-text-primary)',
                    background: 'var(--color-bg-secondary)',
                    padding: 'var(--spacing-md)',
                    borderRadius: '8px',
                    borderLeft: '4px solid #667eea'
                }}>
                    {summary}
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--spacing-lg)'
            }}>
                {/* Strengths */}
                <div>
                    <h4 style={{
                        fontSize: '0.875rem',
                        textTransform: 'uppercase',
                        color: '#10b981',
                        marginBottom: 'var(--spacing-md)',
                        letterSpacing: '0.05em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Key Strengths
                    </h4>
                    <ul style={{
                        listStyle: 'none',
                        padding: 0,
                        margin: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--spacing-sm)'
                    }}>
                        {strengths?.map((item, i) => (
                            <li key={i} style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 'var(--spacing-sm)',
                                fontSize: '0.9375rem',
                                color: 'var(--color-text-primary)'
                            }}>
                                <span style={{ color: '#10b981', marginTop: '4px' }}>•</span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Gaps */}
                <div>
                    <h4 style={{
                        fontSize: '0.875rem',
                        textTransform: 'uppercase',
                        color: '#f59e0b',
                        marginBottom: 'var(--spacing-md)',
                        letterSpacing: '0.05em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                        </svg>
                        Potential Gaps
                    </h4>
                    <ul style={{
                        listStyle: 'none',
                        padding: 0,
                        margin: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--spacing-sm)'
                    }}>
                        {gaps?.map((item, i) => (
                            <li key={i} style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 'var(--spacing-sm)',
                                fontSize: '0.9375rem',
                                color: 'var(--color-text-primary)'
                            }}>
                                <span style={{ color: '#f59e0b', marginTop: '4px' }}>•</span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Transferable Skills */}
            {transferable_skills && transferable_skills.length > 0 && (
                <div style={{ marginTop: 'var(--spacing-xl)' }}>
                    <h4 style={{
                        fontSize: '0.875rem',
                        textTransform: 'uppercase',
                        color: '#3b82f6',
                        marginBottom: 'var(--spacing-md)',
                        letterSpacing: '0.05em'
                    }}>
                        Transferable Skills
                    </h4>
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 'var(--spacing-sm)'
                    }}>
                        {transferable_skills.map((skill, i) => (
                            <span key={i} style={{
                                background: '#3b82f615',
                                color: '#3b82f6',
                                padding: '4px 12px',
                                borderRadius: '16px',
                                fontSize: '0.875rem',
                                fontWeight: 500
                            }}>
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ResumeAnalysisReport;
