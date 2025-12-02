import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ResultsView } from './ResultsView';
import { getDesignById, SavedDesign } from '../services/firestoreService';
import { LoadingScreen } from './LoadingScreen';
import { GeneratedDesign } from '../types';

export const ResultsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [design, setDesign] = useState<GeneratedDesign | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDesign = async () => {
            // Check if result is passed in state (from fresh generation)
            if (location.state?.result) {
                setDesign(location.state.result);
                setLoading(false);
                return;
            }

            if (!id) {
                setError('No design ID provided');
                setLoading(false);
                return;
            }

            try {
                const savedDesign = await getDesignById(id);
                if (savedDesign) {
                    setDesign({
                        renderImages: savedDesign.renderImages,
                        planImage: savedDesign.planImage,
                        estimates: savedDesign.estimates,
                        analysis: savedDesign.analysis,
                    });
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
    }, [id]);

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
                    originalImage={null} // We might not have the original image URL easily accessible if it wasn't saved or if it's a blob. 
                // For saved designs, we might need to update the data model to store the original image URL if we want to show it.
                // For now, passing null is acceptable as it just hides the comparison slider or shows only the result.
                />
            </div>
        </div>
    );
};
