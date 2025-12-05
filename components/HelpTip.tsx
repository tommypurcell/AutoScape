import React, { useState } from 'react';

interface HelpTipProps {
    content: string;
    className?: string;
}

export const HelpTip: React.FC<HelpTipProps> = ({ content, className = '' }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            className={`relative inline-block ${className}`}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            <button
                className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 hover:bg-emerald-100 hover:text-emerald-600 flex items-center justify-center text-xs font-bold transition-colors cursor-help"
                aria-label="More information"
            >
                ?
            </button>

            {isVisible && (
                <div className="absolute z-50 w-64 p-3 mt-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-xl shadow-xl -translate-x-1/2 left-1/2 animate-fade-in">
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-t border-l border-slate-200 transform rotate-45"></div>
                    <div className="relative z-10">
                        {content}
                    </div>
                </div>
            )}
        </div>
    );
};
