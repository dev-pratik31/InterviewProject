/**
 * Login Page - Enterprise Redesign
 * 
 * Premium glassmorphism layout with smooth entry animations.
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import './Auth.css';

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

        // Simulate minimum loading time for better UX
        const minLoad = new Promise(resolve => setTimeout(resolve, 800));

        const result = await login(formData.email, formData.password);

        await minLoad;

        if (result.success) {
            navigate(from !== '/' ? from : undefined, { replace: true });
            window.location.reload();
        } else {
            setFormError(result.error);
        }

        setLoading(false);
    };

    return (
        <div className="auth-container">
            {/* Background Atmosphere */}
            <div className="auth-bg-circle circle-1"></div>
            <div className="auth-bg-circle circle-2"></div>

            <motion.div
                className="auth-card-modern"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                <div className="auth-header-modern">
                    <motion.div
                        className="auth-logo-modern"
                        whileHover={{ rotate: 0, scale: 1.05 }}
                    >
                        HH
                    </motion.div>
                    <h1 className="auth-title-modern">Welcome Back</h1>
                    <p className="auth-subtitle-modern">Sign in to your enterprise dashboard</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {(formError || error) && (
                        <motion.div
                            className="form-error mb-md"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            style={{
                                padding: '12px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                borderRadius: '8px',
                                color: '#fca5a5',
                                fontSize: '0.9rem',
                                textAlign: 'center'
                            }}
                        >
                            {formError || error}
                        </motion.div>
                    )}

                    <div className="form-group-modern">
                        <label htmlFor="email" className="form-label-modern">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className="form-input-modern"
                            placeholder="name@company.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group-modern">
                        <label htmlFor="password" className="form-label-modern">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            className="form-input-modern"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-auth"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="loading-spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></span>
                                Signing in...
                            </span>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                <div className="auth-footer-modern">
                    <p>
                        New here?{' '}
                        <Link to="/register" className="auth-link">Create an account</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

export default Login;
