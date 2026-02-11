import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallbackTitle?: string;
    onReset?: () => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary] Caught error:', error);
        console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
        this.setState({ errorInfo });

        // Future: Send to Sentry / LogRocket
        // Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        this.props.onReset?.();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[60vh] flex items-center justify-center px-4">
                    <div className="max-w-lg w-full text-center">
                        {/* Icon */}
                        <div className="mx-auto w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
                            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                                />
                            </svg>
                        </div>

                        <h2 className="text-2xl font-bold text-slate-800 mb-2">
                            {this.props.fallbackTitle || 'Something went wrong'}
                        </h2>
                        <p className="text-slate-500 mb-8">
                            An unexpected error occurred. Don't worry — your data is safe. You can try again or head back to the home page.
                        </p>

                        {/* Error details (collapsed) */}
                        {this.state.error && (
                            <details className="mb-6 text-left bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                                <summary className="px-4 py-3 text-sm text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors font-medium">
                                    Technical details
                                </summary>
                                <div className="px-4 py-3 border-t border-slate-200">
                                    <p className="text-xs text-red-600 font-mono break-all">
                                        {this.state.error.message}
                                    </p>
                                    {this.state.errorInfo?.componentStack && (
                                        <pre className="mt-2 text-xs text-slate-400 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    )}
                                </div>
                            </details>
                        )}

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleRetry}
                                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-emerald-200"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
                            >
                                Go Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
