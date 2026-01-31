/**
 * AvatarCharacter Component
 * 
 * Animated SVG avatar for the AI interviewer.
 * Supports three states: idle, speaking, listening.
 * Mouth animation driven by amplitude prop.
 */

import { useMemo } from 'react';
import './AvatarCharacter.css';

function AvatarCharacter({ state = 'idle', amplitude = 0, name = 'Aria' }) {
    // Calculate mouth openness based on amplitude (0-1)
    const mouthHeight = useMemo(() => {
        if (state !== 'speaking') return 5;
        return 5 + (amplitude * 20); // 5-25 range
    }, [state, amplitude]);

    // Eye scale for blinking (controlled by CSS animation in idle)
    const eyeScale = state === 'idle' ? 'var(--eye-scale, 1)' : '1';

    return (
        <div className={`avatar-container avatar-${state}`}>
            <svg
                viewBox="0 0 200 200"
                className="avatar-svg"
                aria-label={`AI Interviewer ${name}`}
            >
                {/* Gradient definitions */}
                <defs>
                    <linearGradient id="faceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                    <linearGradient id="highlightGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                    </linearGradient>
                    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.3" />
                    </filter>
                </defs>

                {/* Face circle with gradient */}
                <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="url(#faceGradient)"
                    filter="url(#shadow)"
                />

                {/* Highlight */}
                <ellipse
                    cx="75"
                    cy="70"
                    rx="40"
                    ry="30"
                    fill="url(#highlightGradient)"
                />

                {/* Left eye white */}
                <ellipse
                    cx="70"
                    cy="85"
                    rx="18"
                    ry="20"
                    fill="white"
                    className="eye-white"
                />

                {/* Right eye white */}
                <ellipse
                    cx="130"
                    cy="85"
                    rx="18"
                    ry="20"
                    fill="white"
                    className="eye-white"
                />

                {/* Left pupil */}
                <circle
                    cx="70"
                    cy="88"
                    r="8"
                    fill="#1e293b"
                    className="pupil"
                />

                {/* Right pupil */}
                <circle
                    cx="130"
                    cy="88"
                    r="8"
                    fill="#1e293b"
                    className="pupil"
                />

                {/* Eye shine */}
                <circle cx="73" cy="84" r="3" fill="white" opacity="0.8" />
                <circle cx="133" cy="84" r="3" fill="white" opacity="0.8" />

                {/* Mouth */}
                <ellipse
                    cx="100"
                    cy="135"
                    rx="25"
                    ry={mouthHeight}
                    fill="white"
                    className="mouth"
                />

                {/* Inner mouth (visible when speaking) */}
                {state === 'speaking' && amplitude > 0.2 && (
                    <ellipse
                        cx="100"
                        cy="138"
                        rx="18"
                        ry={mouthHeight * 0.5}
                        fill="#1e293b"
                        opacity="0.3"
                    />
                )}

                {/* Eyebrows */}
                <path
                    d="M52 65 Q70 58 88 65"
                    stroke="#4338ca"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    className="eyebrow"
                />
                <path
                    d="M112 65 Q130 58 148 65"
                    stroke="#4338ca"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    className="eyebrow"
                />
            </svg>

            {/* Name label */}
            <div className="avatar-name">
                <span className="avatar-name-text">{name}</span>
                <span className="avatar-role">AI Interviewer</span>
            </div>

            {/* Status indicator */}
            <div className={`avatar-status avatar-status-${state}`}>
                {state === 'speaking' && (
                    <>
                        <span className="status-dot"></span>
                        Speaking
                    </>
                )}
                {state === 'listening' && (
                    <>
                        <span className="status-dot listening"></span>
                        Listening
                    </>
                )}
            </div>
        </div>
    );
}

export default AvatarCharacter;
