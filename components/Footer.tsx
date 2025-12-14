import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export const Footer: React.FC = () => {
    const navigate = useNavigate();

    return (
        <footer className="bg-green-900 text-white py-12 border-t border-green-800 z-10 relative">
            <div className="max-w-7xl mx-auto px-6 md:px-12">
                {/* AI Disclaimer Banner */}
                <div className="mb-8 pb-8 border-b border-green-800/50">
                    <div className="flex items-start gap-3 max-w-4xl mx-auto">
                        <svg className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div className="text-sm text-green-100/80 leading-relaxed">
                            <p className="font-medium text-green-100 mb-1">AI-Generated Content Disclaimer</p>
                            <p>
                                AutoScape utilizes Google Gemini, an advanced generative AI platform, to create landscape design visualizations and videos.
                                All generated content, including images, design suggestions, and cost estimates, are AI-produced and should be considered as conceptual representations.
                                Actual implementation may vary and should be reviewed by qualified landscape professionals before execution.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Content */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                        <span className="text-xl font-bold tracking-tight">AutoScape</span>
                        <p className="text-sm text-green-100/60 mt-2 font-light max-w-xs">
                            Architectural Artificial Intelligence for the Modern Era.
                        </p>
                    </div>
                    <div className="flex gap-8 text-sm font-light text-green-100/80">
                        <button onClick={() => navigate('/about')} className="hover:text-white transition-colors">Studio</button>
                        <button onClick={() => navigate('/create')} className="hover:text-white transition-colors">Start Project</button>
                        <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
                        <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                    </div>
                    <div className="text-sm text-green-100/60 font-mono">
                        © 2025 AutoScape Inc.
                    </div>
                </div>
            </div>
        </footer>
    );
};
