import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, MapPin, Globe, Mail, Phone, Award, Calendar, ArrowLeft, ExternalLink } from 'lucide-react';
import { DesignerProfile, getDesignerProfileByUserId, getDesignerDesigns, SavedDesign } from '../services/firestoreService';

interface DesignerGalleryProps {
    designerId?: string;
}

export const DesignerGallery: React.FC<DesignerGalleryProps> = ({ designerId: propDesignerId }) => {
    const { designerId: paramDesignerId } = useParams<{ designerId: string }>();
    const navigate = useNavigate();
    const designerId = propDesignerId || paramDesignerId;

    const [designer, setDesigner] = useState<DesignerProfile | null>(null);
    const [designs, setDesigns] = useState<SavedDesign[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDesign, setSelectedDesign] = useState<SavedDesign | null>(null);

    useEffect(() => {
        if (designerId) {
            loadDesigner();
        }
    }, [designerId]);

    const loadDesigner = async () => {
        if (!designerId) return;

        setLoading(true);
        try {
            const profile = await getDesignerProfileByUserId(designerId);
            setDesigner(profile);

            if (profile) {
                const designerDesigns = await getDesignerDesigns(designerId);
                setDesigns(designerDesigns);
            }
        } catch (error) {
            console.error('Error loading designer:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!designer) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Designer Not Found</h2>
                <p className="text-gray-600 mb-6">This designer profile doesn't exist or has been removed.</p>
                <button
                    onClick={() => navigate('/business')}
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium"
                >
                    Browse All Designers
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
                <div className="max-w-6xl mx-auto px-6 py-12">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>

                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Profile Picture / Initials */}
                        <div className="w-32 h-32 bg-amber-500 rounded-2xl flex items-center justify-center text-4xl font-bold text-white flex-shrink-0">
                            {designer.fullName.split(' ').map(n => n[0]).join('')}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold">{designer.businessName}</h1>
                                {designer.isVerified && (
                                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium flex items-center gap-1">
                                        <Award className="w-3 h-3" />
                                        Verified
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-400 mb-4">{designer.fullName}</p>

                            <div className="flex flex-wrap gap-4 text-sm text-gray-300 mb-6">
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {designer.city}, {designer.state}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {designer.yearsExperience} years experience
                                </span>
                                {designer.rating && designer.rating > 0 && (
                                    <span className="flex items-center gap-1">
                                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                        {designer.rating.toFixed(1)} ({designer.reviewCount} reviews)
                                    </span>
                                )}
                            </div>

                            {/* Specialties */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                {designer.specialties.map((specialty, idx) => (
                                    <span
                                        key={idx}
                                        className="px-3 py-1 bg-white/10 text-white rounded-full text-sm"
                                    >
                                        {specialty}
                                    </span>
                                ))}
                            </div>

                            {/* Contact Buttons */}
                            <div className="flex flex-wrap gap-3">
                                {designer.email && (
                                    <a
                                        href={`mailto:${designer.email}`}
                                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-lg font-medium flex items-center gap-2 transition-colors"
                                    >
                                        <Mail className="w-4 h-4" />
                                        Contact
                                    </a>
                                )}
                                {designer.website && (
                                    <a
                                        href={designer.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                                    >
                                        <Globe className="w-4 h-4" />
                                        Website
                                    </a>
                                )}
                                {designer.phone && (
                                    <a
                                        href={`tel:${designer.phone}`}
                                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                                    >
                                        <Phone className="w-4 h-4" />
                                        Call
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bio Section */}
            <div className="max-w-6xl mx-auto px-6 py-12">
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-12">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-line">{designer.bio}</p>
                </div>

                {/* Portfolio Section */}
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Portfolio</h2>
                        <span className="text-gray-500">{designs.length} designs</span>
                    </div>

                    {designs.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">No designs yet</h3>
                            <p className="text-gray-500">This designer hasn't shared any public designs.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {designs.map((design) => (
                                <div
                                    key={design.id}
                                    onClick={() => navigate(`/result/${design.shortId}`)}
                                    className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all cursor-pointer"
                                >
                                    <div className="aspect-video bg-gray-100 overflow-hidden">
                                        {design.renderImages[0] && (
                                            <img
                                                src={design.renderImages[0]}
                                                alt="Design"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-800 mb-1 truncate">
                                            {design.analysis?.designConcept?.split('.')[0] || 'Landscape Design'}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {design.createdAt.toLocaleDateString()}
                                        </p>
                                        <div className="flex items-center gap-2 mt-3">
                                            <span className="text-xs text-amber-600 font-medium flex items-center gap-1 group-hover:underline">
                                                View Design
                                                <ExternalLink className="w-3 h-3" />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DesignerGallery;
