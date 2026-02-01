/**
 * API Client
 * 
 * Centralized Axios instance with interceptors for
 * authentication and error handling.
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Create axios instance
const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear token and redirect to login on auth failure
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ====================================
// Auth API
// ====================================

export const authAPI = {
    register: (data) => apiClient.post('/auth/register', data),
    login: (data) => apiClient.post('/auth/login', data),
    getProfile: () => apiClient.get('/auth/me'),
};

// ====================================
// HR API
// ====================================

export const hrAPI = {
    // Company
    createCompany: (data) => apiClient.post('/hr/company', data),
    getCompany: () => apiClient.get('/hr/company'),
    updateCompany: (data) => apiClient.put('/hr/company', data),

    // Jobs
    createJob: (data) => apiClient.post('/hr/jobs', data),
    getJobs: (params) => apiClient.get('/hr/jobs', { params }),
    getJob: (id) => apiClient.get(`/hr/jobs/${id}`),
    updateJob: (id, data) => apiClient.put(`/hr/jobs/${id}`, data),

    // Applications
    getJobApplications: (jobId, params) =>
        apiClient.get(`/hr/jobs/${jobId}/applications`, { params }),
    getApplication: (applicationId) =>
        apiClient.get(`/hr/applications/${applicationId}`),
    updateApplicationStatus: (applicationId, data) =>
        apiClient.put(`/hr/applications/${applicationId}/status`, data),

    // Interviews
    getInterviews: (params) => apiClient.get('/hr/interviews', { params }),
    updateInterview: (id, data) => apiClient.put(`/hr/interviews/${id}`, data),
};

// ====================================
// Candidate API
// ====================================

export const candidateAPI = {
    // Jobs
    browseJobs: (params) => apiClient.get('/candidate/jobs', { params }),
    getJob: (id) => apiClient.get(`/candidate/jobs/${id}`),

    // Resume
    uploadResume: (formData) => apiClient.post('/candidate/upload-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),

    // Applications
    applyToJob: (jobId, data) => apiClient.post('/candidate/applications', { job_id: jobId, ...data }),
    getMyApplications: (params) => apiClient.get('/candidate/applications', { params }),
    getApplication: (id) => apiClient.get(`/candidate/applications/${id}`),

    // Interviews
    scheduleInterview: (data) => apiClient.post('/candidate/interviews', data),
    getMyInterviews: (params) => apiClient.get('/candidate/interviews', { params }),
    getInterview: (id) => apiClient.get(`/candidate/interviews/${id}`),
};

// ====================================
// AI API
// ====================================

export const aiAPI = {
    // JD Generation
    generateJD: (data) => apiClient.post('/ai/generate-jd', data),

    // Interview - Text based
    startInterview: (data) => apiClient.post('/ai/interview/start', data),
    submitResponse: (data) => apiClient.post('/ai/interview/respond', data),
    getInterviewState: (id) => apiClient.get(`/ai/interview/${id}/state`),
    completeInterview: (id) => apiClient.post(`/ai/interview/${id}/complete`),

    // Interview - Audio based
    startInterviewWithAudio: (data) => apiClient.post('/ai/interview/start-with-audio', data),
    submitAudioResponse: (interviewId, audioBlob) => {
        // DEBUG: Log blob details
        console.log('=== DEBUG submitAudioResponse ===');
        console.log('Blob size:', audioBlob.size);
        console.log('Blob type:', audioBlob.type);

        // Read first few bytes to verify it's valid WebM
        const reader = new FileReader();
        reader.onload = () => {
            const arr = new Uint8Array(reader.result);
            console.log('First 10 bytes:', Array.from(arr.slice(0, 10)).map(b => b.toString(16).padStart(2, '0')).join(' '));
            // Valid WebM starts with: 1a 45 df a3
        };
        reader.readAsArrayBuffer(audioBlob.slice(0, 10));

        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        return apiClient.post(`/ai/interview/${interviewId}/submit-audio`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    transcribeAudio: (audioBlob) => {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        return apiClient.post('/ai/interview/transcribe', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    // Health
    healthCheck: () => apiClient.get('/ai/health'),
};

export default apiClient;
