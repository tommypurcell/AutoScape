import React, { useEffect, useState } from 'react';
import { SavedDesign, getPublicDesigns, deleteDesignAdmin } from '../services/firestoreService';
import { Loader2, Heart, User, Calendar, Link2, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Local fallback gallery entries to ensure the page always has content
const LOCAL_FALLBACK_DESIGNS: SavedDesign[] = [
    {
        id: 'local-modern-oasis',
        shortId: 'local-modern',
        userId: 'demo-user',
        renderImages: ['/demo_clips/autoscape_hero_gen.png'],
        yardImageUrl: '/demo_clips/autoscape_hero_original.png',
        planImage: '/demo_clips/scene_2_solution.jpg',
        analysis: {
            description: 'Modern oasis with structured plantings and a clean lounging pad.',
            style: 'Modern'
        },
        estimates: {
            totalCost: 42000,
            breakdown: [],
            currency: 'USD'
        },
        createdAt: new Date()
    },
    {
        id: 'local-courtyard',
        shortId: 'local-courtyard',
        userId: 'demo-user',
        renderImages: ['/demo_clips/after-pad.png'],
        yardImageUrl: '/demo_clips/before-pad.JPG',
        planImage: '/demo_clips/scene_1_problem.jpg',
        analysis: {
            description: 'Cozy courtyard transformation with pavers and accent plantings.',
            style: 'Contemporary'
        },
        estimates: {
            totalCost: 18000,
            breakdown: [],
            currency: 'USD'
        },
        createdAt: new Date()
    },
    {
        id: 'local-budget',
        shortId: 'local-budget',
        userId: 'demo-user',
        renderImages: ['/demo_clips/scene_3_analysis.jpg'],
        yardImageUrl: '/demo_clips/scene_1_problem.jpg',
        planImage: '/demo_clips/scene_5_budget.jpg',
        analysis: {
            description: 'Budget-friendly refresh with gravel paths and low-maintenance plants.',
            style: 'Native'
        },
        estimates: {
            totalCost: 12000,
            breakdown: [],
            currency: 'USD'
        },
        createdAt: new Date()
    }
];

interface CommunityGalleryProps {
    onLoadDesign: (design: SavedDesign) => void;
}

const CommunityGallery: React.FC<CommunityGalleryProps> = ({ onLoadDesign }) => {
    const { userRole } = useAuth();
    const [designs, setDesigns] = useState<SavedDesign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDesign, setSelectedDesign] = useState<SavedDesign | null>(null);

    useEffect(() => {
        loadDesigns();

        // Listen for refresh events (e.g., after saving a new design)
        const handleRefresh = () => loadDesigns();
        window.addEventListener('refreshGallery', handleRefresh);

        return () => window.removeEventListener('refreshGallery', handleRefresh);
    }, []);

    const loadDesigns = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch all public designs (no limit, or very high limit)
            const publicDesigns = await getPublicDesigns(10000);
            console.log(`CommunityGallery: Received ${publicDesigns.length} designs from getPublicDesigns`);
            console.log(`  Design IDs: ${publicDesigns.map(d => d.id).join(', ')}`);
            setDesigns(publicDesigns.length > 0 ? publicDesigns : LOCAL_FALLBACK_DESIGNS);
        } catch (err) {
            console.error('Failed to load community gallery:', err);
            // Fall back to local demo designs so the gallery still renders
            setDesigns(LOCAL_FALLBACK_DESIGNS);
            setError(null);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteDesign = async (designId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this design? This cannot be undone.')) return;
        try {
            await deleteDesignAdmin(designId);
            setDesigns(designs.filter(d => d.id !== designId));
            if (selectedDesign?.id === designId) {
                setSelectedDesign(null);
            }
        } catch (err) {
            console.error('Failed to delete design:', err);
            alert('Failed to delete design');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-slate-500">
                <Loader2 className="w-12 h-12 animate-spin mb-4 text-emerald-500" />
                <p>Curating the best designs...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-12 text-red-500 bg-red-50 rounded-xl border border-red-100">
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-slate-900 mb-4">Community Gallery</h2>
                <p className="text-lg text-slate-600">Explore landscape transformations created by the AutoScape community</p>
            </div>

            {designs.length === 0 ? (
                <div className="text-center p-12 text-slate-500">
                    <p className="text-lg">No public designs found in the gallery yet.</p>
                    <p className="text-sm mt-2">Be the first to share your design!</p>
                </div>
            ) : (
                <>
                    <div className="mb-4 text-sm text-slate-600 text-center">
                        Showing {designs.length} design{designs.length !== 1 ? 's' : ''}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {designs.map((design) => {
                            // Skip designs without render images
                            if (!design.renderImages || design.renderImages.length === 0) {
                                console.warn(`Skipping design ${design.id} - no render images`);
                                return null;
                            }

                            const imageUrl = design.renderImages[0] || design.yardImageUrl;
                            if (!imageUrl) {
                                console.warn(`Skipping design ${design.id} - no image URL`);
                                return null;
                            }

                            return (
                                <div
                                    key={design.id}
                                    className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-slate-100 flex flex-col"
                                >
                                    {/* Image Container */}
                                    <div
                                        className="relative h-64 overflow-hidden cursor-pointer"
                                        onClick={() => setSelectedDesign(design)}
                                    >
                                        <img
                                            src={imageUrl}
                                            alt="Landscape Design"
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            onError={(e) => {
                                                console.error(`Failed to load image for design ${design.id}:`, imageUrl);
                                                e.currentTarget.src = '/placeholder-image.jpg'; // Fallback
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4">
                                            <span className="text-white font-medium flex items-center gap-2">
                                                <Heart className="w-4 h-4 fill-current" /> 12
                                            </span>
                                            <span className="bg-white/20 backdrop-blur-md text-white text-xs px-2 py-1 rounded-full border border-white/30">
                                                View Details
                                            </span>
                                        </div>
                                        {/* Admin Delete Button */}
                                        {userRole === 'admin' && (
                                            <button
                                                onClick={(e) => handleDeleteDesign(design.id, e)}
                                                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                title="Delete Design"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                                <User className="w-4 h-4" />
                                                <span className="font-mono text-xs">{design.userId?.substring(0, 8) || 'Anonymous'}...</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-400 text-xs">
                                                <Calendar className="w-3 h-3" />
                                                <span>{design.createdAt.toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                                            <span className="text-emerald-600 font-medium text-sm bg-emerald-50 px-3 py-1 rounded-full">
                                                {design.analysis?.style || "Modern"}
                                            </span>
                                            <button
                                                onClick={() => onLoadDesign(design)}
                                                className="text-slate-600 hover:text-emerald-600 font-medium text-sm transition-colors"
                                            >
                                                Try this style
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Detail Modal */}
            {selectedDesign && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto relative flex flex-col md:flex-row shadow-2xl">
                        <button
                            onClick={() => setSelectedDesign(null)}
                            className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        {/* Left: Images */}
                        <div className="w-full md:w-2/3 bg-black flex items-center justify-center p-4">
                            <img
                                src={selectedDesign.renderImages[0]}
                                alt="Design Render"
                                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                            />
                        </div>

                        {/* Right: Details */}
                        <div className="w-full md:w-1/3 p-8 bg-white overflow-y-auto">
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Design Details</h3>
                            <p className="text-slate-500 text-sm mb-2">Created on {selectedDesign.createdAt.toLocaleDateString()}</p>
                            <p className="text-slate-400 text-xs mb-6 font-mono">Creator: {selectedDesign.userId?.substring(0, 12) || 'Anonymous'}...</p>

                            <div className="space-y-6">
                                <div>
                                    <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                        <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
                                        Style Analysis
                                    </h4>
                                    <p className="text-slate-600 text-sm leading-relaxed">
                                        {selectedDesign.analysis?.description || "A beautiful landscape transformation."}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                        <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                                        Budget Estimate
                                    </h4>
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-slate-600">Total Estimated Cost</span>
                                            <span className="text-xl font-bold text-emerald-700">
                                                ${selectedDesign.estimates?.totalCost?.toLocaleString() || "N/A"}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400">Based on RAG-retrieved item prices.</p>
                                    </div>
                                </div>

                                {/* Shareable Link */}
                                {selectedDesign.shortId && (
                                    <div>
                                        <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                            <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                                            Shareable Link
                                        </h4>
                                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={`${window.location.origin}/result/${selectedDesign.shortId}`}
                                                    readOnly
                                                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-600"
                                                />
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(`${window.location.origin}/result/${selectedDesign.shortId}`);
                                                        // Brief visual feedback
                                                        const btn = document.getElementById('copy-link-btn');
                                                        if (btn) {
                                                            btn.textContent = '✓';
                                                            setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
                                                        }
                                                    }}
                                                    id="copy-link-btn"
                                                    className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    Copy
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-6 border-t border-slate-100 space-y-3">
                                    <button
                                        onClick={() => {
                                            onLoadDesign(selectedDesign);
                                            setSelectedDesign(null);
                                        }}
                                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all transform hover:-translate-y-1"
                                    >
                                        Load This Design
                                    </button>
                                    {/* Admin Delete in Modal */}
                                    {userRole === 'admin' && (
                                        <button
                                            onClick={(e) => handleDeleteDesign(selectedDesign.id, e)}
                                            className="w-full py-3 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" /> Delete Design
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommunityGallery;
