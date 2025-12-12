import { X, History, Menu, Settings, LogOut, Plus, Trash2, ChevronRight, Globe, Shield, FileText } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserDesigns, deleteDesign, SavedDesign } from '../services/firestoreService';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onNewDesign: () => void;
    onLoadDesign: (design: SavedDesign) => void;
    onOpenSettings: () => void;
    onLogin: () => void;
    onNavigate: (action: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    isOpen,
    onClose,
    onNewDesign,
    onLoadDesign,
    onOpenSettings,
    onLogin,
    onNavigate
}) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [designs, setDesigns] = useState<SavedDesign[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'menu' | 'history'>('menu');

    useEffect(() => {
        if (isOpen && user && activeTab === 'history') {
            loadDesigns();
        }
    }, [isOpen, user, activeTab]);

    const loadDesigns = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const userDesigns = await getUserDesigns(user.uid);
            setDesigns(userDesigns);
        } catch (error) {
            console.error('Failed to load designs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (designId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Delete this design?')) return;
        try {
            await deleteDesign(designId);
            setDesigns(designs.filter(d => d.id !== designId));
        } catch (error) {
            console.error('Failed to delete design:', error);
        }
    };

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    onClick={onClose}
                    className="fixed inset-0 bg-black/30 z-40 animate-fade-in backdrop-blur-sm"
                />
            )}

            {/* Sidebar Panel */}
            <div
                className={`fixed inset-y-0 left-0 w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <span className="font-bold text-xl text-slate-800">AutoScape</span>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* User Profile / Login */}
                    {user ? (
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors" onClick={onOpenSettings}>
                            {user.photoURL ? (
                                <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                                    {user.displayName?.[0] || user.email?.[0]?.toUpperCase()}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-800 truncate">{user.displayName || 'User'}</p>
                                <p className="text-xs text-slate-500 truncate">{user.email}</p>
                            </div>
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                    ) : (
                        <button
                            onClick={onLogin}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                            Sign In
                        </button>
                    )}
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b border-slate-100">
                    <button
                        onClick={() => setActiveTab('menu')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'menu'
                            ? 'text-emerald-600 border-b-2 border-emerald-600'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Menu
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'history'
                            ? 'text-emerald-600 border-b-2 border-emerald-600'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        History
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4">
                    {activeTab === 'menu' ? (
                        <div className="space-y-2">
                            <button
                                onClick={() => {
                                    onNavigate('new');
                                    onClose();
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-colors group"
                            >
                                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 group-hover:bg-emerald-200 transition-colors">
                                    <Plus className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <div className="font-semibold">New Design</div>
                                    <div className="text-xs text-slate-400">Start from scratch</div>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    onNavigate('gallery');
                                    onClose();
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors group"
                            >
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-200 transition-colors">
                                    <Globe className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <div className="font-semibold">Community Gallery</div>
                                    <div className="text-xs text-slate-400">Explore other designs</div>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    setActiveTab('history');
                                }}
                                className="w-full p-4 hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-colors flex items-center gap-3"
                            >
                                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                Design History
                            </button>

                            {user && (
                                <button
                                    onClick={onOpenSettings}
                                    className="w-full p-4 hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-colors flex items-center gap-3"
                                >
                                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    Settings
                                </button>
                            )}

                            {/* Admin Dashboard (only for admins) */}
                            {user && (user.email === 'admin@autoscape.com' || user.email?.endsWith('@autoscape.com')) && (
                                <button
                                    onClick={() => {
                                        onNavigate('admin');
                                        onClose();
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors group"
                                >
                                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600 group-hover:bg-red-200 transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold">Admin Dashboard</div>
                                        <div className="text-xs text-slate-400">System overview</div>
                                    </div>
                                </button>
                            )}

                            <div className="border-t border-slate-100 my-2 pt-2">
                                <button
                                    onClick={() => {
                                        navigate('/terms');
                                        onClose();
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors"
                                >
                                    <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold text-sm">Terms of Service</div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => {
                                        navigate('/privacy');
                                        onClose();
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors"
                                >
                                    <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                                        <Shield className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold text-sm">Privacy Policy</div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {!user ? (
                                <div className="text-center py-8">
                                    <p className="text-slate-500 mb-4">Sign in to view your history</p>
                                    <button
                                        onClick={onLogin}
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium"
                                    >
                                        Sign In
                                    </button>
                                </div>
                            ) : loading ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full"></div>
                                </div>
                            ) : designs.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    No designs yet
                                </div>
                            ) : (
                                designs.map((design) => (
                                    <div
                                        key={design.id}
                                        onClick={() => {
                                            onLoadDesign(design);
                                            onClose();
                                        }}
                                        className="bg-slate-50 hover:bg-emerald-50 rounded-xl p-3 cursor-pointer transition-all border border-transparent hover:border-emerald-200 group"
                                    >
                                        {design.renderImages[0] && (
                                            <img
                                                src={design.renderImages[0]}
                                                alt="Preview"
                                                className="w-full h-24 object-cover rounded-lg mb-2"
                                            />
                                        )}
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium text-slate-800 text-sm">
                                                    {design.analysis?.designConcept || 'Landscape Design'}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {new Date(design.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => handleDelete(design.id, e)}
                                                className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
