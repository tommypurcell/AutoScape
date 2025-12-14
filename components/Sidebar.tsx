import { X, History, Menu, Settings, LogOut, Plus, Trash2, ChevronRight, Globe, Shield, FileText, Briefcase } from 'lucide-react';
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
    const { user, logout } = useAuth();
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
                            <span className="font-bold text-2xl text-slate-800">AutoScape</span>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* User Profile / Sign Out */}
                    {user ? (
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                                    {user.displayName?.[0] || user.email?.[0]?.toUpperCase()}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-base font-semibold text-slate-800 truncate">{user.displayName || 'User'}</p>
                                <p className="text-sm text-slate-500 truncate">{user.email}</p>
                            </div>
                            <button
                                onClick={logout}
                                className="text-slate-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg"
                                title="Sign Out"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
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
                        className={`flex-1 py-3 text-base font-medium transition-colors ${activeTab === 'menu'
                            ? 'text-emerald-600 border-b-2 border-emerald-600'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Menu
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-3 text-base font-medium transition-colors ${activeTab === 'history'
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
                                    <div className="font-semibold text-base">New Design</div>
                                    <div className="text-sm text-slate-400">Start from scratch</div>
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
                                    <div className="font-semibold text-base">Community Gallery</div>
                                    <div className="text-sm text-slate-400">Explore other designs</div>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    onNavigate('business');
                                    onClose();
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-purple-50 hover:text-purple-600 rounded-xl transition-colors group"
                            >
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 group-hover:bg-purple-200 transition-colors">
                                    <Briefcase className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <div className="font-semibold text-base">Find Professionals</div>
                                    <div className="text-sm text-slate-400">Hire a local expert</div>
                                </div>
                            </button>

                            {/* Partner Dashboard */}
                            {user && (
                                <button
                                    onClick={() => {
                                        navigate('/business/dashboard');
                                        onClose();
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-orange-50 hover:text-orange-600 rounded-xl transition-colors group"
                                >
                                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 group-hover:bg-orange-200 transition-colors">
                                        <Briefcase className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold text-base">Partner Dashboard</div>
                                        <div className="text-sm text-slate-400">Manage your business</div>
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
                                                <p className="font-medium text-slate-800 text-base">
                                                    {design.analysis?.designConcept || 'Landscape Design'}
                                                </p>
                                                <p className="text-sm text-slate-500">
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
