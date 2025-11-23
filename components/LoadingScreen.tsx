import React, { useEffect, useState } from 'react';

const MESSAGES = [
  "Phase 1: Analyzing yard geometry and features...",
  "Phase 1: Establishing fixed scene boundaries...",
  "Phase 2: Generating photorealistic 3D redesign...",
  "Phase 2: Applying materials and plantings...",
  "Phase 3: Drafting clean 2D plan (orthographic)...",
  "Phase 4: Calculating quantity survey & labor costs...",
];

export const LoadingScreen: React.FC = () => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 4500); // Slightly longer per step to match Pro model latency
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 border-4 border-emerald-100 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 border-t-4 border-emerald-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Designing Your AutoScape</h2>
          <p className="text-slate-500 h-6 transition-all duration-500 font-medium">{MESSAGES[msgIndex]}</p>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full animate-[loading_30s_ease-in-out_infinite]" style={{width: '85%'}}></div>
        </div>
        
        <p className="text-xs text-slate-400">Using Gemini 3 Pro reasoning. This process ensures geometric accuracy.</p>
      </div>
    </div>
  );
};