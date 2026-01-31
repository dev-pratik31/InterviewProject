/**
 * Register Page
 * 
 * New user registration for HR and Candidate roles.
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

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
        setFormError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setFormError('');

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setFormError('Passwords do not match');
            setLoading(false);
            return;
        }

        // Validate password length
        if (formData.password.length < 8) {
            setFormError('Password must be at least 8 characters');
            setLoading(false);
            return;
        }

        const { confirmPassword, ...registerData } = formData;
        const result = await register(registerData);

        if (result.success) {
            // Redirect based on role
            const redirectPath = formData.role === 'hr' ? '/hr/dashboard' : '/jobs';
            navigate(redirectPath, { replace: true });
        } else {
            setFormError(result.error);
        }

        setLoading(false);
    };

    return (
        <div className="auth-page">
            <div className="auth-card animate-fade-in">
                <div className="auth-header">
                    <div className="auth-logo"></div>
                    <h1 className="auth-title">Create Account</h1>
                    <p className="auth-subtitle">Join our hiring platform</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {(formError || error) && (
                        <div className="form-error mb-md" style={{
                            padding: 'var(--spacing-sm)',
                            background: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: 'var(--radius-md)'
                        }}>
                            {formError || error}
                        </div>
                    )}

                    {/* Role Selection */}
                    <div className="form-group">
                        <label className="form-label">I want to</label>
                        <div className="flex gap-md">
                            <label
                                className={`role-option ${formData.role === 'candidate' ? 'active' : ''}`}
                                style={{
                                    flex: 1,
                                    padding: 'var(--spacing-md)',
                                    background: formData.role === 'candidate'
                                        ? 'rgba(255, 165, 0, 0.2)'
                                        : 'var(--color-bg-tertiary)',
                                    border: `1px solid ${formData.role === 'candidate'
                                        ? 'var(--color-primary)'
                                        : 'var(--color-border)'}`,
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    transition: 'all var(--transition-fast)',
                                }}
                            >
                                <input
                                    type="radio"
                                    name="role"
                                    value="candidate"
                                    checked={formData.role === 'candidate'}
                                    onChange={handleChange}
                                    style={{ display: 'none' }}
                                />
                                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Find Jobs</div>
                                <div style={{ fontWeight: 500 }}>Find a Job</div>
                            </label>

                            <label
                                className={`role-option ${formData.role === 'hr' ? 'active' : ''}`}
                                style={{
                                    flex: 1,
                                    padding: 'var(--spacing-md)',
                                    background: formData.role === 'hr'
                                        ? 'rgba(255, 165, 0, 0.2)'
                                        : 'var(--color-bg-tertiary)',
                                    border: `1px solid ${formData.role === 'hr'
                                        ? 'var(--color-primary)'
                                        : 'var(--color-border)'}`,
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    transition: 'all var(--transition-fast)',
                                }}
                            >
                                <input
                                    type="radio"
                                    name="role"
                                    value="hr"
                                    checked={formData.role === 'hr'}
                                    onChange={handleChange}
                                    style={{ display: 'none' }}
                                />
                                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Hire</div>
                                <div style={{ fontWeight: 500 }}>Hire Talent</div>
                            </label>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="full_name" className="form-label">Full Name</label>
                        <input
                            type="text"
                            id="full_name"
                            name="full_name"
                            className="form-input"
                            placeholder="John Doe"
                            value={formData.full_name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email" className="form-label">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className="form-input"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="phone" className="form-label">Phone (Optional)</label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            className="form-input"
                            placeholder="+1 (555) 000-0000"
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="form-label">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            className="form-input"
                            placeholder="Min. 8 characters"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            className="form-input"
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg btn-block"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="loading-spinner"></span>
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Already have an account?{' '}
                        <Link to="/login">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Register;
