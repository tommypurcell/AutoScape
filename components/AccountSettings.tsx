import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AccountSettingsProps {
    onClose: () => void;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({ onClose }) => {
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleLogout = async () => {
        setLoading(true);
        try {
            await logout();
            onClose();
        } catch (error) {
            console.error('Failed to logout:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">Account Settings</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex flex-col items-center mb-8">
                    {user.photoURL ? (
                        <img src={user.photoURL} alt="Profile" className="w-24 h-24 rounded-full mb-4 border-4 border-emerald-100" />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mb-4 text-emerald-600 text-3xl font-bold">
                            {user.displayName?.[0] || user.email?.[0]?.toUpperCase()}
                        </div>
                    )}
                    <h3 className="text-xl font-bold text-slate-800">{user.displayName || 'User'}</h3>
                    <p className="text-slate-500">{user.email}</p>
                </div>

                <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <h4 className="font-semibold text-slate-700 mb-1">Account Type</h4>
                        <p className="text-sm text-slate-500">Free Plan</p>
                    </div>

                    <button
                        onClick={handleLogout}
                        disabled={loading}
                        className="w-full py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {loading ? 'Signing out...' : 'Sign Out'}
                    </button>
                </div>
            </div>
        </div>
    );
};
