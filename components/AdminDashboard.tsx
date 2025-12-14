import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    getAdminStats,
    getAllDesigns,
    getStyleDistribution,
    deleteDesignAdmin,
    isAdmin,
    AdminStats,
    AdminDesign,
    DesignStyleCount
} from '../services/adminService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Loader2, Users, DollarSign, Image, TrendingUp, Trash2 } from 'lucide-react';

interface AdminDashboardProps {
    onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'overview' | 'designs' | 'analytics'>('overview');
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [designs, setDesigns] = useState<AdminDesign[]>([]);
    const [styleData, setStyleData] = useState<DesignStyleCount[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!user || !isAdmin(user.email)) {
            onClose();
            return;
        }
        loadDashboardData();
    }, [user]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const [statsData, designsData, stylesData] = await Promise.all([
                getAdminStats(),
                getAllDesigns(100),
                getStyleDistribution(),
            ]);
            setStats(statsData);
            setDesigns(designsData);
            setStyleData(stylesData);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteDesign = async (designId: string) => {
        if (!confirm('Delete this design? This cannot be undone.')) return;
        try {
            await deleteDesignAdmin(designId);
            setDesigns(designs.filter(d => d.id !== designId));
        } catch (error) {
            console.error('Error deleting design:', error);
        }
    };

    const filteredDesigns = designs.filter(d =>
        d.analysis?.designConcept?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.analysis?.style?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.shortId?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!user || !isAdmin(user.email)) {
        return null;
    }

    const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-700 to-green-600 text-white p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Admin Dashboard</h2>
                            <p className="text-sm text-green-100">System overview and management</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/70 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 bg-slate-50">
                    {(['overview', 'designs', 'analytics'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-4 px-6 text-sm font-medium capitalize transition-colors relative ${activeTab === tab
                                ? 'text-green-600 bg-white'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                        >
                            {tab}
                            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500" />}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
                        </div>
                    ) : (
                        <>
                            {/* Overview Tab */}
                            {activeTab === 'overview' && stats && (
                                <div className="space-y-6">
                                    {/* Stats Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <Users className="w-8 h-8 text-blue-600" />
                                                <span className="text-xs font-medium text-blue-600 bg-blue-200 px-2 py-1 rounded-full">Users</span>
                                            </div>
                                            <p className="text-3xl font-bold text-slate-900">{stats.totalUsers || 'N/A'}</p>
                                            <p className="text-sm text-slate-600 mt-1">Registered users</p>
                                        </div>

                                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <Image className="w-8 h-8 text-emerald-600" />
                                                <span className="text-xs font-medium text-emerald-600 bg-emerald-200 px-2 py-1 rounded-full">Designs</span>
                                            </div>
                                            <p className="text-3xl font-bold text-slate-900">{stats.totalDesigns}</p>
                                            <p className="text-sm text-slate-600 mt-1">Total created</p>
                                        </div>

                                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <DollarSign className="w-8 h-8 text-purple-600" />
                                                <span className="text-xs font-medium text-purple-600 bg-purple-200 px-2 py-1 rounded-full">Budget</span>
                                            </div>
                                            <p className="text-3xl font-bold text-slate-900">${(stats.totalBudget / 1000).toFixed(0)}k</p>
                                            <p className="text-sm text-slate-600 mt-1">Total estimated</p>
                                        </div>

                                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <TrendingUp className="w-8 h-8 text-orange-600" />
                                                <span className="text-xs font-medium text-orange-600 bg-orange-200 px-2 py-1 rounded-full">24h</span>
                                            </div>
                                            <p className="text-3xl font-bold text-slate-900">{stats.recentDesigns}</p>
                                            <p className="text-sm text-slate-600 mt-1">Recent designs</p>
                                        </div>
                                    </div>

                                    {/* Recent Designs Preview */}
                                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                                        <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Designs</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {designs.slice(0, 8).map((design) => (
                                                <div key={design.id} className="relative aspect-square rounded-lg overflow-hidden group">
                                                    <img
                                                        src={design.renderImages[0]}
                                                        alt="Design"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="text-white text-xs font-medium">
                                                            {new Date(design.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Designs Tab */}
                            {activeTab === 'designs' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-slate-900">All Designs ({designs.length})</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {designs.map((design) => (
                                            <div key={design.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
                                                <div className="relative aspect-video">
                                                    <img
                                                        src={design.renderImages[0]}
                                                        alt="Design"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="p-4">
                                                    <p className="font-semibold text-slate-900 mb-1">
                                                        {design.analysis?.designConcept || 'Landscape Design'}
                                                    </p>
                                                    <p className="text-xs text-slate-500 mb-2">
                                                        {new Date(design.createdAt).toLocaleString()}
                                                    </p>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">
                                                            {design.analysis?.style || 'Modern'}
                                                        </span>
                                                        <button
                                                            onClick={() => handleDeleteDesign(design.id)}
                                                            className="text-red-500 hover:text-red-700 p-2"
                                                            title="Delete design"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Analytics Tab */}
                            {activeTab === 'analytics' && (
                                <div className="space-y-6">
                                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                                        <h3 className="text-lg font-bold text-slate-900 mb-6">Design Styles Distribution</h3>
                                        <div className="h-80">
                                            <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                                                <PieChart>
                                                    <Pie
                                                        data={styleData}
                                                        dataKey="count"
                                                        nameKey="style"
                                                        cx="50%"
                                                        cy="50%"
                                                        outerRadius={100}
                                                        label={({ style, count }) => `${style}: ${count}`}
                                                    >
                                                        {styleData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                    <Legend />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                                        <h3 className="text-lg font-bold text-slate-900 mb-6">Popular Styles</h3>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                                                <BarChart data={styleData.slice(0, 8)} layout="vertical">
                                                    <XAxis type="number" />
                                                    <YAxis type="category" dataKey="style" width={100} />
                                                    <Tooltip />
                                                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                                        {styleData.slice(0, 8).map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
