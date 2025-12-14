import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    getAllUsers,
    updateUserRole,
    getAllDesignsAdmin,
    getAllDesigners,
    deleteDesignAdmin,
    updateDesignerVerification,
    UserData,
    SavedDesign,
    DesignerProfile
} from '../services/firestoreService';
import { Loader, Users, Image, Briefcase, DollarSign, Shield, Check, X, Trash2, Video, TrendingUp, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

export const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'gallery' | 'pros' | 'backlog'>('overview');
    const [users, setUsers] = useState<UserData[]>([]);
    const [designs, setDesigns] = useState<SavedDesign[]>([]);
    const [designers, setDesigners] = useState<DesignerProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load all data on mount for overview stats
    useEffect(() => {
        loadAllData();
    }, [user]);

    // Load specific tab data when tab changes
    useEffect(() => {
        if (activeTab !== 'overview') {
            loadTabData();
        }
    }, [activeTab]);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const [usersData, designsData, designersData] = await Promise.all([
                getAllUsers(),
                getAllDesignsAdmin(),
                getAllDesigners()
            ]);
            setUsers(usersData);
            setDesigns(designsData);
            setDesigners(designersData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadTabData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'users') {
                const data = await getAllUsers();
                setUsers(data);
            } else if (activeTab === 'gallery') {
                const data = await getAllDesignsAdmin();
                setDesigns(data);
            } else if (activeTab === 'pros') {
                const data = await getAllDesigners();
                setDesigners(data);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleUpdate = async (uid: string, newRole: 'user' | 'admin' | 'pro') => {
        try {
            await updateUserRole(uid, newRole);
            setUsers(users.map(u => u.uid === uid ? { ...u, role: newRole } : u));
        } catch (err) {
            console.error(err);
            alert('Failed to update role');
        }
    };

    const handleDeleteDesign = async (designId: string) => {
        if (!confirm('Are you sure you want to delete this design? This cannot be undone.')) return;
        try {
            await deleteDesignAdmin(designId);
            setDesigns(designs.filter(d => d.id !== designId));
        } catch (err) {
            console.error(err);
            alert('Failed to delete design');
        }
    };

    const handleVerifyDesigner = async (designerId: string, isVerified: boolean) => {
        try {
            await updateDesignerVerification(designerId, isVerified);
            setDesigners(designers.map(d => d.id === designerId ? { ...d, isVerified } : d));
        } catch (err) {
            console.error(err);
            alert('Failed to update verification');
        }
    };

    const calculateCost = (design: SavedDesign) => {
        let cost = 0;
        if (design.renderImages) cost += design.renderImages.length * 0.04;
        if (design.videoUrl) cost += 0.10;
        cost += 0.01;
        return cost;
    };

    // Calculate overview statistics
    const stats = useMemo(() => {
        const totalCost = designs.reduce((sum, d) => sum + calculateCost(d), 0);
        const videosGenerated = designs.filter(d => d.videoUrl).length;
        const totalImages = designs.reduce((sum, d) => sum + (d.renderImages?.length || 0), 0);
        return {
            totalUsers: users.length,
            totalDesigns: designs.length,
            totalVideos: videosGenerated,
            totalImages,
            totalCost: totalCost.toFixed(2),
            verifiedPros: designers.filter(d => d.isVerified).length,
            pendingPros: designers.filter(d => !d.isVerified).length
        };
    }, [users, designs, designers]);

    // Designs per day (last 7 days)
    const designsPerDay = useMemo(() => {
        const days: Record<string, number> = {};
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const key = date.toLocaleDateString('en-US', { weekday: 'short' });
            days[key] = 0;
        }
        designs.forEach(d => {
            if (d.createdAt) {
                const date = new Date(d.createdAt);
                const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
                if (daysDiff < 7) {
                    const key = date.toLocaleDateString('en-US', { weekday: 'short' });
                    if (days[key] !== undefined) days[key]++;
                }
            }
        });
        return Object.entries(days).map(([name, count]) => ({ name, count }));
    }, [designs]);

    // Popular styles (from design analysis)
    const popularStyles = useMemo(() => {
        const styleCounts: Record<string, number> = {};
        designs.forEach(d => {
            const style = d.analysis?.designConcept?.split(' ')[0] || 'Modern';
            styleCounts[style] = (styleCounts[style] || 0) + 1;
        });
        return Object.entries(styleCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, value]) => ({ name, value }));
    }, [designs]);

    if (!user) return <div className="p-8 text-center">Please login to access admin dashboard.</div>;

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <Shield className="w-8 h-8 text-purple-600" />
                        Admin Dashboard
                    </h1>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-8">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${activeTab === 'overview' ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <BarChart3 className="w-4 h-4" /> Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${activeTab === 'users' ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <Users className="w-4 h-4" /> Users
                    </button>
                    <button
                        onClick={() => setActiveTab('gallery')}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${activeTab === 'gallery' ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <Image className="w-4 h-4" /> Gallery & Costs
                    </button>
                    <button
                        onClick={() => setActiveTab('pros')}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${activeTab === 'pros' ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <Briefcase className="w-4 h-4" /> Professionals
                    </button>
                    <button
                        onClick={() => setActiveTab('backlog')}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${activeTab === 'backlog' ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        Features & Backlog
                    </button>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader className="w-8 h-8 text-purple-600 animate-spin" />
                    </div>
                ) : error ? (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
                ) : (
                    <>
                        {/* OVERVIEW TAB */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* Stats Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                                <Users className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <span className="text-slate-500 text-sm">Total Users</span>
                                        </div>
                                        <div className="text-3xl font-bold text-slate-900">{stats.totalUsers}</div>
                                    </div>
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                                <Image className="w-5 h-5 text-emerald-600" />
                                            </div>
                                            <span className="text-slate-500 text-sm">Designs</span>
                                        </div>
                                        <div className="text-3xl font-bold text-slate-900">{stats.totalDesigns}</div>
                                        <div className="text-xs text-slate-400 mt-1">{stats.totalImages} images</div>
                                    </div>
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <Video className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <span className="text-slate-500 text-sm">Videos</span>
                                        </div>
                                        <div className="text-3xl font-bold text-slate-900">{stats.totalVideos}</div>
                                    </div>
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                                <DollarSign className="w-5 h-5 text-amber-600" />
                                            </div>
                                            <span className="text-slate-500 text-sm">Est. API Cost</span>
                                        </div>
                                        <div className="text-3xl font-bold text-slate-900">${stats.totalCost}</div>
                                    </div>
                                </div>

                                {/* Charts Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Designs Per Day */}
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                                            Designs (Last 7 Days)
                                        </h3>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={designsPerDay}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                                                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                                                    />
                                                    <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Popular Styles */}
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                            <BarChart3 className="w-5 h-5 text-purple-600" />
                                            Popular Styles
                                        </h3>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={popularStyles}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={50}
                                                        outerRadius={80}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                        label={({ name }) => name}
                                                    >
                                                        {popularStyles.map((_, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                    <Legend />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>

                                {/* Pro Stats */}
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                        <Briefcase className="w-5 h-5 text-blue-600" />
                                        Professional Partners
                                    </h3>
                                    <div className="flex gap-8">
                                        <div>
                                            <span className="text-4xl font-bold text-emerald-600">{stats.verifiedPros}</span>
                                            <span className="text-slate-500 ml-2">Verified</span>
                                        </div>
                                        <div>
                                            <span className="text-4xl font-bold text-amber-600">{stats.pendingPros}</span>
                                            <span className="text-slate-500 ml-2">Pending</span>
                                        </div>
                                        <div>
                                            <span className="text-4xl font-bold text-slate-700">{stats.verifiedPros + stats.pendingPros}</span>
                                            <span className="text-slate-500 ml-2">Total</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* USERS TAB */}
                        {activeTab === 'users' && (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold text-slate-700">User</th>
                                            <th className="px-6 py-4 font-semibold text-slate-700">Role</th>
                                            <th className="px-6 py-4 font-semibold text-slate-700">Last Login</th>
                                            <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {users.map(u => (
                                            <tr key={u.uid} className="hover:bg-slate-50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {u.photoURL ? (
                                                            <img src={u.photoURL} alt="" className="w-8 h-8 rounded-full" />
                                                        ) : (
                                                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                                                                {u.displayName?.[0] || u.email[0]}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="font-medium text-slate-900">{u.displayName || 'No Name'}</div>
                                                            <div className="text-sm text-slate-500">{u.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                        u.role === 'pro' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        {u.role || 'user'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500">
                                                    {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleRoleUpdate(u.uid, u.role === 'admin' ? 'user' : 'admin')}
                                                            className={`text-xs px-2 py-1 rounded border ${u.role === 'admin' ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-purple-200 text-purple-600 hover:bg-purple-50'}`}
                                                        >
                                                            {u.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleRoleUpdate(u.uid, u.role === 'pro' ? 'user' : 'pro')}
                                                            className={`text-xs px-2 py-1 rounded border ${u.role === 'pro' ? 'border-amber-200 text-amber-600 hover:bg-amber-50' : 'border-blue-200 text-blue-600 hover:bg-blue-50'}`}
                                                        >
                                                            {u.role === 'pro' ? 'Remove Pro' : 'Make Pro'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {users.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                                    No users found. Users will appear after they log in.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* GALLERY TAB */}
                        {activeTab === 'gallery' && (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold text-slate-700">Preview</th>
                                            <th className="px-6 py-4 font-semibold text-slate-700">Design Info</th>
                                            <th className="px-6 py-4 font-semibold text-slate-700">Generated Assets</th>
                                            <th className="px-6 py-4 font-semibold text-slate-700">Est. Cost</th>
                                            <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {designs.map(d => (
                                            <tr key={d.id} className="hover:bg-slate-50">
                                                <td className="px-6 py-4">
                                                    {d.renderImages && d.renderImages[0] ? (
                                                        <img src={d.renderImages[0]} alt="Render" className="w-16 h-16 object-cover rounded-lg border border-slate-200" />
                                                    ) : <div className="w-16 h-16 bg-slate-100 rounded-lg" />}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-slate-900">Short ID: {d.shortId}</div>
                                                    <div className="text-xs text-slate-500">User: {d.userId.substring(0, 8)}...</div>
                                                    <div className="text-xs text-slate-400">{d.createdAt ? new Date(d.createdAt).toLocaleDateString() : ''}</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="flex items-center gap-1">
                                                            <Image className="w-3 h-3" /> {d.renderImages?.length || 0} Images
                                                        </span>
                                                        {d.videoUrl && (
                                                            <span className="flex items-center gap-1 text-purple-600">
                                                                <Check className="w-3 h-3" /> Video Generated
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-slate-700">
                                                    ${calculateCost(d).toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleDeleteDesign(d.id)}
                                                        className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1 ml-auto"
                                                    >
                                                        <Trash2 className="w-3 h-3" /> Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {designs.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                                    No designs found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* PROS TAB */}
                        {activeTab === 'pros' && (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold text-slate-700">Professional</th>
                                            <th className="px-6 py-4 font-semibold text-slate-700">Details</th>
                                            <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                                            <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {designers.map(designer => (
                                            <tr key={designer.id} className="hover:bg-slate-50">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-slate-900">{designer.businessName}</div>
                                                    <div className="text-sm text-slate-500">{designer.item}</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    <div>{designer.city}, {designer.state}</div>
                                                    <div className="text-xs text-slate-400">{designer.email}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {designer.isVerified ? (
                                                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit">
                                                            <Check className="w-3 h-3" /> Verified
                                                        </span>
                                                    ) : (
                                                        <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">Pending</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleVerifyDesigner(designer.id, !designer.isVerified)}
                                                        className={`text-xs px-3 py-1 rounded border ${designer.isVerified
                                                            ? 'border-red-200 text-red-600 hover:bg-red-50'
                                                            : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                                                            }`}
                                                    >
                                                        {designer.isVerified ? 'Revoke' : 'Verify'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {designers.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                                    No professionals found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* FEATURES & BACKLOG TAB */}
                        {activeTab === 'backlog' && (
                            <div className="space-y-6">
                                {/* Current Features */}
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                        Current Active Features
                                    </h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                                            <h4 className="font-semibold text-emerald-900 mb-2">🎨 Design Generation</h4>
                                            <ul className="space-y-1 text-sm text-emerald-700">
                                                <li>• AI-powered landscape design using Gemini 2.0</li>
                                                <li>• Style analysis and customization</li>
                                                <li>• Before/after comparison slider</li>
                                                <li>• Multiple design variations</li>
                                            </ul>
                                        </div>
                                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                            <h4 className="font-semibold text-blue-900 mb-2">🎥 Video Generation</h4>
                                            <ul className="space-y-1 text-sm text-blue-700">
                                                <li>• Gemini Veo 3.1 (High Quality, 5s)</li>
                                                <li>• Freepik Kling v2 (Fast, 5s)</li>
                                                <li>• Before→After transition with camera pan</li>
                                                <li>• Smooth, natural animations</li>
                                            </ul>
                                        </div>
                                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                                            <h4 className="font-semibold text-purple-900 mb-2">💰 Cost Estimation</h4>
                                            <ul className="space-y-1 text-sm text-purple-700">
                                                <li>• RAG-based material pricing</li>
                                                <li>• Plant palette with detailed items</li>
                                                <li>• Cost distribution breakdown</li>
                                                <li>• Budget tracking and history</li>
                                            </ul>
                                        </div>
                                        <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                                            <h4 className="font-semibold text-orange-900 mb-2">👤 User Management</h4>
                                            <ul className="space-y-1 text-sm text-orange-700">
                                                <li>• Firebase authentication (Google, Email)</li>
                                                <li>• Design save and history</li>
                                                <li>• Community gallery (public designs)</li>
                                                <li>• Designer onboarding & profiles</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Recently Completed */}
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        Recently Completed
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                                            <div className="text-green-600 mt-0.5">✓</div>
                                            <div>
                                                <div className="font-medium text-slate-900">Auth Modal X Button</div>
                                                <div className="text-sm text-slate-600">Added cancel button to sign in/up modal</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                                            <div className="text-green-600 mt-0.5">✓</div>
                                            <div>
                                                <div className="font-medium text-slate-900">Sign Out Button</div>
                                                <div className="text-sm text-slate-600">Replaced settings icon with sign out in sidebar</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                                            <div className="text-green-600 mt-0.5">✓</div>
                                            <div>
                                                <div className="font-medium text-slate-900">Video Before→After Transition</div>
                                                <div className="text-sm text-slate-600">Composite image showing transformation from original to redesign</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                                            <div className="text-green-600 mt-0.5">✓</div>
                                            <div>
                                                <div className="font-medium text-slate-900">Gallery Budget Display</div>
                                                <div className="text-sm text-slate-600">Fixed budget extraction from design data</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                                            <div className="text-green-600 mt-0.5">✓</div>
                                            <div>
                                                <div className="font-medium text-slate-900">AI Disclaimer Footer</div>
                                                <div className="text-sm text-slate-600">Added Google Gemini usage disclaimer in footer</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Known Issues */}
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                        Known Issues & Limitations
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                                            <div className="text-yellow-600 mt-0.5">⚠️</div>
                                            <div>
                                                <div className="font-medium text-yellow-900">Freepik API Rate Limits</div>
                                                <div className="text-sm text-yellow-700">Video generation may hit quota limits (429 error)</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                                            <div className="text-yellow-600 mt-0.5">⚠️</div>
                                            <div>
                                                <div className="font-medium text-yellow-900">DesignerOnboarding.tsx Warning</div>
                                                <div className="text-sm text-yellow-700">Duplicate case 1: clause at line 95 (non-blocking)</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                                            <div className="text-yellow-600 mt-0.5">⚠️</div>
                                            <div>
                                                <div className="font-medium text-yellow-900">Large Bundle Size</div>
                                                <div className="text-sm text-yellow-700">1.6MB bundle (420KB gzipped) - consider code splitting</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* API Keys Status */}
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        API Integration Status
                                    </h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <h4 className="font-semibold text-green-900">Gemini API</h4>
                                            </div>
                                            <p className="text-sm text-green-700">Status: <span className="font-medium">Active</span></p>
                                            <p className="text-xs text-green-600 mt-1">Model: gemini-2.0-flash-exp & veo-3.1</p>
                                        </div>
                                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                <h4 className="font-semibold text-blue-900">Freepik API</h4>
                                            </div>
                                            <p className="text-sm text-blue-700">Status: <span className="font-medium">Active</span></p>
                                            <p className="text-xs text-blue-600 mt-1">Model: kling-v2 (image-to-video)</p>
                                        </div>
                                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                                <h4 className="font-semibold text-purple-900">Firebase</h4>
                                            </div>
                                            <p className="text-sm text-purple-700">Status: <span className="font-medium">Active</span></p>
                                            <p className="text-xs text-purple-600 mt-1">Auth, Firestore, Storage, Hosting, Functions</p>
                                        </div>
                                        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                                <h4 className="font-semibold text-orange-900">RAG API</h4>
                                            </div>
                                            <p className="text-sm text-orange-700">Status: <span className="font-medium">Active</span></p>
                                            <p className="text-xs text-orange-600 mt-1">Plant catalog & budget estimation</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
