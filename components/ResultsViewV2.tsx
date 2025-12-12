import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GeneratedDesign, MaterialItem } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { PlantPalette } from './PlantPalette';
import { saveDesign } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';
import { useDesign } from '../contexts/DesignContext';
import { ProductSwapModal } from './ProductSwapModal';
import { HelpTip } from './HelpTip';
import { EditModeCanvas, Annotation } from './EditModeCanvas';
import { analyzeAndRegenerateDesign } from '../services/geminiService';
import { generateAffiliateLinks, VerifiedMaterialItem } from '../services/affiliateService';

interface ResultsViewProps {
    result?: GeneratedDesign;
    originalImage?: string | null;
    onReset?: () => void;
    designShortId?: string;
}

interface RAGItem {
    item: string;
    match: string;
    price_estimate: string;
    cost: number;
    image_url?: string;
}

interface RAGBudget {
    total_min_budget: number;
    line_items: RAGItem[];
}

export const ResultsViewV2: React.FC<ResultsViewProps> = ({
    result: propResult,
    originalImage: propOriginalImage,
    onReset: propOnReset,
    designShortId
}) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { result: contextResult, yardImagePreview, resetDesign, setResult: setContextResult } = useDesign();

    const [localResult, setLocalResult] = useState<GeneratedDesign | null>(propResult || contextResult);
    const result = localResult || propResult || contextResult;
    const originalImage = propOriginalImage || yardImagePreview;

    const onReset = propOnReset || (() => {
        resetDesign();
        navigate('/upload');
    });

    // State variables
    const [activeTab, setActiveTab] = useState<'original' | 'render' | 'plan' | 'compare' | 'video'>('compare');
    const [currentRenderIndex, setCurrentRenderIndex] = useState(0);
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [videoError, setVideoError] = useState<string | null>(null);
    const [ragBudget, setRagBudget] = useState<RAGBudget | null>(null);
    const [copied, setCopied] = useState(false);
    const [isLoadingBudget, setIsLoadingBudget] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isImageEditMode, setIsImageEditMode] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [swapModalOpen, setSwapModalOpen] = useState(false);
    const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
    const [affiliateLinks, setAffiliateLinks] = useState<Map<string, VerifiedMaterialItem>>(new Map());
    const [isLoadingAffiliateLinks, setIsLoadingAffiliateLinks] = useState(false);
    const [showAffiliateLinks, setShowAffiliateLinks] = useState(false);

    // New state for V2 features
    const [isSaving, setIsSaving] = useState(false);
    const [currentShortId, setCurrentShortId] = useState<string | null>(designShortId || null);
    const [costViewTab, setCostViewTab] = useState<'materials' | 'distribution'>('materials');
    const [selectedPlant, setSelectedPlant] = useState<any | null>(null);

    // Update local result when prop or context changes
    useEffect(() => {
        setLocalResult(propResult || contextResult);
    }, [propResult, contextResult]);

    // Redirect if no result
    useEffect(() => {
        if (!result) {
            navigate('/upload');
        }
    }, [result, navigate]);

    if (!result) return null;

    // Automatically fetch RAG budget when component mounts
    useEffect(() => {
        const fetchBudget = async () => {
            if (!result || !result.estimates || !result.estimates.breakdown) return;
            setIsLoadingBudget(true);
            try {
                const plants = result.estimates.breakdown.filter(item =>
                    item.name.toLowerCase().includes('plant') ||
                    item.name.toLowerCase().includes('tree') ||
                    item.name.toLowerCase().includes('shrub') ||
                    item.name.toLowerCase().includes('flower')
                ).map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    description: item.notes
                }));

                if (plants.length === 0) {
                    setIsLoadingBudget(false);
                    return;
                }

                const response = await fetch('http://localhost:8002/api/enhance-with-rag', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ plants, hardscape: [], features: [], structures: [], furniture: [] }),
                });

                if (!response.ok) throw new Error('Failed to fetch RAG budget');
                const data = await response.json();

                if (data.success && data.plantPalette) {
                    const lineItems: RAGItem[] = data.plantPalette.map((p: any) => {
                        const priceStr = p.unit_price || "$0";
                        const price = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
                        const quantity = typeof p.quantity === 'number' ? p.quantity : 1;
                        return {
                            item: p.original_name || p.common_name,
                            match: p.common_name,
                            price_estimate: p.unit_price,
                            cost: price * quantity,
                            image_url: p.image_url
                        };
                    });
                    setRagBudget({ total_min_budget: lineItems.reduce((sum, item) => sum + item.cost, 0), line_items: lineItems });
                }
            } catch (error) {
                console.error('Error fetching RAG budget:', error);
            } finally {
                setIsLoadingBudget(false);
            }
        };
        fetchBudget();
    }, [result]);

    // Helper functions
    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

    const downloadCSV = () => {
        const headers = ["Material / Item", "Quantity", "Unit Cost", "Estimated Cost", "Notes"];
        const rows = result.estimates.breakdown.map(item => [
            `"${item.name.replace(/"/g, '""')}"`,
            `"${item.quantity.replace(/"/g, '""')}"`,
            `"${item.unitCost.replace(/"/g, '""')}"`,
            `"${item.totalCost.replace(/"/g, '""')}"`,
            `"${item.notes.replace(/"/g, '""')}"`
        ]);
        rows.push([]);
        rows.push(["ESTIMATED TOTAL", "", "", `"${formatCurrency(result.estimates.totalCost)}"`, ""]);
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", "landscaping_estimate.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Group items by category for the chart
    const chartData = React.useMemo(() => {
        const categories: Record<string, number> = { 'Hardscape': 0, 'Softscape': 0, 'Plants': 0, 'Labor': 0, 'Other': 0 };
        result.estimates.breakdown.forEach(item => {
            const name = item.name.toLowerCase();
            const cost = parseFloat(item.totalCost.replace(/[^0-9.]/g, '')) || 0;
            if (name.includes('labor') || name.includes('install') || name.includes('removal') || name.includes('prep')) categories['Labor'] += cost;
            else if (name.includes('paver') || name.includes('stone') || name.includes('concrete') || name.includes('gravel') || name.includes('wood') || name.includes('deck') || name.includes('patio') || name.includes('fence') || name.includes('wall') || name.includes('rock') || name.includes('path')) categories['Hardscape'] += cost;
            else if (name.includes('mulch') || name.includes('soil') || name.includes('compost') || name.includes('turf') || name.includes('grass') || name.includes('sod')) categories['Softscape'] += cost;
            else if (name.includes('plant') || name.includes('tree') || name.includes('shrub') || name.includes('flower') || name.includes('bush') || name.includes('seed')) categories['Plants'] += cost;
            else categories['Other'] += cost;
        });
        return Object.entries(categories).filter(([_, value]) => value > 0).map(([name, value]) => ({ name, cost: value }));
    }, [result.estimates.breakdown]);

    const nextRender = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentRenderIndex((prev) => (prev + 1) % result.renderImages.length); };
    const prevRender = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentRenderIndex((prev) => (prev - 1 + result.renderImages.length) % result.renderImages.length); };

    // Share link handler with auto-save
    const handleShareLink = async () => {
        if (currentShortId) {
            const url = `${window.location.origin}/result/${currentShortId}`;
            navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            return;
        }
        setIsSaving(true);
        try {
            const ownerId = user?.uid || 'anonymous';
            const { shortId } = await saveDesign(ownerId, { ...result, yardImageUrl: originalImage }, false);
            setCurrentShortId(shortId);
            const newUrl = `${window.location.origin}/result/${shortId}`;
            navigator.clipboard.writeText(newUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            window.history.replaceState({}, '', `/result/${shortId}`);
        } catch (error) {
            console.error('Failed to save design:', error);
            alert('Failed to generate shareable link. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerateAffiliateLinks = async () => {
        if (!result || !result.renderImages[currentRenderIndex] || !result.estimates.breakdown) {
            alert('Unable to generate affiliate links. Missing render image or materials list.');
            return;
        }
        setIsLoadingAffiliateLinks(true);
        try {
            const affiliateResult = await generateAffiliateLinks(result.renderImages[currentRenderIndex], result.estimates.breakdown);
            const linksMap = new Map<string, VerifiedMaterialItem>();
            affiliateResult.verifiedMaterials.forEach(item => { linksMap.set(item.name, item); });
            setAffiliateLinks(linksMap);
            setShowAffiliateLinks(true);
        } catch (error) {
            console.error('Error generating affiliate links:', error);
            alert('Failed to generate affiliate links. Please try again.');
        } finally {
            setIsLoadingAffiliateLinks(false);
        }
    };

    const handleGenerateVideo = async () => {
        if (!originalImage || !result.renderImages[currentRenderIndex]) return;
        setIsGeneratingVideo(true);
        setVideoError(null);
        try {
            const getBase64 = async (url: string): Promise<string> => {
                if (url.startsWith('data:')) return url.split(',')[1];
                const response = await fetch(url);
                const blob = await response.blob();
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve((reader.result as string).split(',')[1]);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            };
            const [originalBase64, redesignBase64] = await Promise.all([getBase64(originalImage), getBase64(result.renderImages[currentRenderIndex])]);
            const response = await fetch('http://localhost:8002/api/generate-video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ original_image: originalBase64, redesign_image: redesignBase64, duration: 5 }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || 'Failed to generate video');
            setVideoUrl(data.video_url);
            setActiveTab('video');
        } catch (err) {
            setVideoError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsGeneratingVideo(false);
        }
    };

    return (
        <div className="flex gap-6 animate-fade-in pb-12">
            {/* Left Column - Main Content */}
            <div className="flex-1 space-y-6 min-w-0">

                {/* Header - Matches Wireframe */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Your Redesign</h2>
                        {currentShortId && (
                            <p className="text-sm text-slate-600 mt-0.5">
                                Unique link: {window.location.origin}/result/{currentShortId}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Share Link Button */}
                        <button
                            disabled={isSaving}
                            onClick={handleShareLink}
                            className={`px-4 py-2 border rounded-lg font-medium transition-all flex items-center gap-2 ${isSaving ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-wait' : 'bg-white border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-slate-700'}`}
                        >
                            {isSaving ? (
                                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                            )}
                            {isSaving ? 'Saving...' : copied ? 'Copied!' : currentShortId ? 'Copy link' : 'Share link'}
                        </button>
                        {/* Contact Designer Button */}
                        <button
                            onClick={() => window.open('mailto:design@autoscape.ai?subject=Design Consultation Request', '_blank')}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            Contact Designer
                        </button>
                    </div>
                </div>

                {/* Visuals Section - Full Width */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
                    {/* Tab Bar - Matches Wireframe */}
                    <div className="flex border-b border-slate-100">
                        {/* Compare Tab with sub-tabs */}
                        <div className="flex-1 border-r border-slate-100">
                            <div className="text-sm text-slate-600 text-center py-1 bg-slate-50 border-b border-slate-100">Compare</div>
                            <div className="flex">
                                <button onClick={() => setActiveTab('original')} className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === 'original' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:text-slate-700 hover:bg-slate-50'}`}>
                                    original
                                    {activeTab === 'original' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
                                </button>
                                <button onClick={() => setActiveTab('render')} className={`flex-1 py-3 text-sm font-medium transition-colors relative border-l border-slate-100 ${activeTab === 'render' || activeTab === 'compare' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:text-slate-700 hover:bg-slate-50'}`}>
                                    Render
                                    {(activeTab === 'render' || activeTab === 'compare') && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
                                </button>
                            </div>
                        </div>
                        <button onClick={() => setActiveTab('plan')} className={`flex-1 py-4 text-sm font-medium transition-colors relative border-r border-slate-100 ${activeTab === 'plan' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:text-slate-700 hover:bg-slate-50'}`}>
                            2D Plan
                            {activeTab === 'plan' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
                        </button>
                        <button onClick={() => setActiveTab('video')} className={`flex-1 py-4 text-sm font-medium transition-colors relative ${activeTab === 'video' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:text-slate-700 hover:bg-slate-50'}`}>
                            Video
                            {activeTab === 'video' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
                        </button>
                    </div>

                    {/* Image Display Area */}
                    <div className="relative aspect-video bg-slate-100 flex items-center justify-center overflow-hidden">
                        {activeTab === 'compare' && originalImage && result.renderImages[currentRenderIndex] && (
                            <BeforeAfterSlider beforeImage={originalImage} afterImage={result.renderImages[currentRenderIndex]} className="w-full h-full" />
                        )}
                        {activeTab === 'original' && originalImage && (
                            <img src={originalImage} alt="Original yard" className="w-full h-full object-contain" />
                        )}
                        {activeTab === 'render' && result.renderImages[currentRenderIndex] && (
                            <div className="relative w-full h-full">
                                <img src={result.renderImages[currentRenderIndex]} alt="Rendered design" className="w-full h-full object-contain" />
                                {result.renderImages.length > 1 && (
                                    <>
                                        <button onClick={prevRender} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow-lg flex items-center justify-center">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                        </button>
                                        <button onClick={nextRender} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow-lg flex items-center justify-center">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        </button>
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                            {result.renderImages.map((_, idx) => (
                                                <button key={idx} onClick={() => setCurrentRenderIndex(idx)} className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentRenderIndex ? 'bg-emerald-500 scale-125' : 'bg-white/60 hover:bg-white'}`} />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                        {activeTab === 'plan' && result.planImage && (
                            <img src={result.planImage} alt="2D landscape plan" className="w-full h-full object-contain" />
                        )}
                        {activeTab === 'video' && (
                            <div className="w-full h-full flex flex-col items-center justify-center p-8">
                                {videoUrl ? (
                                    <video src={videoUrl} controls autoPlay loop className="max-w-full max-h-full rounded-lg shadow-lg" />
                                ) : (
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-800 mb-2">Generate Video Tour</h3>
                                        <p className="text-slate-600 mb-4 text-sm">Create a cinematic video of your redesign</p>
                                        <button onClick={handleGenerateVideo} disabled={isGeneratingVideo} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50">
                                            {isGeneratingVideo ? 'Generating...' : 'Generate Video'}
                                        </button>
                                        {videoError && <p className="text-red-500 mt-2 text-sm">{videoError}</p>}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Name of the Concept */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                    <h3 className="font-bold text-slate-800">{result.concept?.name || 'Modern Landscape Design'}</h3>
                    <p className="text-sm text-slate-600 mt-1">{result.concept?.description || 'A beautiful redesign of your outdoor space'}</p>
                </div>

                {/* Material List & Cost Distribution - Tabbed */}
                {result.estimates.totalCost > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="flex border-b border-slate-100">
                            <button onClick={() => setCostViewTab('materials')} className={`flex-1 py-3 text-sm font-medium transition-colors relative ${costViewTab === 'materials' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:text-slate-700 hover:bg-slate-50'}`}>
                                Material List & Estimates
                                {costViewTab === 'materials' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
                            </button>
                            <button onClick={() => setCostViewTab('distribution')} className={`flex-1 py-3 text-sm font-medium transition-colors relative ${costViewTab === 'distribution' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:text-slate-700 hover:bg-slate-50'}`}>
                                Cost Distribution
                                {costViewTab === 'distribution' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
                            </button>
                        </div>

                        {costViewTab === 'materials' && (
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <button onClick={handleGenerateAffiliateLinks} disabled={isLoadingAffiliateLinks} className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1 border border-orange-200 disabled:opacity-50">
                                            {isLoadingAffiliateLinks ? 'Generating...' : 'Shop Materials'}
                                        </button>
                                        <button onClick={downloadCSV} className="text-xs bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 px-3 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1 border border-slate-200">
                                            Export to Excel
                                        </button>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-sm text-slate-600 uppercase bg-slate-50 border-b border-slate-100">
                                            <tr>
                                                <th className="px-4 py-3">Item</th>
                                                <th className="px-4 py-3">Qty</th>
                                                <th className="px-4 py-3 text-right">Est. Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result.estimates.breakdown.slice(0, 10).map((item, idx) => (
                                                <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50">
                                                    <td className="px-4 py-3 font-medium text-slate-700">{item.name}</td>
                                                    <td className="px-4 py-3 text-slate-600">{item.quantity}</td>
                                                    <td className="px-4 py-3 text-right text-slate-700">{item.totalCost}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="border-t border-slate-200 bg-slate-50 font-semibold text-slate-800">
                                            <tr>
                                                <td className="px-4 py-3" colSpan={2}>Estimated Total</td>
                                                <td className="px-4 py-3 text-right text-emerald-700">{formatCurrency(result.estimates.totalCost)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        )}

                        {costViewTab === 'distribution' && (
                            <div className="p-6">
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="cost" nameKey="name" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}>
                                                {chartData.map((_, index) => {
                                                    const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];
                                                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                                                })}
                                            </Pie>
                                            <Tooltip formatter={(value: number, name: string) => { const total = chartData.reduce((sum, item) => sum + item.cost, 0); return [`${formatCurrency(value)} (${((value / total) * 100).toFixed(1)}%)`, name]; }} />
                                            <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <p className="text-sm text-slate-600 mt-4 text-center">*Estimates based on national averages. Labor costs may vary by region.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Right Column - Plant Palette Sidebar */}
            {result.estimates.plantPalette && result.estimates.plantPalette.length > 0 && (
                <div className="w-[200px] flex-shrink-0 hidden lg:block">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                            Plant Palette
                        </h3>
                        <div className="space-y-4">
                            {result.estimates.plantPalette.map((plant, index) => (
                                <div key={index} className="group">
                                    {/* Shop in Amazon Button */}
                                    <button
                                        onClick={() => window.open(`https://www.amazon.com/s?k=${encodeURIComponent(plant.common_name + ' plant')}`, '_blank')}
                                        className="w-full mb-2 px-2 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 rounded text-xs font-medium transition-colors"
                                    >
                                        Shop in Amazon
                                    </button>
                                    {/* Plant Image */}
                                    <div
                                        className="w-[100px] h-[100px] mx-auto rounded-lg overflow-hidden bg-slate-100 border border-slate-200 group-hover:border-emerald-400 group-hover:shadow-md transition-all cursor-pointer"
                                        onClick={() => setSelectedPlant(plant)}
                                    >
                                        {plant.image_url ? (
                                            <img src={plant.image_url} alt={plant.common_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-700 font-medium text-center mt-1 truncate" title={plant.common_name}>{plant.common_name}</p>
                                    <p className="text-sm text-slate-600 text-center">{plant.unit_price}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Plant Detail Modal */}
            {selectedPlant && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedPlant(null)}>
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-slate-800">{selectedPlant.common_name}</h3>
                            <button onClick={() => setSelectedPlant(null)} className="text-slate-400 hover:text-slate-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        {selectedPlant.image_url && <img src={selectedPlant.image_url} alt={selectedPlant.common_name} className="w-full h-48 object-cover rounded-lg mb-4" />}
                        <div className="space-y-2 text-sm">
                            {selectedPlant.botanical_name && <p><span className="font-medium text-slate-600">Botanical:</span> {selectedPlant.botanical_name}</p>}
                            {selectedPlant.size && <p><span className="font-medium text-slate-600">Size:</span> {selectedPlant.size}</p>}
                            {selectedPlant.quantity && <p><span className="font-medium text-slate-600">Quantity:</span> {selectedPlant.quantity}</p>}
                            {selectedPlant.unit_price && <p><span className="font-medium text-slate-600">Unit Price:</span> {selectedPlant.unit_price}</p>}
                            {selectedPlant.total_estimate && <p><span className="font-medium text-slate-600">Total:</span> {selectedPlant.total_estimate}</p>}
                            {selectedPlant.rag_verified && <p className="text-emerald-600 font-medium">✅ Verified from database</p>}
                        </div>
                        <button
                            onClick={() => window.open(`https://www.amazon.com/s?k=${encodeURIComponent(selectedPlant.common_name + ' plant')}`, '_blank')}
                            className="w-full mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
                        >
                            Shop on Amazon
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResultsViewV2;
