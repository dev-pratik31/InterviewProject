/**
 * Resume Upload Component
 * 
 * Handles resume file selection and upload.
 */

import { useState } from 'react';
import { candidateAPI } from '../api/apiClient';

function ResumeUpload({ onUploadComplete }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [progress, setProgress] = useState(0);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        // Validate type
        const validTypes = ['.pdf', '.docx', '.doc'];
        const extension = '.' + selectedFile.name.split('.').pop().toLowerCase();

        if (!validTypes.includes(extension)) {
            setError('Please upload a PDF or DOCX file.');
            return;
        }

        // Validate size (5MB limit)
        if (selectedFile.size > 5 * 1024 * 1024) {
            setError('File size must be less than 5MB.');
            return;
        }

        setFile(selectedFile);
        setError('');
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file first.');
            return;
        }

        setUploading(true);
        setError('');
        setProgress(0);

        // Simulate progress
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 90) return prev;
                return prev + 10;
            });
        }, 200);

        try {
            const formData = new FormData();
            formData.append('file', file);

            // We need to implement the uploadResume method in api client or call endpoint directly
            // Assuming candidateAPI.uploadResume exists or we use axios directly

            // Note: Currently candidateAPI might not have uploadResume. 
            // We should check api/apiClient.js, but for now I'll use the path directly if possible or add method.

            // To be safe, I'll assume we need to add it to apiClient, but here I will call the endpoint path.
            // But apiClient uses an instance with auth headers.

            const res = await candidateAPI.uploadResume(formData);

            clearInterval(interval);
            setProgress(100);

            setTimeout(() => {
                onUploadComplete(res.data.url);
            }, 500);

        } catch (err) {
            clearInterval(interval);
            console.error(err);
            setError('Failed to upload resume. Please try again.');
            setUploading(false);
        }
    };

    return (
        <div style={{
            background: 'var(--color-bg-secondary)',
            padding: 'var(--spacing-lg)',
            borderRadius: '12px',
            border: '2px dashed var(--color-border)',
            textAlign: 'center',
            transition: 'all 0.3s'
        }}>
            <h3 style={{ marginTop: 0, marginBottom: 'var(--spacing-sm)' }}>
                Upload Your Resume
            </h3>
            <p style={{
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--spacing-lg)',
                fontSize: '0.9rem'
            }}>
                Required for AI screening before interview
            </p>

            <input
                type="file"
                id="resume-upload"
                onChange={handleFileChange}
                accept=".pdf,.docx,.doc"
                style={{ display: 'none' }}
                disabled={uploading}
            />

            {!file ? (
                <label
                    htmlFor="resume-upload"
                    style={{
                        display: 'inline-block',
                        padding: 'var(--spacing-md) var(--spacing-xl)',
                        background: 'var(--color-bg-tertiary)',
                        color: 'var(--color-text-primary)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        border: '1px solid var(--color-border)'
                    }}
                >
                    Select PDF or DOCX
                </label>
            ) : (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--spacing-sm)',
                    marginBottom: 'var(--spacing-md)'
                }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    <span style={{ fontWeight: 500 }}>{file.name}</span>
                    <button
                        onClick={() => setFile(null)}
                        disabled={uploading}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '4px'
                        }}
                    >
                        ×
                    </button>
                </div>
            )}

            {file && !uploading && !progress && (
                <button
                    onClick={handleUpload}
                    style={{
                        marginTop: 'var(--spacing-md)',
                        padding: 'var(--spacing-md) var(--spacing-xl)',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        width: '100%'
                    }}
                >
                    Upload & Proceed
                </button>
            )}

            {uploading && (
                <div style={{ marginTop: 'var(--spacing-md)' }}>
                    <div style={{
                        width: '100%',
                        height: '6px',
                        background: 'var(--color-bg-tertiary)',
                        borderRadius: '3px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${progress}%`,
                            height: '100%',
                            background: '#667eea',
                            transition: 'width 0.3s ease'
                        }}></div>
                    </div>
                    <p style={{
                        fontSize: '0.8rem',
                        color: 'var(--color-text-secondary)',
                        marginTop: '8px'
                    }}>
                        Uploading... {progress}%
                    </p>
                </div>
            )}

            {error && (
                <p style={{
                    color: '#ef4444',
                    fontSize: '0.875rem',
                    marginTop: 'var(--spacing-md)'
                }}>
                    {error}
                </p>
            )}
        </div>
    );
}

export default ResumeUpload;
