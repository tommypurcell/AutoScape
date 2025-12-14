/**
 * API Configuration
 * 
 * Centralized configuration for backend API endpoints.
 * Uses environment variables for production deployment.
 */

// RAG Enhancement API - Python backend for plant catalog and budget calculation
export const RAG_API_BASE = import.meta.env.VITE_RAG_API_URL || 'http://localhost:8002';

// Firebase Cloud Functions - Video generation
export const CLOUD_FUNCTIONS_BASE = import.meta.env.VITE_CLOUD_FUNCTIONS_URL ||
    'https://us-central1-autoscape-dfc00.cloudfunctions.net';

// Endpoints
export const API_ENDPOINTS = {
    // RAG Enhancement API
    enhanceWithRag: `${RAG_API_BASE}/api/enhance-with-rag`,
    generateVideoLocal: `${RAG_API_BASE}/api/generate-video`,
    freepikSearch: `${RAG_API_BASE}/api/freepik/search`,
    health: `${RAG_API_BASE}/health`,

    // Cloud Functions (for production)
    generateVideoCloud: `${CLOUD_FUNCTIONS_BASE}/generate_video`,
};

// Use Cloud Functions for video in production, local API for development
export const getVideoEndpoint = () => {
    // If we have a RAG API configured (local dev), use it
    // Otherwise use Cloud Functions (production)
    if (import.meta.env.DEV) {
        return API_ENDPOINTS.generateVideoLocal;
    }
    return API_ENDPOINTS.generateVideoCloud;
};
