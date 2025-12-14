import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export const Footer: React.FC = () => {
    const navigate = useNavigate();

    return (
        <footer className="bg-green-900 text-white py-12 border-t border-green-800 z-10 relative">
            <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-8">
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
        </footer>
    );
};
