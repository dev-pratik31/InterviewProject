/**
 * Register Page - Matching Login Style
 * 
 * Two-column layout, non-scrollable, beautiful registration experience.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Register() {
    const { register, error } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        full_name: '',
        role: 'candidate',
        phone: '',
    });
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [passwordStrength, setPasswordStrength] = useState(0);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setFormError('');

        if (name === 'password') {
            calculatePasswordStrength(value);
        }
    };

    const calculatePasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength += 25;
        if (password.length >= 12) strength += 25;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
        if (/\d/.test(password)) strength += 15;
        if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
        setPasswordStrength(Math.min(strength, 100));
    };

    const getPasswordStrengthColor = () => {
        if (passwordStrength < 40) return '#ef4444';
        if (passwordStrength < 70) return '#f59e0b';
        return '#10b981';
    };

    const getPasswordStrengthLabel = () => {
        if (passwordStrength < 40) return 'Weak';
        if (passwordStrength < 70) return 'Medium';
        return 'Strong';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setFormError('');

        if (formData.password !== formData.confirmPassword) {
            setFormError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (formData.password.length < 8) {
            setFormError('Password must be at least 8 characters');
            setLoading(false);
            return;
        }

        const { confirmPassword, ...registerData } = formData;
        const result = await register(registerData);

        if (result.success) {
            const redirectPath = formData.role === 'hr' ? '/hr/dashboard' : '/jobs';
            navigate(redirectPath, { replace: true });
        } else {
            setFormError(result.error);
        }

        setLoading(false);
    };

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            height: '100vh',
            overflow: 'hidden'
        }}>
            {/* Left Side - Branding */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: 'var(--spacing-2xl)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Background Pattern */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    opacity: 0.1,
                    backgroundImage: 'radial-gradient(circle at 20px 20px, white 2px, transparent 0)',
                    backgroundSize: '40px 40px'
                }}></div>

                {/* Floating Orbs */}
                <div style={{
                    position: 'absolute',
                    top: '20%',
                    left: '20%',
                    width: '300px',
                    height: '300px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    filter: 'blur(60px)'
                }}></div>

                {/* Content */}
                <div style={{
                    position: 'relative',
                    zIndex: 1,
                    textAlign: 'center',
                    maxWidth: '500px'
                }}>
                    {/* Logo */}
                    <div style={{
                        width: '100px',
                        height: '100px',
                        margin: '0 auto var(--spacing-xl)',
                        background: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(10px)',
                        border: '2px solid rgba(255, 255, 255, 0.3)'
                    }}>
                        <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </div>

                    <h1 style={{
                        fontSize: '3rem',
                        fontWeight: 700,
                        color: 'white',
                        marginBottom: 'var(--spacing-md)',
                        textShadow: '0 2px 20px rgba(0,0,0,0.1)'
                    }}>
                        Join Our Platform
                    </h1>
                    <p style={{
                        fontSize: '1.25rem',
                        color: 'rgba(255, 255, 255, 0.9)',
                        lineHeight: 1.6,
                        marginBottom: 'var(--spacing-xl)'
                    }}>
                        Connect with top talent or find your dream job. Start your journey today.
                    </p>

                    {/* Features */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--spacing-md)',
                        textAlign: 'left'
                    }}>
                        <Feature
                            icon={
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            }
                            text="AI-powered candidate matching"
                        />
                        <Feature
                            icon={
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            }
                            text="Smart interview scheduling"
                        />
                        <Feature
                            icon={
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            }
                            text="Real-time collaboration tools"
                        />
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div style={{
                background: 'var(--color-bg-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--spacing-xl)',
                overflowY: 'auto'
            }}>
                <div style={{
                    width: '100%',
                    maxWidth: '440px'
                }}>
                    <div style={{
                        marginBottom: 'var(--spacing-xl)'
                    }}>
                        <h2 style={{
                            fontSize: '2rem',
                            fontWeight: 700,
                            marginBottom: 'var(--spacing-xs)',
                            color: 'var(--color-text-primary)'
                        }}>
                            Create Account
                        </h2>
                        <p style={{
                            color: 'var(--color-text-secondary)',
                            fontSize: '1rem'
                        }}>
                            Fill in your details to get started
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Error Message */}
                        {(formError || error) && (
                            <div style={{
                                padding: 'var(--spacing-md)',
                                background: '#ef444410',
                                border: '1px solid #ef444440',
                                borderRadius: '12px',
                                marginBottom: 'var(--spacing-md)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-sm)',
                                color: '#ef4444',
                                fontSize: '0.875rem'
                            }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                                {formError || error}
                            </div>
                        )}

                        {/* Role Selection */}
                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                marginBottom: 'var(--spacing-sm)',
                                color: 'var(--color-text-primary)'
                            }}>
                                I want to
                            </label>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: 'var(--spacing-sm)'
                            }}>
                                <RoleOption
                                    selected={formData.role === 'candidate'}
                                    onClick={() => setFormData(prev => ({ ...prev, role: 'candidate' }))}
                                    label="Find Jobs"
                                />
                                <RoleOption
                                    selected={formData.role === 'hr'}
                                    onClick={() => setFormData(prev => ({ ...prev, role: 'hr' }))}
                                    label="Hire Talent"
                                />
                            </div>
                        </div>

                        {/* Full Name */}
                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                marginBottom: 'var(--spacing-sm)',
                                color: 'var(--color-text-primary)'
                            }}>
                                Full Name
                            </label>
                            <input
                                type="text"
                                name="full_name"
                                placeholder="John Doe"
                                value={formData.full_name}
                                onChange={handleChange}
                                required
                                style={inputStyle}
                            />
                        </div>

                        {/* Email */}
                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                marginBottom: 'var(--spacing-sm)',
                                color: 'var(--color-text-primary)'
                            }}>
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                style={inputStyle}
                            />
                        </div>

                        {/* Phone */}
                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                marginBottom: 'var(--spacing-sm)',
                                color: 'var(--color-text-primary)'
                            }}>
                                Phone (Optional)
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                placeholder="+1 (555) 000-0000"
                                value={formData.phone}
                                onChange={handleChange}
                                style={inputStyle}
                            />
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                marginBottom: 'var(--spacing-sm)',
                                color: 'var(--color-text-primary)'
                            }}>
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                placeholder="Min. 8 characters"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                style={inputStyle}
                            />
                            {/* Password Strength */}
                            {formData.password && (
                                <div style={{ marginTop: 'var(--spacing-xs)' }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: '4px'
                                    }}>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--color-text-muted)'
                                        }}>
                                            Strength
                                        </span>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            color: getPasswordStrengthColor()
                                        }}>
                                            {getPasswordStrengthLabel()}
                                        </span>
                                    </div>
                                    <div style={{
                                        height: '3px',
                                        background: 'var(--color-bg-tertiary)',
                                        borderRadius: '2px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${passwordStrength}%`,
                                            background: getPasswordStrengthColor(),
                                            transition: 'all 0.3s ease'
                                        }}></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                marginBottom: 'var(--spacing-sm)',
                                color: 'var(--color-text-primary)'
                            }}>
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="Re-enter password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                style={inputStyle}
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: 'var(--spacing-md)',
                                background: loading
                                    ? 'var(--color-bg-tertiary)'
                                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '1rem',
                                fontWeight: 700,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s',
                                boxShadow: loading ? 'none' : '0 4px 20px rgba(102, 126, 234, 0.3)',
                                marginBottom: 'var(--spacing-lg)'
                            }}
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>

                        {/* Sign In Link */}
                        <div style={{
                            textAlign: 'center'
                        }}>
                            <p style={{
                                color: 'var(--color-text-secondary)',
                                fontSize: '0.9375rem'
                            }}>
                                Already have an account?{' '}
                                <Link
                                    to="/login"
                                    style={{
                                        color: '#667eea',
                                        fontWeight: 600,
                                        textDecoration: 'none'
                                    }}
                                >
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

// Helper Components
const Feature = ({ icon, text }) => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-sm)',
        padding: 'var(--spacing-sm)',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)'
    }}>
        <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
        }}>
            {icon}
        </div>
        <span style={{
            color: 'white',
            fontSize: '1rem',
            fontWeight: 500
        }}>
            {text}
        </span>
    </div>
);

const RoleOption = ({ selected, onClick, label }) => (
    <button
        type="button"
        onClick={onClick}
        style={{
            padding: 'var(--spacing-sm)',
            background: selected ? '#667eea15' : 'var(--color-bg-secondary)',
            border: `2px solid ${selected ? '#667eea' : 'var(--color-border)'}`,
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            textAlign: 'center',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: selected ? '#667eea' : 'var(--color-text-primary)'
        }}
    >
        {label}
    </button>
);

const inputStyle = {
    width: '100%',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    background: 'var(--color-bg-secondary)',
    border: '2px solid var(--color-border)',
    borderRadius: '10px',
    fontSize: '0.9375rem',
    color: 'var(--color-text-primary)',
    transition: 'all 0.2s',
    outline: 'none'
};

export default Register;