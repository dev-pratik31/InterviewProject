/**
 * Navbar Component
 * 
 * Main navigation with role-based menu items and user dropdown.
 */

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

function Navbar() {
    const { user, isAuthenticated, isHR, isCandidate, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="container navbar-container">
                {/* Logo */}
                <Link to="/" className="navbar-logo">
                    <div className="logo-icon">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <rect width="32" height="32" rx="8" fill="url(#gradient)" />
                            <text x="16" y="22" fontSize="18" fontWeight="bold" fill="white" textAnchor="middle">IP</text>
                            <defs>
                                <linearGradient id="gradient" x1="0" y1="0" x2="32" y2="32">
                                    <stop offset="0%" stopColor="#6366f1" />
                                    <stop offset="100%" stopColor="#8b5cf6" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <span className="logo-text">HireHub</span>
                </Link>

                {/* Navigation Links */}
                <div className="navbar-nav">
                    {isAuthenticated ? (
                        <>
                            {/* HR Navigation */}
                            {isHR && (
                                <div className="nav-links">
                                    <Link to="/hr/dashboard" className="nav-link">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="3" width="7" height="7"></rect>
                                            <rect x="14" y="3" width="7" height="7"></rect>
                                            <rect x="14" y="14" width="7" height="7"></rect>
                                            <rect x="3" y="14" width="7" height="7"></rect>
                                        </svg>
                                        Dashboard
                                    </Link>
                                    <Link to="/hr/jobs" className="nav-link">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20 7h-9M14 17H5M17 12H9"></path>
                                        </svg>
                                        Jobs
                                    </Link>
                                    <Link to="/hr/generate-jd" className="nav-link">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 5v14M5 12h14"></path>
                                        </svg>
                                        Generate JD
                                    </Link>
                                    <Link to="/hr/jobs/create" className="nav-link nav-link-primary">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <line x1="12" y1="8" x2="12" y2="16"></line>
                                            <line x1="8" y1="12" x2="16" y2="12"></line>
                                        </svg>
                                        Post Job
                                    </Link>
                                </div>
                            )}

                            {/* Candidate Navigation */}
                            {isCandidate && (
                                <div className="nav-links">
                                    <Link to="/jobs" className="nav-link">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="11" cy="11" r="8"></circle>
                                            <path d="m21 21-4.35-4.35"></path>
                                        </svg>
                                        Browse Jobs
                                    </Link>
                                    <Link to="/applications" className="nav-link">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                        </svg>
                                        My Applications
                                    </Link>
                                    <Link to="/interviews" className="nav-link">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                        </svg>
                                        My Interviews
                                    </Link>
                                </div>
                            )}

                            {/* User Menu */}
                            <div className="nav-user">
                                <div className="user-info">
                                    <div className="user-avatar">
                                        {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                    <div className="user-details">
                                        <span className="user-name">{user?.full_name}</span>
                                        <span className="user-role">
                                            {user?.role?.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                <button onClick={handleLogout} className="btn-logout">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                        <polyline points="16 17 21 12 16 7"></polyline>
                                        <line x1="21" y1="12" x2="9" y2="12"></line>
                                    </svg>
                                    Logout
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="nav-links">
                            <Link to="/login" className="nav-link">Login</Link>
                            <Link to="/register" className="btn-register">
                                Get Started
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;