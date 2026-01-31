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
                    <span className="logo-icon">💼</span>
                    <span className="logo-text">Interview Platform</span>
                </Link>

                {/* Navigation Links */}
                <div className="navbar-nav">
                    {isAuthenticated ? (
                        <>
                            {/* HR Navigation */}
                            {isHR && (
                                <>
                                    <Link to="/hr/dashboard" className="nav-link">Dashboard</Link>
                                    <Link to="/hr/jobs" className="nav-link">Jobs</Link>
                                    <Link to="/hr/jobs/create" className="nav-link">Post Job</Link>
                                </>
                            )}

                            {/* Candidate Navigation */}
                            {isCandidate && (
                                <>
                                    <Link to="/jobs" className="nav-link">Browse Jobs</Link>
                                    <Link to="/applications" className="nav-link">My Applications</Link>
                                    <Link to="/interviews" className="nav-link">My Interviews</Link>
                                </>
                            )}

                            {/* User Menu */}
                            <div className="nav-user">
                                <div className="user-info">
                                    <span className="user-name">{user?.full_name}</span>
                                    <span className="user-role badge badge-primary">
                                        {user?.role?.toUpperCase()}
                                    </span>
                                </div>
                                <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                                    Logout
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="nav-link">Login</Link>
                            <Link to="/register" className="btn btn-primary btn-sm">
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
