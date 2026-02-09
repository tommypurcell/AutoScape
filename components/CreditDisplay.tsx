import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserCredits } from '../services/creditService';
import { useNavigate } from 'react-router-dom';

interface CreditDisplayProps {
  compact?: boolean;
  showLabel?: boolean;
}

export const CreditDisplay: React.FC<CreditDisplayProps> = ({ 
  compact = false, 
  showLabel = true 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCredits = async () => {
      try {
        if (user) {
          const userCredits = await getUserCredits(user.uid);
          setCredits(userCredits.credits);
        } else {
          // For anonymous users, check localStorage
          const anonymousCreditsUsed = parseInt(localStorage.getItem('anonymousCreditsUsed') || '0');
          setCredits(2 - anonymousCreditsUsed); // 2 free credits minus used
        }
      } catch (error) {
        console.error('Error loading credits:', error);
        setCredits(0);
      } finally {
        setLoading(false);
      }
    };

    loadCredits();

    // Refresh credits when user changes
    const handleUserChange = () => loadCredits();
    window.addEventListener('creditsUpdated', handleUserChange);
    
    return () => {
      window.removeEventListener('creditsUpdated', handleUserChange);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-500">
        <div className="w-4 h-4 border-2 border-slate-300 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const isLow = credits !== null && credits <= 1;
  const isZero = credits === 0;

  if (compact) {
    return (
      <button
        onClick={() => navigate('/pricing')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${
          isZero
            ? 'bg-red-50 text-red-600 hover:bg-red-100'
            : isLow
            ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
        }`}
        title={isZero ? 'No credits remaining. Click to purchase.' : `${credits} credit${credits !== 1 ? 's' : ''} remaining`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-bold">{credits}</span>
        {showLabel && <span className="hidden sm:inline">credit{credits !== 1 ? 's' : ''}</span>}
      </button>
    );
  }

  return (
    <div
      onClick={() => navigate('/pricing')}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all ${
        isZero
          ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
          : isLow
          ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
      }`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div className="flex flex-col">
        <span className="text-xs font-medium opacity-75">Credits</span>
        <span className="text-lg font-bold">{credits}</span>
      </div>
      {isZero && (
        <span className="ml-2 text-xs font-medium">Get more →</span>
      )}
    </div>
  );
};
