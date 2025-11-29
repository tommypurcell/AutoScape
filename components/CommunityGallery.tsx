import React, { useEffect, useState } from 'react';
import { SavedDesign, getPublicDesigns } from '../services/firestoreService';
import { Loader2, Heart, User, Calendar } from 'lucide-react';

interface CommunityGalleryProps {
    onLoadDesign: (design: SavedDesign) => void;
}

const CommunityGallery: React.FC<CommunityGalleryProps> = ({ onLoadDesign }) => {
    const [designs, setDesigns] = useState<SavedDesign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDesign, setSelectedDesign] = useState<SavedDesign | null>(null);

    useEffect(() => {
        loadDesigns();
    }, []);

    const loadDesigns = async () => {
        setLoading(true);
        setError(null);
        try {
            const publicDesigns = await getPublicDesigns(50);
            setDesigns(publicDesigns);
        } catch (err) {
            console.error('Failed to load community gallery:', err);
            setError('Failed to load designs. This might be a Firestore indexing issue. Check the browser console for details.');
        } finally {
            setLoading(false);
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {designs.map((design) => (
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
                                src={design.renderImages[0] || design.yardImageUrl}
                                alt="Landscape Design"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4">
                                <span className="text-white font-medium flex items-center gap-2">
                                    <Heart className="w-4 h-4 fill-current" /> 12
                                </span>
                                <span className="bg-white/20 backdrop-blur-md text-white text-xs px-2 py-1 rounded-full border border-white/30">
                                    View Details
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2 text-slate-500 text-sm">
                                    <User className="w-4 h-4" />
                                    <span>Designer</span>
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
                ))}
            </div>

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
                            <p className="text-slate-500 text-sm mb-6">Created on {selectedDesign.createdAt.toLocaleDateString()}</p>

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
                                            <span className="text-xl font-bold text-slate-900">
                                                {selectedDesign.estimates?.total_cost || "N/A"}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400">Based on RAG-retrieved item prices.</p>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100">
                                    <button
                                        onClick={() => {
                                            onLoadDesign(selectedDesign);
                                            setSelectedDesign(null);
                                        }}
                                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all transform hover:-translate-y-1"
                                    >
                                        Load This Design
                                    </button>
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
