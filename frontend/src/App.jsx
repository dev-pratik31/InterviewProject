/**
 * App Component
 * 
 * Main application with routing configuration.
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Auth pages
import Login from './auth/Login';
import Register from './auth/Register';

// HR pages
import HRDashboard from './hr/Dashboard';
import CreateJob from './hr/CreateJob';
import JobList from './hr/JobList';
import Applications from './hr/Applications';
import ApplicationFeedback from './hr/ApplicationFeedback';
import JDGenerator from './hr/JDGenerator';

// Candidate pages
import JobFeed from './candidate/JobFeed';
import JobDetail from './candidate/JobDetail';
import Apply from './candidate/Apply';
import ScheduleInterview from './candidate/ScheduleInterview';
import InterviewRoom from './candidate/InterviewRoom';
import InterviewFeedback from './candidate/InterviewFeedback';
import VideoCallInterview from './candidate/VideoCallInterview';

function App() {
    const { isAuthenticated, isHR, isCandidate, loading } = useAuth();

    if (loading) {
        return (
            <div className="auth-page">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    // Determine home redirect based on role
    const getHomeRedirect = () => {
        if (!isAuthenticated) return '/login';
        if (isHR) return '/hr/dashboard';
        if (isCandidate) return '/jobs';
        return '/login';
    };

    return (
        <>
            {isAuthenticated && <Navbar />}

            <Routes>
                {/* Public routes */}
                <Route
                    path="/login"
                    element={
                        isAuthenticated ? <Navigate to={getHomeRedirect()} replace /> : <Login />
                    }
                />
                <Route
                    path="/register"
                    element={
                        isAuthenticated ? <Navigate to={getHomeRedirect()} replace /> : <Register />
                    }
                />

                {/* Demo route for testing video call interview (no auth required) */}
                <Route path="/demo/interview" element={<VideoCallInterview />} />

                {/* HR routes */}
                <Route
                    path="/hr/dashboard"
                    element={
                        <ProtectedRoute allowedRoles={['hr']}>
                            <HRDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/hr/jobs"
                    element={
                        <ProtectedRoute allowedRoles={['hr']}>
                            <JobList />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/hr/jobs/create"
                    element={
                        <ProtectedRoute allowedRoles={['hr']}>
                            <CreateJob />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/hr/generate-jd"
                    element={
                        <ProtectedRoute allowedRoles={['hr']}>
                            <JDGenerator />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/hr/jobs/:jobId/applications"
                    element={
                        <ProtectedRoute allowedRoles={['hr']}>
                            <Applications />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/hr/applications/:applicationId/feedback"
                    element={
                        <ProtectedRoute allowedRoles={['hr']}>
                            <ApplicationFeedback />
                        </ProtectedRoute>
                    }
                />

                {/* Candidate routes */}
                <Route
                    path="/jobs"
                    element={
                        <ProtectedRoute allowedRoles={['candidate']}>
                            <JobFeed />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/jobs/:jobId"
                    element={
                        <ProtectedRoute allowedRoles={['candidate']}>
                            <JobDetail />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/jobs/:jobId/apply"
                    element={
                        <ProtectedRoute allowedRoles={['candidate']}>
                            <Apply />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/applications"
                    element={
                        <ProtectedRoute allowedRoles={['candidate']}>
                            <JobFeed showApplications />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/interviews"
                    element={
                        <ProtectedRoute allowedRoles={['candidate']}>
                            <ScheduleInterview showList />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/applications/:applicationId/schedule"
                    element={
                        <ProtectedRoute allowedRoles={['candidate']}>
                            <ScheduleInterview />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/interview/start/:jobId"
                    element={
                        <ProtectedRoute allowedRoles={['candidate']}>
                            <VideoCallInterview />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/interview/:interviewId"
                    element={
                        <ProtectedRoute allowedRoles={['candidate']}>
                            <VideoCallInterview />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/interview/:interviewId/feedback"
                    element={
                        <ProtectedRoute allowedRoles={['candidate']}>
                            <InterviewFeedback />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/interview/:id/call"
                    element={
                        <ProtectedRoute allowedRoles={['candidate']}>
                            <VideoCallInterview />
                        </ProtectedRoute>
                    }
                />

                {/* Default redirect */}
                <Route path="/" element={<Navigate to={getHomeRedirect()} replace />} />
                <Route path="*" element={<Navigate to={getHomeRedirect()} replace />} />
            </Routes>
        </>
    );
}

export default App;
