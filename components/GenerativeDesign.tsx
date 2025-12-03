import React, { useState } from 'react';
import { Upload, Loader2, DollarSign } from 'lucide-react';

interface BudgetLineItem {
    item: string;
    match: string;
    price_estimate: string;
    cost: number;
    image_url?: string;
}

interface DesignResult {
    analysis: {
        environment_summary: string;
        constraints: string[];
        design_style: string;
    };
    generated_image_base64: string;
    items: string[];
    budget: {
        total_min_budget: number;
        currency: string;
        line_items: BudgetLineItem[];
    };
}

export default function GenerativeDesign() {
    const [placeImage, setPlaceImage] = useState<File | null>(null);
    const [conceptImage, setConceptImage] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<DesignResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!placeImage || !conceptImage) {
            setError('Please upload both images');
            return;
        }

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('place_image', placeImage);
        formData.append('concept_image', conceptImage);

        try {
            const response = await fetch('http://localhost:8002/api/enhance-with-rag', {
                method: 'POST',
                body: formData,
            });


            if (!response.ok) {
                throw new Error(`API error: ${response.statusText}`);
            }

            const data = await response.json();
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate design');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">AI Landscape Design & Budget</h1>

            {/* Upload Section */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="border-2 border-dashed rounded-lg p-6">
                    <label className="block mb-2 font-semibold">📍 Your Place</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPlaceImage(e.target.files?.[0] || null)}
                        className="w-full"
                    />
                    {placeImage && (
                        <img
                            src={URL.createObjectURL(placeImage)}
                            alt="Place"
                            className="mt-4 rounded-lg max-h-48 object-cover"
                        />
                    )}
                </div>

                <div className="border-2 border-dashed rounded-lg p-6">
                    <label className="block mb-2 font-semibold">💡 Concept Style</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setConceptImage(e.target.files?.[0] || null)}
                        className="w-full"
                    />
                    {conceptImage && (
                        <img
                            src={URL.createObjectURL(conceptImage)}
                            alt="Concept"
                            className="mt-4 rounded-lg max-h-48 object-cover"
                        />
                    )}
                </div>
            </div>

            <button
                onClick={handleGenerate}
                disabled={loading || !placeImage || !conceptImage}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <Loader2 className="animate-spin" size={20} />
                        Generating...
                    </>
                ) : (
                    <>
                        <Upload size={20} />
                        Generate Design & Budget
                    </>
                )}
            </button>

            {error && (
                <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>
            )}

            {/* Results Section */}
            {result && (
                <div className="mt-8 space-y-6">
                    {/* Analysis */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <h2 className="text-xl font-bold mb-4">📊 Analysis</h2>
                        <p className="mb-2"><strong>Style:</strong> {result.analysis.design_style}</p>
                        <p className="mb-2"><strong>Environment:</strong> {result.analysis.environment_summary}</p>
                        {result.analysis.constraints.length > 0 && (
                            <p><strong>Constraints:</strong> {result.analysis.constraints.join(', ')}</p>
                        )}
                    </div>

                    {/* Generated Design */}
                    <div>
                        <h2 className="text-xl font-bold mb-4">🎨 Your New Design</h2>
                        <img
                            src={`data:image/png;base64,${result.generated_image_base64}`}
                            alt="Generated Design"
                            className="w-full rounded-lg shadow-lg"
                        />
                    </div>

                    {/* Budget Breakdown */}
                    <div className="bg-white border rounded-lg p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <DollarSign size={24} />
                            Budget Estimate
                        </h2>

                        <div className="mb-6">
                            <p className="text-3xl font-bold text-green-600">
                                ${result.budget.total_min_budget}
                            </p>
                            <p className="text-sm text-gray-600">Minimum estimated cost</p>
                        </div>

                        <div className="space-y-4">
                            {result.budget.line_items.map((item, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded">
                                    {item.image_url && (
                                        <img
                                            src={item.image_url}
                                            alt={item.item}
                                            className="w-20 h-20 object-cover rounded"
                                        />
                                    )}
                                    <div className="flex-1">
                                        <p className="font-semibold">{item.item}</p>
                                        <p className="text-sm text-gray-600">Match: {item.match}</p>
                                        <p className="text-sm text-gray-500">{item.price_estimate}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg">${item.cost}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
