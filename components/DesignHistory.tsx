import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserDesigns, deleteDesign, SavedDesign } from '../services/firestoreService';

interface DesignHistoryProps {
    onLoadDesign: (design: SavedDesign) => void;
}

export const DesignHistory: React.FC<DesignHistoryProps> = ({ onLoadDesign }) => {
    const { user } = useAuth();
    const [designs, setDesigns] = useState<SavedDesign[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (user) {
            loadDesigns();
        }
    }, [user]);

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

    if (!user) return null;

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 bg-purple-600 hover:bg-purple-500 text-white p-4 rounded-full shadow-2xl transition-all z-40 flex items-center gap-2"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {!isOpen && <span className="font-medium">History ({designs.length})</span>}
            </button>

            {/* Sidebar */}
            {isOpen && (
                <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 flex flex-col animate-fade-in">
                    {/* Header */}
                    <div className="p-6 border-b border-slate-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-800">Your Designs</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{designs.length} saved projects</p>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {loading ? (
                            <div className="flex items-center justify-center h-32">
                                <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
                            </div>
                        ) : designs.length === 0 ? (
                            <div className="text-center py-12 px-4">
                                <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                                <p className="text-slate-500">No designs yet</p>
                                <p className="text-sm text-slate-400 mt-1">Generate your first landscape design!</p>
                            </div>
                        ) : (
                            designs.map((design) => (
                                <div
                                    key={design.id}
                                    onClick={() => {
                                        onLoadDesign(design);
                                        setIsOpen(false);
                                    }}
                                    className="bg-slate-50 hover:bg-purple-50 rounded-xl p-4 cursor-pointer transition-all border-2 border-transparent hover:border-purple-200 group"
                                >
                                    {/* Thumbnail */}
                                    {design.renderImages[0] && (
                                        <img
                                            src={design.renderImages[0]}
                                            alt="Design preview"
                                            className="w-full h-32 object-cover rounded-lg mb-3"
                                        />
                                    )}

                                    {/* Info */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="font-semibold text-slate-800 text-sm">
                                                {design.analysis?.designConcept || 'Landscape Design'}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {new Date(design.createdAt).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                    hour: 'numeric',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                            {design.estimates?.totalCost && (
                                                <p className="text-xs text-emerald-600 font-medium mt-1">
                                                    ${design.estimates.totalCost.toLocaleString()}
                                                </p>
                                            )}
                                        </div>

                                        {/* Delete Button */}
                                        <button
                                            onClick={(e) => handleDelete(design.id, e)}
                                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition-all p-1"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Overlay */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 bg-black/30 z-40 animate-fade-in"
                />
            )}
        </>
    );
};
