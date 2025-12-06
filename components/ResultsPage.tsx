import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ResultsView } from './ResultsView';
import { getDesignByShortId, SavedDesign } from '../services/firestoreService';
import { LoadingScreen } from './LoadingScreen';
import { GeneratedDesign } from '../types';

export const ResultsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [design, setDesign] = useState<GeneratedDesign | null>(null);
    const [yardImageUrl, setYardImageUrl] = useState<string | null>(null);
    const [designShortId, setDesignShortId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDesign = async () => {
            // Check if result is passed in state (from fresh generation)
            if (location.state?.result) {
                setDesign(location.state.result);
                setYardImageUrl(location.state.yardImageUrl || null);
                setDesignShortId(id || null); // Use the ID from URL as shortId
                setLoading(false);
                return;
            }

            if (!id) {
                setError('No design ID provided');
                setLoading(false);
                return;
            }

            try {
                // Use shortId to fetch the design
                const savedDesign = await getDesignByShortId(id);
                if (savedDesign) {
                    setDesign({
                        renderImages: savedDesign.renderImages,
                        planImage: savedDesign.planImage,
                        estimates: savedDesign.estimates,
                        analysis: savedDesign.analysis,
                        videoUrl: savedDesign.videoUrl
                    });
                    setYardImageUrl(savedDesign.yardImageUrl || null);
                    setDesignShortId(savedDesign.shortId);
                } else {
                    setError('Design not found');
                }
            } catch (err) {
                console.error('Error fetching design:', err);
                setError('Failed to load design');
            } finally {
                setLoading(false);
            }
        };

        fetchDesign();
    }, [id, location.state]);

    if (loading) return <LoadingScreen />;
    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                    onClick={() => navigate('/')}
                    className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800"
                >
                    Go Home
                </button>
            </div>
        </div>
    );

    if (!design) return null;

    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <ResultsView
                    result={design}
                    onReset={() => navigate('/create')}
                    originalImage={yardImageUrl}
                    designShortId={designShortId || undefined}
                />
            </div>
        </div>
    );
};
