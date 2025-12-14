import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getDesignerProfileByUserId, updateDesignerProfile, getMessagesForDesigner, getPublicDesigns, getDesignerDesigns, DesignerProfile, Message, SavedDesign } from '../services/firestoreService';
import { User, Briefcase, Mail, Star, ExternalLink, Loader, Save, MapPin, Globe, Phone, Image as ImageIcon, Upload, Trash2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { uploadImage } from '../services/storageService';

export const BusinessDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'profile' | 'leads' | 'portfolio'>('profile');
    const [profile, setProfile] = useState<DesignerProfile | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [userDesigns, setUserDesigns] = useState<SavedDesign[]>([]);

    // Form State
    const [formData, setFormData] = useState<Partial<DesignerProfile>>({});

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }
        fetchData();
    }, [user, activeTab]);

    const fetchData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            // Fetch Profile
            const profileData = await getDesignerProfileByUserId(user.uid);
            if (profileData) {
                setProfile(profileData);
                setFormData(profileData);
            } else {
                // If dashboard accessed but no profile, maybe redirect to onboarding?
                // For now, assume they have one
            }

            // Fetch Messages if on leads tab
            if (activeTab === 'leads') {
                let msgs = await getMessagesForDesigner(user.uid);

                // MOCK LEADS FOR DEMO (Specific User)
                if (user.email === 'tommypurcelljr@gmail.com' && msgs.length === 0) {
                    // Try to get a real design for the mock message so the link works
                    const publicDesigns = await getPublicDesigns(1);
                    const mockDesign = publicDesigns.length > 0 ? publicDesigns[0] : null;

                    msgs = [
                        {
                            id: 'mock-1',
                            senderName: 'Alice Freeman',
                            senderEmail: 'alice.freeman@example.com',
                            recipientUserId: user.uid,
                            content: "Hi, I love your portfolio! I have a 500 sq ft backyard in Santa Monica that needs a complete redesign. Are you available for a consultation next week?",
                            createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
                            read: false,
                            designImageUrl: mockDesign?.renderImages?.[0] || "https://images.unsplash.com/photo-1598902168898-9a792f212807?auto=format&fit=crop&q=80&w=800",
                            designId: mockDesign?.id // If null, the button won't render or will be broken? The component checks msg.designId
                        },
                        {
                            id: 'mock-2',
                            senderName: 'David Chen',
                            senderEmail: 'david.chen@example.com',
                            recipientUserId: user.uid,
                            content: "Hello, I'm looking for a drought-tolerant garden design. I noticed you specialize in native plants. What are your typical rates for a small front yard project?",
                            createdAt: new Date(Date.now() - 86400000 * 5), // 5 days ago
                            read: true
                        }
                    ];
                }
                setMessages(msgs);
            }

            // Fetch User Designs if on portfolio tab
            if (activeTab === 'portfolio') {
                const designs = await getDesignerDesigns(user.uid);
                setUserDesigns(designs);
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!user || !profile) return;
        setIsSaving(true);
        try {
            await updateDesignerProfile(user.uid, formData);
            setProfile({ ...profile, ...formData } as DesignerProfile);
            alert("Profile updated successfully!");
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile.");
        } finally {
            setIsSaving(false);
        }
    };

    const updateField = (field: keyof DesignerProfile, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const generateRandomAvatar = () => {
        const randomNum = Math.floor(Math.random() * 180) + 1;
        const avatarUrl = `https://mockmind-api.uifaces.co/content/human/${randomNum}.jpg`;
        updateField('avatarUrl', avatarUrl);
    };

    const handlePortfolioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0 || !user) return;

        setIsUploading(true);
        try {
            const uploadPromises = Array.from(files).map(file => uploadImage(file, `portfolios/${user.uid}`));
            const uploadedUrls = await Promise.all(uploadPromises);

            const currentPortfolio = formData.portfolioImages || profile?.portfolioImages || [];
            const updatedPortfolio = [...currentPortfolio, ...uploadedUrls];

            await updateDesignerProfile(user.uid, { portfolioImages: updatedPortfolio });
            setFormData(prev => ({ ...prev, portfolioImages: updatedPortfolio }));
            setProfile(prev => prev ? { ...prev, portfolioImages: updatedPortfolio } : null);

            alert('Portfolio images uploaded successfully!');
        } catch (error) {
            console.error('Error uploading portfolio images:', error);
            alert('Failed to upload images. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemovePortfolioImage = async (imageUrl: string) => {
        if (!user || !profile) return;

        const updatedPortfolio = (formData.portfolioImages || profile.portfolioImages || []).filter(url => url !== imageUrl);

        try {
            await updateDesignerProfile(user.uid, { portfolioImages: updatedPortfolio });
            setFormData(prev => ({ ...prev, portfolioImages: updatedPortfolio }));
            setProfile(prev => prev ? { ...prev, portfolioImages: updatedPortfolio } : null);
        } catch (error) {
            console.error('Error removing portfolio image:', error);
            alert('Failed to remove image. Please try again.');
        }
    };

    const handleAddDesignToPortfolio = async (design: SavedDesign) => {
        if (!user || !profile) return;

        const imageUrl = design.renderImages[0];
        if (!imageUrl) return;

        const currentPortfolio = formData.portfolioImages || profile.portfolioImages || [];
        if (currentPortfolio.includes(imageUrl)) {
            alert('This design is already in your portfolio!');
            return;
        }

        const updatedPortfolio = [...currentPortfolio, imageUrl];

        try {
            await updateDesignerProfile(user.uid, { portfolioImages: updatedPortfolio });
            setFormData(prev => ({ ...prev, portfolioImages: updatedPortfolio }));
            setProfile(prev => prev ? { ...prev, portfolioImages: updatedPortfolio } : null);
            alert('Design added to portfolio!');
        } catch (error) {
            console.error('Error adding design to portfolio:', error);
            alert('Failed to add design. Please try again.');
        }
    };

    if (isLoading && !profile) {
        return (
            <div className="min-h-screen pt-20 flex justify-center items-center">
                <Loader className="w-8 h-8 text-green-600 animate-spin" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen pt-20 flex flex-col items-center justify-center p-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Partner Profile Not Found</h2>
                <button
                    onClick={() => navigate('/designer-signup')}
                    className="px-6 py-2 bg-green-700 text-white rounded-lg"
                >
                    Create Partner Profile
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-20 bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Partner Dashboard</h1>
                        <p className="text-gray-600">Manage your business profile and view client leads.</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => window.open(`/designer/${profile.id}`, '_blank')}
                            className="px-4 py-2 text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 flex items-center gap-2"
                        >
                            <ExternalLink className="w-4 h-4" />
                            View Public Page
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`flex-1 py-4 text-center font-medium transition-colors flex items-center justify-center gap-2
                                ${activeTab === 'profile' ? 'text-green-700 border-b-2 border-green-700 bg-green-50/50' : 'text-gray-600 hover:bg-gray-50'}
                            `}
                        >
                            <User className="w-4 h-4" />
                            Edit Profile
                        </button>
                        <button
                            onClick={() => setActiveTab('portfolio')}
                            className={`flex-1 py-4 text-center font-medium transition-colors flex items-center justify-center gap-2
                                ${activeTab === 'portfolio' ? 'text-green-700 border-b-2 border-green-700 bg-green-50/50' : 'text-gray-600 hover:bg-gray-50'}
                            `}
                        >
                            <ImageIcon className="w-4 h-4" />
                            Portfolio
                        </button>
                        <button
                            onClick={() => setActiveTab('leads')}
                            className={`flex-1 py-4 text-center font-medium transition-colors flex items-center justify-center gap-2
                                ${activeTab === 'leads' ? 'text-green-700 border-b-2 border-green-700 bg-green-50/50' : 'text-gray-600 hover:bg-gray-50'}
                            `}
                        >
                            <Mail className="w-4 h-4" />
                            Client Leads
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 animate-fade-in">

                    {/* PROFILE TAB */}
                    {activeTab === 'profile' && (
                        <div className="space-y-6 max-w-3xl">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-900">Business Information</h3>
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={isSaving}
                                    className="px-6 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Changes
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                                    <input
                                        type="text"
                                        value={formData.businessName || ''}
                                        onChange={e => updateField('businessName', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={formData.fullName || ''}
                                        onChange={e => updateField('fullName', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                    <input
                                        type="text"
                                        value={formData.city || ''}
                                        onChange={e => updateField('city', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                    <input
                                        type="text"
                                        value={formData.state || ''}
                                        onChange={e => updateField('state', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input
                                        type="text"
                                        value={formData.phone || ''}
                                        onChange={e => updateField('phone', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                                    <input
                                        type="text"
                                        value={formData.website || ''}
                                        onChange={e => updateField('website', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Profile Avatar URL</label>
                                <div className="flex gap-4 items-start">
                                    <div className="flex-1">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={formData.avatarUrl || ''}
                                                onChange={e => updateField('avatarUrl', e.target.value)}
                                                placeholder="https://example.com/your-avatar.jpg"
                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={generateRandomAvatar}
                                                className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 whitespace-nowrap"
                                            >
                                                <User className="w-4 h-4" />
                                                Random Avatar
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Enter a direct URL to your profile photo or click "Random Avatar" for a generated one</p>
                                    </div>
                                    {formData.avatarUrl && (
                                        <div className="flex-shrink-0">
                                            <img
                                                src={formData.avatarUrl}
                                                alt="Avatar preview"
                                                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=Invalid';
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                                <textarea
                                    value={formData.bio || ''}
                                    onChange={e => updateField('bio', e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                />
                            </div>

                            {/* Portfolio Images inputs could go here - simplified for now */}
                        </div>
                    )}

                    {/* PORTFOLIO TAB */}
                    {activeTab === 'portfolio' && (
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Portfolio Gallery</h3>
                                <p className="text-gray-600 mb-6">Showcase your best work to potential clients. Upload photos or add designs from your history.</p>

                                {/* Upload Section */}
                                <div className="mb-8">
                                    <label className="block mb-4">
                                        <div className="flex items-center justify-center w-full h-40 px-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 transition-colors cursor-pointer bg-gray-50 hover:bg-green-50">
                                            <div className="text-center">
                                                {isUploading ? (
                                                    <Loader className="w-12 h-12 text-green-600 animate-spin mx-auto mb-2" />
                                                ) : (
                                                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                                )}
                                                <p className="text-sm text-gray-600">
                                                    {isUploading ? 'Uploading...' : 'Click to upload portfolio images'}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                                            </div>
                                        </div>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handlePortfolioUpload}
                                            className="hidden"
                                            disabled={isUploading}
                                        />
                                    </label>
                                </div>

                                {/* Current Portfolio Images */}
                                {(formData.portfolioImages || profile?.portfolioImages || []).length > 0 && (
                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Your Portfolio ({(formData.portfolioImages || profile?.portfolioImages || []).length})</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {(formData.portfolioImages || profile?.portfolioImages || []).map((imageUrl, index) => (
                                                <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-green-500 transition-colors">
                                                    <img
                                                        src={imageUrl}
                                                        alt={`Portfolio ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <button
                                                        onClick={() => handleRemovePortfolioImage(imageUrl)}
                                                        className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Add from History */}
                            <div className="border-t border-gray-200 pt-8">
                                <h4 className="text-lg font-semibold text-gray-900 mb-4">Add from Your Designs</h4>
                                {isLoading ? (
                                    <div className="flex justify-center py-12">
                                        <Loader className="w-8 h-8 text-green-600 animate-spin" />
                                    </div>
                                ) : userDesigns.length === 0 ? (
                                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                        <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <h5 className="text-gray-900 font-medium">No public designs yet</h5>
                                        <p className="text-gray-500 text-sm">Create and publish designs to add them to your portfolio.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {userDesigns.map((design) => {
                                            const isInPortfolio = (formData.portfolioImages || profile?.portfolioImages || []).includes(design.renderImages[0]);
                                            return (
                                                <div key={design.id} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-green-500 transition-colors">
                                                    <img
                                                        src={design.renderImages[0]}
                                                        alt="Design"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    {isInPortfolio ? (
                                                        <div className="absolute inset-0 bg-green-600/80 flex items-center justify-center">
                                                            <span className="text-white font-semibold text-sm">In Portfolio ✓</span>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleAddDesignToPortfolio(design)}
                                                            className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                                        >
                                                            <Plus className="w-6 h-6 mr-2" />
                                                            Add to Portfolio
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* LEADS TAB */}
                    {activeTab === 'leads' && (
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Inquiries</h3>

                            {messages.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                    <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <h4 className="text-gray-900 font-medium">No messages yet</h4>
                                    <p className="text-gray-500 text-sm">When users contact you, their messages will appear here.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {messages.map((msg) => (
                                        <div key={msg.id} className="border border-gray-200 rounded-lg p-5 hover:border-green-200 transition-colors bg-white shadow-sm">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h4 className="font-bold text-lg text-gray-900">{msg.senderName || 'Anonymous User'}</h4>
                                                    <div className="text-sm text-gray-500 flex items-center gap-1">
                                                        <Mail className="w-3 h-3" />
                                                        {msg.senderEmail}
                                                    </div>
                                                </div>
                                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{msg.createdAt.toLocaleDateString()}</span>
                                            </div>

                                            <div className="bg-gray-50 p-4 rounded-lg text-gray-700 mb-4 text-sm leading-relaxed">
                                                {msg.content}
                                            </div>

                                            {msg.designImageUrl && (
                                                <div className="mt-3 border-t border-gray-100 pt-3">
                                                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Attached Design</p>
                                                    <div className="flex gap-3">
                                                        <img
                                                            src={msg.designImageUrl}
                                                            alt="Attached Design"
                                                            className="w-24 h-16 object-cover rounded border border-gray-200"
                                                        />
                                                        {msg.designId && (
                                                            <button
                                                                onClick={() => window.open(`/result/${msg.designId}`, '_blank')}
                                                                className="text-sm text-green-700 hover:underline flex items-center gap-1 self-center"
                                                            >
                                                                View Full Design <ExternalLink className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
