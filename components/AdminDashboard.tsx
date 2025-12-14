import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    getAllUsers,
    updateUserRole,
    getAllDesignsAdmin,
    getAllDesigners,
    UserData,
    SavedDesign,
    DesignerProfile
} from '../services/firestoreService';
import { Loader, Users, Image, Briefcase, DollarSign, Shield, Check, X } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'users' | 'gallery' | 'pros'>('users');
    const [users, setUsers] = useState<UserData[]>([]);
    const [designs, setDesigns] = useState<SavedDesign[]>([]);
    const [designers, setDesigners] = useState<DesignerProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initial Load
    useEffect(() => {
        loadData();
    }, [user, activeTab]);

    const loadData = async () => {
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
            // Optimistic update
            setUsers(users.map(u => u.uid === uid ? { ...u, role: newRole } : u));
        } catch (err) {
            console.error(err);
            alert('Failed to update role');
        }
    };

    const calculateCost = (design: SavedDesign) => {
        // Simple estimation logic
        let cost = 0;
        // Gemini Image Generation (Render) ~ $0.04
        if (design.renderImages) cost += design.renderImages.length * 0.04;
        // Gemini Veo (Video) ~ $0.10 (Estimate)
        if (design.videoUrl) cost += 0.10;
        // Scene understanding ~ $0.01
        cost += 0.01;

        return cost.toFixed(2);
    };

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
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader className="w-8 h-8 text-purple-600 animate-spin" />
                    </div>
                ) : error ? (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

                        {/* USERS TAB */}
                        {activeTab === 'users' && (
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
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* GALLERY TAB */}
                        {activeTab === 'gallery' && (
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold text-slate-700">Preview</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700">Design Info</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700">Generated Assets</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700 text-right">Est. Cost</th>
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
                                            <td className="px-6 py-4 text-right font-mono text-slate-700">
                                                ${calculateCost(d)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* PROS TAB */}
                        {activeTab === 'pros' && (
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold text-slate-700">Professional</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700">Details</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
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
                                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">Verified</span>
                                                ) : (
                                                    <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">Pending</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {designers.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                                                No professionals found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}

                    </div>
                )}
            </div>
        </div>
    );
};
