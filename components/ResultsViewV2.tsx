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
import { ContactDesignerModal } from './ContactDesignerModal';

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
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);

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
                // Categorize all items from the breakdown
                const allItems = result.estimates.breakdown;

                const plants = allItems.filter(item =>
                    item.name.toLowerCase().includes('plant') ||
                    item.name.toLowerCase().includes('tree') ||
                    item.name.toLowerCase().includes('shrub') ||
                    item.name.toLowerCase().includes('flower') ||
                    item.name.toLowerCase().includes('grass') ||
                    item.name.toLowerCase().includes('hedge') ||
                    item.name.toLowerCase().includes('vine') ||
                    item.name.toLowerCase().includes('fern')
                ).map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    description: item.notes
                }));

                const hardscape = allItems.filter(item =>
                    item.name.toLowerCase().includes('paver') ||
                    item.name.toLowerCase().includes('stone') ||
                    item.name.toLowerCase().includes('brick') ||
                    item.name.toLowerCase().includes('gravel') ||
                    item.name.toLowerCase().includes('concrete') ||
                    item.name.toLowerCase().includes('pathway') ||
                    item.name.toLowerCase().includes('patio') ||
                    item.name.toLowerCase().includes('deck') ||
                    item.name.toLowerCase().includes('retaining')
                ).map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    description: item.notes
                }));

                const furniture = allItems.filter(item =>
                    item.name.toLowerCase().includes('bench') ||
                    item.name.toLowerCase().includes('chair') ||
                    item.name.toLowerCase().includes('table') ||
                    item.name.toLowerCase().includes('sofa') ||
                    item.name.toLowerCase().includes('lounger') ||
                    item.name.toLowerCase().includes('umbrella') ||
                    item.name.toLowerCase().includes('swing') ||
                    item.name.toLowerCase().includes('hammock')
                ).map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    description: item.notes
                }));

                const features = allItems.filter(item =>
                    item.name.toLowerCase().includes('fountain') ||
                    item.name.toLowerCase().includes('pond') ||
                    item.name.toLowerCase().includes('fire') ||
                    item.name.toLowerCase().includes('light') ||
                    item.name.toLowerCase().includes('sculpture') ||
                    item.name.toLowerCase().includes('pergola') ||
                    item.name.toLowerCase().includes('arbor') ||
                    item.name.toLowerCase().includes('trellis') ||
                    item.name.toLowerCase().includes('fence') ||
                    item.name.toLowerCase().includes('gate')
                ).map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    description: item.notes
                }));

                // Include remaining uncategorized items as structures
                const categorizedNames = [...plants, ...hardscape, ...furniture, ...features].map(i => i.name);
                const structures = allItems.filter(item =>
                    !categorizedNames.includes(item.name)
                ).map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    description: item.notes
                }));

                // Only proceed if we have items to search
                if (plants.length === 0 && hardscape.length === 0 && furniture.length === 0 && features.length === 0 && structures.length === 0) {
                    setIsLoadingBudget(false);
                    return;
                }

                const response = await fetch('http://localhost:8002/api/enhance-with-rag', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ plants, hardscape, features, structures, furniture }),
                });

                if (!response.ok) throw new Error('Failed to fetch RAG budget');
                const data = await response.json();

                if (data.success) {
                    const lineItems: RAGItem[] = [];

                    // Process all categories from RAG response
                    const processItems = (items: any[], category: string) => {
                        if (!items || !Array.isArray(items)) return;
                        items.forEach((p: any) => {
                            const priceStr = p.unit_price || p.price_estimate || "$0";
                            const price = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
                            const quantity = typeof p.quantity === 'number' ? p.quantity : 1;
                            lineItems.push({
                                item: p.original_name || p.common_name || p.name || category,
                                match: p.common_name || p.match || p.name,
                                price_estimate: priceStr,
                                cost: price * quantity,
                                image_url: p.image_url
                            });
                        });
                    };

                    // Process plant palette (main category)
                    processItems(data.plantPalette, 'Plant');

                    // Process other categories if they exist
                    processItems(data.hardscape, 'Hardscape');
                    processItems(data.furniture, 'Furniture');
                    processItems(data.features, 'Feature');
                    processItems(data.structures, 'Structure');

                    // Also check for a generic "items" or "results" array
                    processItems(data.items, 'Item');
                    processItems(data.results, 'Item');

                    if (lineItems.length > 0) {
                        setRagBudget({
                            total_min_budget: lineItems.reduce((sum, item) => sum + item.cost, 0),
                            line_items: lineItems
                        });
                    }
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

    const handleExportToGoogleSheets = async () => {
        try {
            const headers = ["Material / Item", "Quantity", "Unit Cost", "Estimated Cost", "Notes"];
            const rows = result.estimates.breakdown.map(item => [
                item.name,
                item.quantity,
                item.unitCost,
                item.totalCost,
                item.notes
            ]);

            // Format as TSV for pasting into Sheets
            const tsvContent = [
                headers.join('\t'),
                ...rows.map(row => row.join('\t')),
                '',
                ['ESTIMATED TOTAL', '', '', formatCurrency(result.estimates.totalCost), ''].join('\t')
            ].join('\n');

            await navigator.clipboard.writeText(tsvContent);

            // Open new sheet and notify user
            window.open('https://sheets.new', '_blank');
            alert('Data copied to clipboard! \n\n1. A new Google Sheet has been opened.\n2. Click inside cell A1.\n3. Press Ctrl+V (or Cmd+V) to paste your estimates.');

        } catch (err) {
            console.error('Failed to export to Google Sheets:', err);
            alert('Failed to copy data to clipboard. Please try again.');
        }
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
        }
    };

    const handleEditModeSave = async (annotatedImage: string, annotations: Annotation[]) => {
        if (!result || !result.renderImages[currentRenderIndex] || annotations.length === 0) {
            alert('Please add at least one annotation before applying changes.');
            return;
        }

        setIsRegenerating(true);
        setIsImageEditMode(false);

        try {
            const originalRender = result.renderImages[currentRenderIndex];
            let yardImageFile: File | null = null;
            if (originalImage && originalImage.startsWith('data:')) {
                const response = await fetch(originalImage);
                const blob = await response.blob();
                yardImageFile = new File([blob], 'yard.jpg', { type: 'image/jpeg' });
            } else if (originalImage) {
                const response = await fetch(originalImage);
                const blob = await response.blob();
                yardImageFile = new File([blob], 'yard.jpg', { type: 'image/jpeg' });
            }

            const newRenderImage = await analyzeAndRegenerateDesign(
                originalRender,
                annotatedImage,
                annotations,
                yardImageFile
            );

            const updatedRenderImages = [...result.renderImages];
            updatedRenderImages[currentRenderIndex] = newRenderImage;

            const updatedResult: GeneratedDesign = {
                ...result,
                renderImages: updatedRenderImages
            };

            setLocalResult(updatedResult);
            if (contextResult && !propResult) {
                setContextResult(updatedResult);
            }
            alert('✅ Design updated successfully! Your changes have been applied.');
        } catch (error) {
            console.error('Error regenerating design:', error);
            alert('❌ Failed to apply changes. Please try again.');
            setIsImageEditMode(true);
        } finally {
            setIsRegenerating(false);
        }
    };

    return (
        <div className="flex gap-6 animate-fade-in pb-12" style={{ fontFamily: "'Montserrat', sans-serif" }}>
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

                        {/* Save Your Design - Compact */}
                        {/* Save Privately Button */}
                        <button
                            onClick={() => {
                                const saveEvent = new CustomEvent('saveDesign', {
                                    detail: {
                                        isPublic: false,
                                        design: result,
                                        yardImageUrl: originalImage
                                    }
                                });
                                window.dispatchEvent(saveEvent);
                            }}
                            className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium text-sm transition-all flex items-center gap-2 shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Save Privately
                        </button>

                        {/* Share to Gallery Button */}
                        <button
                            onClick={() => {
                                const saveEvent = new CustomEvent('saveDesign', {
                                    detail: {
                                        isPublic: true,
                                        design: result,
                                        yardImageUrl: originalImage
                                    }
                                });
                                window.dispatchEvent(saveEvent);
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium text-sm transition-all flex items-center gap-2 shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Share to Gallery
                        </button>
                        {/* Edit Design Button */}
                        <button
                            onClick={() => {
                                setActiveTab('render');
                                setIsImageEditMode(true);
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Edit Design
                        </button>

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
                            onClick={() => setIsContactModalOpen(true)}
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
                            <button
                                onClick={() => setActiveTab('compare')}
                                className={`w-full text-sm text-center py-1 border-b border-slate-100 font-medium transition-colors ${activeTab === 'compare' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 bg-slate-50 hover:text-slate-700 hover:bg-slate-100'}`}
                            >
                                Compare (Slider)
                            </button>
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
                        {/* Edit Mode Canvas Overlay */}
                        {isImageEditMode && activeTab === 'render' && result.renderImages[currentRenderIndex] && (
                            <div className="absolute inset-0 z-50">
                                <EditModeCanvas
                                    imageUrl={result.renderImages[currentRenderIndex]}
                                    onSave={handleEditModeSave}
                                    onCancel={() => setIsImageEditMode(false)}
                                />
                            </div>
                        )}

                        {/* Loading overlay for regeneration */}
                        {isRegenerating && (
                            <div className="absolute inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                                <div className="bg-white rounded-2xl p-8 text-center max-w-md">
                                    <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-2">Applying Your Changes</h3>
                                    <p className="text-slate-600">Analyzing your annotations and generating an updated design...</p>
                                </div>
                            </div>
                        )}



                        {activeTab === 'compare' && originalImage && result.renderImages[currentRenderIndex] && (
                            <BeforeAfterSlider beforeImage={originalImage} afterImage={result.renderImages[currentRenderIndex]} className="w-full h-full" />
                        )}
                        {activeTab === 'original' && originalImage && (
                            <img src={originalImage} alt="Original yard" className="w-full h-full object-contain" />
                        )}
                        {activeTab === 'render' && result.renderImages[currentRenderIndex] && (
                            <div className="relative w-full h-full">
                                {isImageEditMode ? (
                                    /* Edit Mode Canvas */
                                    <EditModeCanvas
                                        imageUrl={result.renderImages[currentRenderIndex]}
                                        onSave={(annotatedImage, annotations) => {
                                            console.log('Annotated image saved:', annotations.length, 'annotations');
                                            // Update the render image with annotations
                                            setIsImageEditMode(false);
                                            // Optionally save the annotated image
                                        }}
                                        onCancel={() => setIsImageEditMode(false)}
                                    />
                                ) : (
                                    <>
                                        <img src={result.renderImages[currentRenderIndex]} alt="Rendered design" className="w-full h-full object-contain" />

                                        {/* Edit Button */}
                                        <button
                                            onClick={() => setIsImageEditMode(true)}
                                            className="absolute top-4 right-4 px-4 py-2 bg-white/90 hover:bg-white text-slate-700 rounded-lg shadow-lg flex items-center gap-2 font-medium text-sm transition-all hover:scale-105"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                            Edit / Annotate
                                        </button>

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

                {/* Design Intention Section */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                    <h3 className="font-bold text-slate-800 text-lg mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                        Design Intention
                    </h3>
                    <div className="space-y-3">
                        {/* Style */}
                        <div className="flex items-start gap-3">
                            <span className="text-sm font-semibold text-slate-500 w-24 flex-shrink-0">Style:</span>
                            <span className="text-sm text-slate-700 font-medium">{result.designJSON?.style || result.analysis?.designConcept?.split('.')[0] || 'Modern Landscape'}</span>
                        </div>
                        {/* User's Request */}
                        {result.designJSON?.userPrompt && (
                            <div className="flex items-start gap-3">
                                <span className="text-sm font-semibold text-slate-500 w-24 flex-shrink-0">Your Request:</span>
                                <span className="text-sm text-slate-700 italic">"{result.designJSON.userPrompt}"</span>
                            </div>
                        )}
                        {/* AI Interpretation */}
                        <div className="flex items-start gap-3">
                            <span className="text-sm font-semibold text-slate-500 w-24 flex-shrink-0">AI Design:</span>
                            <span className="text-sm text-slate-700">{result.concept?.description || result.analysis?.designConcept || 'A thoughtfully designed outdoor space with balanced hardscape and plantings.'}</span>
                        </div>
                        {/* Maintenance */}
                        {result.analysis?.maintenanceLevel && (
                            <div className="flex items-start gap-3">
                                <span className="text-sm font-semibold text-slate-500 w-24 flex-shrink-0">Maintenance:</span>
                                <span className={`text-sm font-medium px-2 py-0.5 rounded ${result.analysis.maintenanceLevel === 'Low' ? 'bg-green-100 text-green-700' : result.analysis.maintenanceLevel === 'High' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {result.analysis.maintenanceLevel}
                                </span>
                            </div>
                        )}
                    </div>
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
                                        <button onClick={handleExportToGoogleSheets} className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1 border border-green-200">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" /><path d="M7 7h2v2H7zm0 4h2v2H7zm0 4h2v2H7zm4-8h6v2h-6zm0 4h6v2h-6zm0 4h6v2h-6z" /></svg>
                                            Export to Sheets
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
                                                {showAffiliateLinks && <th className="px-4 py-3 text-center">Purchase</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result.estimates.breakdown.slice(0, 10).map((item, idx) => {
                                                const affiliateItem = affiliateLinks.get(item.name);
                                                return (
                                                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50">
                                                        <td className="px-4 py-3 font-medium text-slate-700">
                                                            <div className="flex items-center gap-2">
                                                                {item.name}
                                                                {affiliateItem?.verified && (
                                                                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full" title="Verified in render">
                                                                        ✓ Verified
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-600">{item.quantity}</td>
                                                        <td className="px-4 py-3 text-right text-slate-700">{item.totalCost}</td>
                                                        {showAffiliateLinks && (
                                                            <td className="px-4 py-3 text-center">
                                                                {affiliateItem?.amazonSearchUrl ? (
                                                                    <a
                                                                        href={affiliateItem.amazonSearchUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                                                                        title={`Find similar ${item.name} on Amazon`}
                                                                    >
                                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                                            <path d="M23.27 13.73L22 12.5l-1.27-1.23L19.5 12l1.23 1.27L22 14.5l1.27-1.23L24.5 12l-1.23-1.27zM6.32 2.72c-.35-.35-.92-.35-1.27 0L2.72 5.05c-.35.35-.35.92 0 1.27l2.33 2.33c.35.35.92.35 1.27 0l2.33-2.33c.35-.35.35-.92 0-1.27L6.32 2.72zM12 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-8 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm8 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-8-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm8-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                                                                        </svg>
                                                                        Find Similar on Amazon
                                                                    </a>
                                                                ) : (
                                                                    <span className="text-xs text-slate-400">Not available</span>
                                                                )}
                                                            </td>
                                                        )}
                                                    </tr>
                                                );
                                            })}
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
                                            <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="cost" nameKey="name" label={({ name, value, percent }) => `${name}: ${formatCurrency(value)} (${(percent * 100).toFixed(0)}%)`} labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}>
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

            {/* Right Column - Unified Palette Sidebar */}
            <div className="w-[280px] flex-shrink-0 hidden lg:block">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                        Palette {isLoadingBudget && <span className="text-xs text-slate-400">(loading...)</span>}
                    </h3>
                    <div className="space-y-4">
                        {ragBudget?.line_items && ragBudget.line_items.map((item, index) => {
                            // Use Google Shopping image search if image available, otherwise fall back to Amazon text search
                            const shopUrl = item.image_url
                                ? `https://www.google.com/searchbyimage?sbisrc=tg&image_url=${encodeURIComponent(item.image_url)}&tbm=shop`
                                : `https://www.amazon.com/s?k=${encodeURIComponent(item.match || item.item)}`;
                            const isPlant = item.item.toLowerCase().includes('plant') ||
                                item.item.toLowerCase().includes('tree') ||
                                item.item.toLowerCase().includes('shrub') ||
                                item.item.toLowerCase().includes('flower');

                            return (
                                <div key={`rag-${index}`} className="group">
                                    <div className={`relative w-full aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200 ${isPlant ? 'group-hover:border-emerald-400' : 'group-hover:border-blue-400'} group-hover:shadow-md transition-all`}>
                                        {item.image_url ? (
                                            <img src={item.image_url} alt={item.match || item.item} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                        ) : (
                                            <div className={`w-full h-full flex items-center justify-center ${isPlant ? 'bg-gradient-to-br from-emerald-50 to-green-100' : 'bg-gradient-to-br from-blue-50 to-slate-100'}`}>
                                                {isPlant ? (
                                                    <svg className="w-10 h-10 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                                                ) : (
                                                    <svg className="w-10 h-10 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                                )}
                                            </div>
                                        )}
                                        {/* Shop Button Inside - Uses Google Lens for image search */}
                                        <a
                                            href={shopUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`absolute bottom-1 right-1 px-1.5 py-0.5 ${isPlant ? 'bg-amber-400/90 hover:bg-amber-500 text-amber-900' : 'bg-blue-400/90 hover:bg-blue-500 text-white'} rounded text-[14px] font-bold transition-colors shadow-sm`}
                                            onClick={e => e.stopPropagation()}
                                        >
                                            Shop
                                        </a>
                                        {/* Type badge */}
                                        <span className={`absolute top-1 left-1 px-1.5 py-0.5 ${isPlant ? 'bg-emerald-500/80' : 'bg-blue-500/80'} text-white rounded text-[14px] font-medium`}>
                                            {isPlant ? 'Plant' : 'Material'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-700 font-medium text-center mt-1.5 truncate" title={item.match || item.item}>{item.match || item.item}</p>
                                    <p className="text-xs text-slate-500 text-center">{item.price_estimate}</p>
                                </div>
                            );
                        })}

                        {(!ragBudget?.line_items || ragBudget.line_items.length === 0) && result.estimates.plantPalette && result.estimates.plantPalette.map((plant, index) => {
                            // Use Google Shopping image search if image available, otherwise fall back to Amazon text search
                            const shopUrl = plant.image_url
                                ? `https://www.google.com/searchbyimage?sbisrc=tg&image_url=${encodeURIComponent(plant.image_url)}&tbm=shop`
                                : `https://www.amazon.com/s?k=${encodeURIComponent(plant.common_name + ' live plant')}&i=lawngarden`;

                            return (
                                <div key={`plant-${index}`} className="group">
                                    <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200 group-hover:border-emerald-400 group-hover:shadow-md transition-all">
                                        {plant.image_url ? (
                                            <img src={plant.image_url} alt={plant.common_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100">
                                                <svg className="w-10 h-10 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                                            </div>
                                        )}
                                        {/* Shop Button Inside - Uses Google Lens for image search */}
                                        <a
                                            href={shopUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-amber-400/90 hover:bg-amber-500 text-amber-900 rounded text-[14px] font-bold transition-colors shadow-sm"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            Shop
                                        </a>
                                        {/* Plant type badge */}
                                        <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-emerald-500/80 text-white rounded text-[14px] font-medium">
                                            Plant
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-700 font-medium text-center mt-1.5 truncate" title={plant.common_name}>{plant.common_name}</p>
                                    <p className="text-sm text-slate-500 text-center">{plant.unit_price}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

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

            {/* Contact Designer Modal */}
            <ContactDesignerModal
                isOpen={isContactModalOpen}
                onClose={() => setIsContactModalOpen(false)}
                designLink={currentShortId ? `${window.location.origin}/result/${currentShortId}` : window.location.href}
            />
        </div>
    );
};

export default ResultsViewV2;
