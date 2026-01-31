import React from 'react';
import './BehavioralFeedbackReport.css';

const Section = ({ title, children, className = '' }) => (
    <div className={`feedback-section ${className}`}>
        <h3>{title}</h3>
        {children}
    </div>
);

const ListSection = ({ title, items, icon }) => (
    <Section title={title}>
        <ul className="feedback-list">
            {items?.map((item, index) => (
                <li key={index}>
                    {icon && <span className="list-icon">{icon}</span>}
                    {item}
                </li>
            ))}
        </ul>
    </Section>
);

const BehavioralFeedbackReport = ({ feedback }) => {
    if (!feedback) return null;

    // Destructure with defaults in case of missing data
    const {
        overall_summary,
        communication_signals,
        confidence_signals,
        technical_signals,
        adaptability_signals,
        strengths,
        opportunities,
        role_alignment,
        recommendation
    } = feedback;

    const getRecommendationColor = (rec) => {
        switch (rec?.toLowerCase()) {
            case 'strong fit': return 'rec-success';
            case 'potential fit': return 'rec-warning';
            case 'needs further evaluation': return 'rec-neutral';
            case 'not a fit currently': return 'rec-danger';
            default: return 'rec-neutral';
        }
    };

    return (
        <div className="behavioral-report">
            <div className="report-header">
                <h2>Behavioral Signal Assessment</h2>
                <div className={`recommendation-badge ${getRecommendationColor(recommendation)}`}>
                    {recommendation}
                </div>
            </div>

            <div className="report-grid">
                {/* Full Width Summary */}
                <Section title="Executive Summary" className="full-width summary-box">
                    <p>{overall_summary}</p>
                </Section>

                {/* Signal Analysis Columns */}
                <div className="signal-column">
                    <ListSection
                        title="🗣️ Communication Signals"
                        items={communication_signals}
                    />
                    <ListSection
                        title="🧠 Technical Reasoning"
                        items={technical_signals}
                    />
                </div>

                <div className="signal-column">
                    <ListSection
                        title="⚡ Confidence Patterns"
                        items={confidence_signals}
                    />
                    <ListSection
                        title="🔄 Adaptability & Learning"
                        items={adaptability_signals}
                    />
                </div>

                {/* Strengths & Opportunities */}
                <Section title="Key Strengths" className="strengths-section">
                    <ul className="pill-list success">
                        {strengths?.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                </Section>

                <Section title="Improvement Opportunities" className="opportunities-section">
                    <ul className="pill-list warning">
                        {opportunities?.map((o, i) => <li key={i}>{o}</li>)}
                    </ul>
                </Section>

                {/* Role Alignment */}
                <Section title="Role Alignment" className="full-width alignment-box">
                    <p>{role_alignment}</p>
                </Section>
            </div>
        </div>
    );
};

export default BehavioralFeedbackReport;
