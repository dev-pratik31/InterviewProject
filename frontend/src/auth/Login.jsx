/**
 * Login Page
 * 
 * User authentication with email/password.
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
    const { login, error } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState('');

    const from = location.state?.from?.pathname || '/';

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

        const result = await login(formData.email, formData.password);

        if (result.success) {
            // Navigate to intended destination or role-based default
            navigate(from !== '/' ? from : undefined, { replace: true });
            // Let the App component handle role-based redirect
            window.location.reload();
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
                    <h1 className="auth-title">Welcome Back</h1>
                    <p className="auth-subtitle">Sign in to your account</p>
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
                        <label htmlFor="password" className="form-label">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={formData.password}
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
                            'Sign In'
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Don't have an account?{' '}
                        <Link to="/register">Create one</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;
