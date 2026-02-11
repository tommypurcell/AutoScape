import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GeneratedDesign } from '../types';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { saveDesign, adjustUserCredits, updateDesignVideoUrl } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';
import { useDesign } from '../contexts/DesignContext';
import { getVideoEndpoint } from '../config/api';
import { Loader, Facebook, Twitter, Mail, MessageCircle, Check, Copy, Download, Share2 } from 'lucide-react';
import { generateLandscapeDesign, analyzeAndRegenerateDesign, Annotation } from '../services/geminiService';
import { EditModeCanvas } from './EditModeCanvas';
import { uploadVideo } from '../services/storageService';
import { generateAffiliateLinks, VerifiedMaterialItem } from '../services/affiliateService';

interface ResultsViewProps {
    result?: GeneratedDesign;
    originalImage?: string | null;
    onReset?: () => void;
    designShortId?: string;
    designId?: string;
    designUserId?: string;
    existingVideoUrl?: string | null;
}

export const ResultsViewV2: React.FC<ResultsViewProps> = ({
    result: propResult,
    originalImage: propOriginalImage,
    onReset: propOnReset,
    designShortId,
    designId: propDesignId,
    existingVideoUrl
}) => {
    const navigate = useNavigate();
    const { user, credits, setCredits } = useAuth();
    const { result: ctxResult, yardImagePreview, resetDesign, setResult: setCtxResult } = useDesign();

    const [localResult, setLocalResult] = useState<GeneratedDesign | null>(propResult || ctxResult);
    const result = localResult || propResult || ctxResult;
    const originalImage = propOriginalImage || yardImagePreview;
    const onReset = propOnReset || (() => { resetDesign(); navigate('/create'); });

    const [currentRenderIndex, setCurrentRenderIndex] = useState(0);
    const [currentShortId, setCurrentShortId] = useState<string | null>(designShortId || null);
    const [videoUrl, setVideoUrl] = useState<string | null>(existingVideoUrl || null);
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    const [altRenders, setAltRenders] = useState<string[]>([]);
    const [isGeneratingAlts, setIsGeneratingAlts] = useState(false);
    const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'compare' | 'original' | 'render' | 'plan' | 'video'>('compare');
    const [isImageEditMode, setIsImageEditMode] = useState(false);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [isLoadingAffiliateLinks, setIsLoadingAffiliateLinks] = useState(false);
    const [affiliateLinks, setAffiliateLinks] = useState<Map<string, VerifiedMaterialItem>>(new Map());
    const [showAffiliateLinks, setShowAffiliateLinks] = useState(false);
    const [generatingProvider, setGeneratingProvider] = useState<'gemini' | 'freepik' | null>(null);
    const [videoError, setVideoError] = useState<string | null>(null);
    const [freepikVideoUrl, setFreepikVideoUrl] = useState<string | null>(null);
    const [geminiVideoUrl, setGeminiVideoUrl] = useState<string | null>(null);
    const [isSavingVideo, setIsSavingVideo] = useState(false);

    // Use propDesignId for current design ID
    const currentDesignId = propDesignId;

    // RAG budget data (from result if available)
    const ragBudget = (result as any)?.ragBudget || null;

    useEffect(() => {
        setLocalResult(propResult || ctxResult);
        if (propResult) setCtxResult(propResult);
    }, [propResult, ctxResult, setCtxResult]);

    useEffect(() => {
        if (!result) navigate('/create');
    }, [result, navigate]);

    if (!result) return null;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);
    };

    const chartData = useMemo(() => {
        const categories: Record<string, number> = { Hardscape: 0, Plants: 0, Labor: 0, Other: 0 };
        result.estimates.breakdown.forEach(item => {
            const name = item.name.toLowerCase();
            const cost = parseFloat(item.totalCost.replace(/[^0-9.]/g, '')) || 0;
            if (name.includes('labor') || name.includes('install')) categories.Labor += cost;
            else if (name.includes('paver') || name.includes('stone') || name.includes('concrete') || name.includes('gravel') || name.includes('deck') || name.includes('patio') || name.includes('fence') || name.includes('wall')) categories.Hardscape += cost;
            else if (name.includes('plant') || name.includes('tree') || name.includes('shrub') || name.includes('flower') || name.includes('sod')) categories.Plants += cost;
            else categories.Other += cost;
        });
        return Object.entries(categories).filter(([, v]) => v > 0).map(([name, cost]) => ({ name, cost }));
    }, [result.estimates.breakdown]);

    const ensureSaved = async (): Promise<string | null> => {
        if (currentShortId) return currentShortId;
        setIsSaving(true);
        try {
            const ownerId = user?.uid || 'anonymous';
            const { shortId } = await saveDesign(ownerId, { ...result, yardImageUrl: originalImage }, false);
            setCurrentShortId(shortId);
            window.history.replaceState({}, '', `/result/${shortId}`);
            return shortId;
        } catch (e) {
            console.error(e);
            alert('Could not save design for sharing.');
            return null;
        } finally {
            setIsSaving(false);
        }
    };

    const handleCopyLink = async () => {
        const id = await ensureSaved();
        if (!id) return;
        const url = `${window.location.origin}/result/${id}`;
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const handleShareClick = async () => {
        if (isShareMenuOpen) {
            setIsShareMenuOpen(false);
            return;
        }

        const shortId = await ensureSaved();
        if (shortId) {
            setShareUrl(`${window.location.origin}/result/${shortId}`);
            setIsShareMenuOpen(true);
        }
    };

    // Original handleShareLink modified to use new logic if separate button kept
    const handleShareLink = async () => {
        const shortId = await ensureSaved();
        if (shortId) {
            const url = `${window.location.origin}/result/${shortId}`;
            navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSocialShare = async (platform: 'facebook' | 'twitter' | 'email' | 'text' | 'copy' | 'download') => {
        if (!shareUrl && platform !== 'download') return;

        const text = `Just redesigned my yard with AutoScape! Check it out:`;
        const url = shareUrl || window.location.href;

        switch (platform) {
            case 'facebook':
                // Facebook web share only takes a URL
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                break;
            case 'twitter':
                window.open(`https://www.twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}&hashtags=autoscape,landscapedesign`, '_blank');
                break;
            case 'email':
                window.open(`mailto:?subject=${encodeURIComponent("Check out my AutoScape Garden Design")}&body=${encodeURIComponent(text + "\n\n" + url)}`);
                break;
            case 'text':
                window.open(`sms:?body=${encodeURIComponent(text + " " + url)}`);
                break;
            case 'copy':
                navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
                break;
            case 'download':
                if (result.renderImages[currentRenderIndex]) {
                    const link = document.createElement('a');
                    link.href = result.renderImages[currentRenderIndex];
                    link.download = `autoscape-design-${currentRenderIndex + 1}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
                break;
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

    const handleGenerateVideo = async (provider: 'gemini' | 'freepik' = 'gemini') => {
        if (!originalImage || !result.renderImages[currentRenderIndex]) return;
        setIsGeneratingVideo(true);
        setGeneratingProvider(provider);
        setVideoError(null);
        try {
            // Helper function to convert URL to base64
            const getBase64 = async (url: string, imageName: string): Promise<string> => {
                // If already a data URL, extract the base64 part
                if (url.startsWith('data:')) return url.split(',')[1];

                try {
                    const response = await fetch(url);
                    const blob = await response.blob();
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve((reader.result as string).split(',')[1]);
                        reader.onerror = () => reject(new Error(`Failed to read ${imageName}`));
                        reader.readAsDataURL(blob);
                    });
                } catch (fetchError) {
                    // If CORS error, try using an Image element approach
                    console.warn(`CORS issue with ${imageName}, trying canvas approach...`);
                    return new Promise((resolve, reject) => {
                        const img = new Image();
                        img.crossOrigin = 'anonymous';
                        img.onload = () => {
                            try {
                                const canvas = document.createElement('canvas');
                                canvas.width = img.naturalWidth;
                                canvas.height = img.naturalHeight;
                                const ctx = canvas.getContext('2d');
                                if (!ctx) {
                                    reject(new Error('Failed to create canvas context'));
                                    return;
                                }
                                ctx.drawImage(img, 0, 0);
                                const dataUrl = canvas.toDataURL('image/png');
                                resolve(dataUrl.split(',')[1]);
                            } catch (canvasError) {
                                reject(new Error(`CORS policy prevents accessing ${imageName}. Please configure Firebase Storage CORS settings.`));
                            }
                        };
                        img.onerror = () => {
                            reject(new Error(`CORS policy prevents accessing ${imageName}. Please configure Firebase Storage CORS settings.`));
                        };
                        img.src = url;
                    });
                }
            };

            console.log(`Starting video generation (${provider})...`);

            const [originalBase64, redesignBase64] = await Promise.all([
                getBase64(originalImage, 'original image'),
                getBase64(result.renderImages[currentRenderIndex], 'rendered image')
            ]);

            // Use centralized API config for video generation
            const videoApiUrl = getVideoEndpoint();

            const response = await fetch(videoApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    original_image: originalBase64,
                    redesign_image: redesignBase64,
                    duration: 5,
                    provider: provider
                }),
            });
            const data = await response.json();

            // Check both HTTP status and response body status
            if (!response.ok || data.status === 'error') {
                const errorMsg = data.error || data.detail || 'Failed to generate video';
                // Check if it's a quota error and suggest Freepik
                if (errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('quota')) {
                    throw new Error(`Gemini quota exceeded. Try using Freepik (Fast) instead!`);
                }
                throw new Error(errorMsg);
            }

            // Set specific provider URL
            if (provider === 'freepik') {
                setFreepikVideoUrl(data.video_url);
            } else {
                setGeminiVideoUrl(data.video_url);
                setVideoUrl(data.video_url); // Primary for backward compat
            }

            setActiveTab('video');

            // Try to save the video to Firebase Storage if we have a design ID
            // Only upload if it's a real base64 video (not external URL from mock)
            if (currentDesignId && user && data.video_url.startsWith('data:')) {
                setIsSavingVideo(true);
                try {
                    console.log(`📹 Saving ${provider} video to Firebase Storage...`);
                    const videoPath = `designs/${user.uid}/videos/${currentDesignId}_${provider}_${Date.now()}.mp4`;
                    const persistentVideoUrl = await uploadVideo(data.video_url, videoPath);

                    // Update local state with persistent URL
                    if (provider === 'freepik') {
                        setFreepikVideoUrl(persistentVideoUrl);
                    } else {
                        setGeminiVideoUrl(persistentVideoUrl);
                        setVideoUrl(persistentVideoUrl);
                        // Only update main doc with Gemini video (primary)
                        await updateDesignVideoUrl(currentDesignId, persistentVideoUrl);
                    }
                    console.log('✅ Video saved to Firebase Storage');
                } catch (saveError) {
                    console.error('Failed to save video to Firebase (video still available locally):', saveError);
                }
                setIsSavingVideo(false);
            } else if (data.video_url.startsWith('http')) {
                // External URL (mock video) - just use it directly, optionally save to Firestore
                console.log(`📹 Using external video URL (${provider}): ${data.video_url.substring(0, 50)}...`);
                if (currentDesignId && provider === 'gemini') {
                    // Save external URL to Firestore for Gemini videos
                    await updateDesignVideoUrl(currentDesignId, data.video_url);
                }
            }
        } catch (err) {
            console.error('Video generation error:', err);
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setVideoError(errorMessage);
        } finally {
            setIsGeneratingVideo(false);
            setGeneratingProvider(null);
        }
    };

    const handleEditModeSave = async (annotatedImage: string, annotations: Annotation[]) => {
        if (!result || !result.renderImages[currentRenderIndex] || annotations.length === 0) {
            alert('Please add at least one annotation before applying changes.');
            return;
        }

        // Check credits before applying changes
        try {
            const { getUserCredits, hasEnoughCredits } = await import('../services/creditService');

            if (user) {
                const hasCredits = await hasEnoughCredits(user.uid, 1);
                if (!hasCredits) {
                    // Redirect to pricing page with message
                    navigate('/pricing?message=insufficient_credits');
                    return;
                }
            } else {
                // For anonymous users, check localStorage
                const anonymousCreditsUsed = parseInt(localStorage.getItem('anonymousCreditsUsed') || '0');
                if (anonymousCreditsUsed >= 2) {
                    navigate('/pricing?message=insufficient_credits');
                    return;
                }
            }
        } catch (error) {
            console.error('Error checking credits:', error);
            // Continue with generation if credit check fails (graceful degradation)
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
            if (ctxResult && !propResult) {
                setCtxResult(updatedResult);
            }

            // Deduct credit after successful regeneration
            try {
                const { useCredits } = await import('../services/creditService');
                if (user) {
                    await useCredits(user.uid, 1);
                } else {
                    // For anonymous users, track in localStorage
                    const anonymousCreditsUsed = parseInt(localStorage.getItem('anonymousCreditsUsed') || '0');
                    localStorage.setItem('anonymousCreditsUsed', (anonymousCreditsUsed + 1).toString());
                }
                // Dispatch event to update credit display
                window.dispatchEvent(new CustomEvent('creditsUpdated'));
            } catch (creditError) {
                console.error('Error deducting credits:', creditError);
                // Don't block the user if credit deduction fails
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

    const handleGenerateAlternatives = async () => {
        setIsGeneratingAlts(true);
        try {
            // TODO: Implement alternative render generation
            // This would call the design generation API with slightly different parameters
            console.log('Generating alternative renders...');
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
            // For now, just add placeholder URLs
            setAltRenders([result.renderImages[0], result.renderImages[0]]);
        } catch (error) {
            console.error('Error generating alternatives:', error);
            alert('Failed to generate alternatives. Please try again.');
        } finally {
            setIsGeneratingAlts(false);
        }
    };

    const handleRedesignWith = async (imageUrl: string) => {
        try {
            // TODO: Implement redesign with selected image
            console.log('Redesigning with image:', imageUrl);
            alert('Redesign feature coming soon!');
        } catch (error) {
            console.error('Error redesigning:', error);
            alert('Failed to redesign. Please try again.');
        }
    };

    return (
        <div className="pb-12 animate-fade-in" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            <div className="flex gap-6">
                {/* Left Column - Main Content */}
                <div className="flex-1 space-y-6 min-w-0">

                    {/* Header - Matches Wireframe */}
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col items-start gap-2">
                            <h2 className="text-2xl font-bold text-slate-800">Your Redesign</h2>
                            {/* Share Link Button - Moved Here */}
                            <button
                                disabled={isSaving}
                                onClick={handleShareLink}
                                className={`px-3 py-1.5 border rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${isSaving ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-wait' : 'bg-white border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-slate-700'}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                {isSaving ? 'Saving...' : copied ? 'Copied!' : currentShortId ? 'Copy link' : 'Share link'}
                            </button>
                        </div>
                        <div className="flex items-stretch gap-3">

                            {/* Edit Design Button - Orange */}
                            <button
                                onClick={() => {
                                    setActiveTab('render');
                                    setIsImageEditMode(true);
                                }}
                                className="w-28 px-2 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium text-sm text-center leading-tight transition-colors shadow-sm flex items-center justify-center"
                            >
                                Edit Design
                            </button>

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
                                className="w-28 px-2 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium text-sm text-center leading-tight transition-all shadow-sm flex items-center justify-center"
                            >
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
                                className="w-28 px-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm text-center leading-tight transition-all shadow-sm flex items-center justify-center"
                            >
                                Share to Gallery
                            </button>

                            {/* Contact Designer Button */}
                            <button
                                onClick={() => setIsContactModalOpen(true)}
                                className="w-28 px-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm text-center leading-tight transition-all flex items-center justify-center"
                            >
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
                                        {activeTab === 'original' && <div className="absolute bottom-0 left-0 right-0 h-px bg-emerald-500" />}
                                    </button>
                                    <button onClick={() => setActiveTab('render')} className={`flex-1 py-3 text-sm font-medium transition-colors relative border-l border-slate-100 ${activeTab === 'render' || activeTab === 'compare' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:text-slate-700 hover:bg-slate-50'}`}>
                                        Render
                                        {(activeTab === 'render' || activeTab === 'compare') && <div className="absolute bottom-0 left-0 right-0 h-px bg-emerald-500" />}
                                    </button>
                                </div>
                            </div>
                            <button onClick={() => setActiveTab('plan')} className={`flex-1 py-4 text-sm font-medium transition-colors relative border-r border-slate-100 ${activeTab === 'plan' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:text-slate-700 hover:bg-slate-50'}`}>
                                2D Plan
                                {activeTab === 'plan' && <div className="absolute bottom-0 left-0 right-0 h-px bg-emerald-500" />}
                            </button>
                            <button onClick={() => setActiveTab('video')} className={`flex-1 py-4 text-sm font-medium transition-colors relative ${activeTab === 'video' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:text-slate-700 hover:bg-slate-50'}`}>
                                Video
                                {activeTab === 'video' && <div className="absolute bottom-0 left-0 right-0 h-px bg-emerald-500" />}
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

                                            {/* SHARE BUTTON (Bottom Right of Render) */}
                                            <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2 z-10">
                                                {isShareMenuOpen && (
                                                    <div className="bg-white rounded-xl shadow-2xl p-2 flex flex-col gap-1 mb-2 animate-fade-in border border-slate-100 min-w-[160px]">
                                                        <button onClick={() => handleSocialShare('facebook')} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg text-slate-700 text-sm transition-colors text-left w-full">
                                                            <Facebook className="w-4 h-4 text-blue-600" /> Facebook
                                                        </button>
                                                        <button onClick={() => handleSocialShare('twitter')} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg text-slate-700 text-sm transition-colors text-left w-full">
                                                            <Twitter className="w-4 h-4 text-sky-500" /> Twitter
                                                        </button>
                                                        <button onClick={() => handleSocialShare('email')} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg text-slate-700 text-sm transition-colors text-left w-full">
                                                            <Mail className="w-4 h-4 text-slate-500" /> Email
                                                        </button>
                                                        <button onClick={() => handleSocialShare('text')} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg text-slate-700 text-sm transition-colors text-left w-full">
                                                            <MessageCircle className="w-4 h-4 text-green-500" /> Text Message
                                                        </button>
                                                        <div className="h-px bg-slate-100 my-1"></div>
                                                        <button onClick={() => handleSocialShare('copy')} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg text-slate-700 text-sm transition-colors text-left w-full">
                                                            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                                                            {copied ? 'Copied Link' : 'Copy Link'}
                                                        </button>
                                                        <button onClick={() => handleSocialShare('download')} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg text-slate-700 text-sm transition-colors text-left w-full">
                                                            <Download className="w-4 h-4 text-slate-500" /> Download Image
                                                        </button>
                                                    </div>
                                                )}

                                                <button
                                                    onClick={handleShareClick}
                                                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-bold transform hover:-translate-y-0.5"
                                                >
                                                    {isSaving ? (
                                                        <Loader className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <Share2 className="w-5 h-5" />
                                                    )}
                                                    Share Render
                                                </button>
                                            </div>

                                            {/* Design intention */}
                                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                                                <h3 className="text-lg font-bold text-slate-800">Design Intention</h3>
                                                <div className="text-sm text-slate-700 space-y-1">
                                                    <div><span className="font-semibold text-slate-600">Style:</span> {result.designJSON?.style || result.analysis?.designConcept || 'Modern Landscape'}</div>
                                                    {result.designJSON?.userPrompt && <div><span className="font-semibold text-slate-600">Your Request:</span> "{result.designJSON.userPrompt}"</div>}
                                                    <div><span className="font-semibold text-slate-600">Concept:</span> {result.concept?.description || result.analysis?.designConcept || 'Balanced hardscape and plantings.'}</div>
                                                    {result.analysis?.maintenanceLevel && <div><span className="font-semibold text-slate-600">Maintenance:</span> {result.analysis.maintenanceLevel}</div>}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Content below image display */}
                        <div className="space-y-6">
                            {/* 1) Compare */}
                            {activeTab === 'render' && originalImage && result.renderImages[currentRenderIndex] && (
                                <div className="bg-white rounded-2xl shadow border border-slate-200 p-4">
                                    <h3 className="text-lg font-bold text-slate-800 mb-3">Compare</h3>
                                    <div className="aspect-video">
                                        <BeforeAfterSlider beforeImage={originalImage} afterImage={result.renderImages[currentRenderIndex]} className="w-full h-full" />
                                    </div>
                                </div>
                            )}

                            {/* 2) Originals / Render */}
                            <div className="grid md:grid-cols-2 gap-4">
                                {originalImage && (
                                    <div className="bg-white border border-slate-200 rounded-xl p-3">
                                        <h4 className="text-sm font-semibold text-slate-700 mb-2">Original</h4>
                                        <img src={originalImage} className="w-full rounded-lg object-contain" />
                                    </div>
                                )}
                                {result.renderImages[currentRenderIndex] && (
                                    <div className="bg-white border border-slate-200 rounded-xl p-3">
                                        <h4 className="text-sm font-semibold text-slate-700 mb-2">Rendered</h4>
                                        <img src={result.renderImages[currentRenderIndex]} className="w-full rounded-lg object-contain" />
                                    </div>
                                )}
                            </div>

                            {/* 3) 2D Plan */}
                            {result.planImage && (
                                <div className="bg-white rounded-2xl shadow border border-slate-200 p-4">
                                    <h3 className="text-lg font-bold text-slate-800 mb-3">2D Plan</h3>
                                    <img src={result.planImage} alt="2D plan" className="w-full rounded-xl border border-slate-100 object-contain" />
                                </div>
                            )}

                            {/* 4) Video Generation */}
                            <div className="bg-white rounded-2xl shadow border border-slate-200 p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-slate-800">Video Generation</h3>
                                    <span className="text-sm text-slate-500">Credits: {user ? credits : 0}</span>
                                </div>
                                {videoUrl ? (
                                    <video src={videoUrl} controls autoPlay muted loop className="w-full rounded-xl border border-slate-100 bg-black" />
                                ) : (
                                    <p className="text-sm text-slate-600">No video yet.</p>
                                )}
                                <button
                                    onClick={handleGenerateVideo}
                                    disabled={isGeneratingVideo || !user || credits <= 0}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60 flex items-center gap-2 w-fit"
                                >
                                    {isGeneratingVideo && <Loader className="w-4 h-4 animate-spin" />}
                                    Generate with Credit
                                </button>
                                {!user && <p className="text-sm text-slate-500">Sign in to use credits.</p>}
                                {user && credits <= 0 && <p className="text-sm text-red-500">No credits remaining.</p>}
                            </div>

                            {/* Material list */}
                            {result.estimates.totalCost > 0 && (
                                <div className="bg-white rounded-2xl shadow border border-slate-200 p-4 space-y-4">
                                    <h3 className="text-lg font-bold text-slate-800">Material List & Estimates</h3>
                                    <div className="grid md:grid-cols-2 gap-3">
                                        {result.estimates.breakdown.slice(0, 10).map((item, idx) => {
                                            const ragThumb = ragBudget?.line_items?.find(
                                                (li) => li.item === item.name || li.match === item.name
                                            )?.image_url;
                                            const plantThumb = result.estimates.plantPalette?.find((p: any) => p.common_name === item.name)?.image_url;
                                            const thumb = ragThumb || plantThumb || null;
                                            return (
                                                <div key={idx} className="flex items-center gap-3 border border-slate-100 rounded-lg p-3">
                                                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                                                        {thumb ? <img src={thumb} className="w-full h-full object-cover" /> : <span className="text-xs text-slate-400">No image</span>}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-sm font-semibold text-slate-800">{item.name}</div>
                                                        <div className="text-xs text-slate-600">Qty: {item.quantity}</div>
                                                    </div>
                                                    <div className="text-sm font-semibold text-slate-800">{item.totalCost}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="text-right text-sm font-semibold text-emerald-700">Total: {formatCurrency(result.estimates.totalCost)}</div>
                                </div>
                            )}

                            {/* Cost distribution */}
                            {result.estimates.totalCost > 0 && chartData.length > 0 && (
                                <div className="bg-white rounded-2xl shadow border border-slate-200 p-4">
                                    <h3 className="text-lg font-bold text-slate-800 mb-3">Cost Distribution</h3>
                                    <div className="h-[280px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={chartData} cx="50%" cy="50%" outerRadius={100} dataKey="cost" nameKey="name">
                                                    {chartData.map((_, index) => {
                                                        const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];
                                                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                                                    })}
                                                </Pie>
                                                <Tooltip formatter={(value: number, name: string) => `${formatCurrency(value as number)} - ${name}`} />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="mt-3 grid sm:grid-cols-2 gap-2 text-sm">
                                        {chartData.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between border border-slate-100 rounded-lg px-3 py-2">
                                                <span className="font-semibold text-slate-700">{item.name}</span>
                                                <span className="text-slate-600">{formatCurrency(item.cost)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Alternative renders */}
                            <div className="bg-white rounded-2xl shadow border border-slate-200 p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-slate-800">Alternative Renders</h3>
                                    <button
                                        onClick={handleGenerateAlternatives}
                                        disabled={isGeneratingAlts}
                                        className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-60"
                                    >
                                        {isGeneratingAlts ? 'Generating...' : 'Generate 2 more'}
                                    </button>
                                </div>
                                {altRenders.length === 0 && <p className="text-sm text-slate-600">No alternatives yet.</p>}
                                {altRenders.length > 0 && (
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {altRenders.map((url, idx) => (
                                            <div key={idx} className="border border-slate-200 rounded-xl p-3 space-y-2">
                                                <img src={url} className="w-full rounded-lg object-contain" />
                                                <button
                                                    onClick={() => handleRedesignWith(url)}
                                                    disabled={isGeneratingVideo}
                                                    className="w-full px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60"
                                                >
                                                    Re-design with this
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
