import React, { useState } from 'react';
import { GeneratedDesign, MaterialItem } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { PlantPalette } from './PlantPalette';
import { calculateRAGBudget } from '../services/ragBudgetService';
import { ProductSwapModal } from './ProductSwapModal';
import { useEffect } from 'react';

interface RAGBudget {
  total_min_budget: number;
  currency: string;
  line_items: Array<{
    item: string;
    match: string;
    price_estimate: string;
    cost: number;
    image_url?: string;
  }>;
}

interface ResultsViewProps {
  result: GeneratedDesign;
  onReset: () => void;
  originalImage: string | null;
  designShortId?: string; // For sharing
}

export const ResultsView: React.FC<ResultsViewProps> = ({ result, onReset, originalImage, designShortId }) => {
  const [activeTab, setActiveTab] = useState<'original' | 'render' | 'plan' | 'compare' | 'video'>('compare');
  const [currentRenderIndex, setCurrentRenderIndex] = useState(0);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [ragBudget, setRagBudget] = useState<RAGBudget | null>(null);

  const [isLoadingBudget, setIsLoadingBudget] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);

  // Automatically fetch RAG budget when component mounts
  useEffect(() => {
    const fetchBudget = async () => {
      if (!result.renderImages[0]) return;

      setIsLoadingBudget(true);
      // Extract base64 from data URL
      const base64 = result.renderImages[0].split(',')[1];
      const budget = await calculateRAGBudget(base64);
      setRagBudget(budget);
      setIsLoadingBudget(false);
    };

    fetchBudget();
  }, [result.renderImages]);

  const handleGenerateVideo = async () => {
    if (!originalImage || !result.renderImages[currentRenderIndex]) return;

    setIsGeneratingVideo(true);
    setVideoError(null);

    try {
      // Helper to get base64 from URL (blob or data)
      const getBase64 = async (url: string): Promise<string> => {
        if (url.startsWith('data:')) {
          return url.split(',')[1];
        }
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      };

      const [originalBase64, redesignBase64] = await Promise.all([
        getBase64(originalImage),
        getBase64(result.renderImages[currentRenderIndex])
      ]);

      console.log('🔍 Video generation request:', {
        originalImage: originalImage?.substring(0, 50),
        originalBase64Length: originalBase64?.length,
        redesignBase64Length: redesignBase64?.length
      });

      const requestBody = {
        original_image: originalBase64,
        redesign_image: redesignBase64,
        duration: 5
      };

      console.log('📤 Sending request body keys:', Object.keys(requestBody));
      console.log('📤 original_image present:', !!requestBody.original_image);

      const response = await fetch('http://localhost:8001/api/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to generate video');
      }

      setVideoUrl(data.video_url);
    } catch (err) {
      setVideoError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Video generation error:', err);
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const getActiveImage = () => {
    if (activeTab === 'video') return null; // Video tab has its own UI
    if (activeTab === 'original') return originalImage;
    if (activeTab === 'render') return result.renderImages[currentRenderIndex];
    return result.planImage;
  };

  const activeImage = getActiveImage();

  const downloadImage = (dataUrl: string | null, filename: string) => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "landscaping_estimate.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Group items by category for the chart
  const chartData = React.useMemo(() => {
    const categories = {
      'Hardscape': 0,
      'Softscape': 0,
      'Plants': 0,
      'Labor': 0,
      'Other': 0
    };

    result.estimates.breakdown.forEach(item => {
      const name = item.name.toLowerCase();
      const cost = parseFloat(item.totalCost.replace(/[^0-9.]/g, '')) || 0;

      if (name.includes('labor') || name.includes('install') || name.includes('removal') || name.includes('prep')) {
        categories['Labor'] += cost;
      } else if (name.includes('paver') || name.includes('stone') || name.includes('concrete') || name.includes('gravel') || name.includes('wood') || name.includes('deck') || name.includes('patio') || name.includes('fence') || name.includes('wall') || name.includes('rock') || name.includes('path')) {
        categories['Hardscape'] += cost;
      } else if (name.includes('mulch') || name.includes('soil') || name.includes('compost') || name.includes('turf') || name.includes('grass') || name.includes('sod')) {
        categories['Softscape'] += cost;
      } else if (name.includes('plant') || name.includes('tree') || name.includes('shrub') || name.includes('flower') || name.includes('bush') || name.includes('seed')) {
        categories['Plants'] += cost;
      } else {
        categories['Other'] += cost;
      }
    });

    return Object.entries(categories)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, cost: value }));
  }, [result.estimates.breakdown]);

  const findRagImage = (itemName: string) => {
    if (!ragBudget) return null;
    return ragBudget.line_items.find(ragItem =>
      ragItem.item.toLowerCase().includes(itemName.toLowerCase()) ||
      itemName.toLowerCase().includes(ragItem.item.toLowerCase())
    )?.image_url;
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  const nextRender = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentRenderIndex((prev) => (prev + 1) % result.renderImages.length);
  };

  const prevRender = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentRenderIndex((prev) => (prev - 1 + result.renderImages.length) % result.renderImages.length);
  };

  const shareableUrl = designShortId ? `${window.location.origin}/result/${designShortId}` : null;
  const [copied, setCopied] = useState(false);

  const copyShareLink = () => {
    if (shareableUrl) {
      navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSwapItem = (newItem: any) => {
    if (!ragBudget || selectedItemIndex === null) return;

    const newLineItems = [...ragBudget.line_items];
    const oldItem = newLineItems[selectedItemIndex];

    // Extract price from new item
    let cost = 0;
    if (newItem.price_estimate) {
      const match = newItem.price_estimate.match(/\$(\d+)/);
      if (match) cost = parseInt(match[1]);
    }

    newLineItems[selectedItemIndex] = {
      ...oldItem,
      match: newItem.specific_name || newItem.title,
      price_estimate: newItem.price_estimate || 'N/A',
      cost: cost,
      image_url: newItem.image_url
    };

    const newTotal = newLineItems.reduce((sum, item) => sum + item.cost, 0);

    setRagBudget({
      ...ragBudget,
      total_min_budget: newTotal,
      line_items: newLineItems
    });

    setSwapModalOpen(false);
    setSelectedItemIndex(null);
  };

  const handleRemoveItem = (index: number) => {
    if (!ragBudget) return;
    const newLineItems = ragBudget.line_items.filter((_, i) => i !== index);
    const newTotal = newLineItems.reduce((sum, item) => sum + item.cost, 0);
    setRagBudget({
      ...ragBudget,
      total_min_budget: newTotal,
      line_items: newLineItems
    });
  };

  return (
    <div className="space-y-12 animate-fade-in pb-20">

      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Your Redesign</h2>
        <div className="flex items-center gap-3">
          <button onClick={onReset} className="text-sm text-slate-500 hover:text-green-600 flex items-center gap-2 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Start New Project
          </button>
        </div>
      </div>

      {/* Shareable Link */}
      {shareableUrl && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl shadow-sm border border-green-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <h3 className="text-lg font-bold text-slate-900">Share Your Design</h3>
          </div>
          <p className="text-sm text-slate-600 mb-4">Share this link with others to show them your design:</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareableUrl}
              readOnly
              className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm font-mono text-slate-700"
            />
            <button
              onClick={copyShareLink}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
            >
              {copied ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Link
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Visuals Section */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="flex border-b border-slate-100">
          {(['compare', 'original', 'render', 'plan', 'video'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-sm font-medium capitalize transition-colors relative ${activeTab === tab ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
            >
              {tab}
              {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
            </button>
          ))}
        </div>

        <div className="relative aspect-video bg-slate-100 flex items-center justify-center group overflow-hidden">
          {activeTab === 'video' && (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-slate-100">
              {!videoUrl ? (
                <div className="text-center max-w-md animate-fade-in">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm ring-1 ring-purple-50">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">Cinematic 3D Tour</h3>
                  <p className="text-slate-600 mb-8 leading-relaxed">
                    Transform your design into a stunning 5-second cinematic video. Perfect for visualizing the space in motion.
                  </p>

                  {videoError && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-center gap-2">
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {videoError}
                    </div>
                  )}

                  <button
                    onClick={handleGenerateVideo}
                    disabled={isGeneratingVideo}
                    className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] shadow-xl ${isGeneratingVideo
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-200 hover:shadow-purple-300 hover:-translate-y-1'
                      }`}
                  >
                    {isGeneratingVideo ? (
                      <>
                        <svg className="animate-spin w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 00 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Creating Magic...
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Generate Video Tour
                      </>
                    )}
                  </button>

                  {!isGeneratingVideo && (
                    <p className="mt-4 text-xs text-slate-400">
                      Powered by AI Video Generation • ~30s processing time
                    </p>
                  )}
                </div>
              ) : (
                <div className="w-full max-w-4xl animate-fade-in">
                  <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl mb-8 relative group ring-4 ring-white ring-opacity-50">
                    <video
                      src={videoUrl}
                      controls
                      autoPlay
                      loop
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => setVideoUrl(null)}
                      className="px-6 py-3 bg-white text-slate-600 hover:text-slate-900 rounded-xl font-medium border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      Generate New Video
                    </button>
                    <a
                      href={videoUrl}
                      download="redesign-tour.mp4"
                      className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-200 hover:-translate-y-0.5"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Video
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'compare' && originalImage && result.renderImages[currentRenderIndex] ? (
            <div className="w-full h-full p-6">
              <BeforeAfterSlider
                beforeImage={result.renderImages[currentRenderIndex]}
                afterImage={originalImage}
                beforeLabel="Redesigned"
                afterLabel="Original"
              />
            </div>
          ) : activeTab !== 'video' && activeImage ? (
            <img src={activeImage} alt={activeTab} className="w-full h-full object-cover transition-opacity duration-300" />
          ) : activeTab !== 'video' && !activeImage ? (
            <div className="text-slate-400 italic">Image generation failed or is unavailable.</div>
          ) : null}

          {/* Carousel Controls (only for renders with > 1 image) */}
          {activeTab === 'render' && result.renderImages.length > 1 && (
            <>
              <button
                onClick={prevRender}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-800 p-2 rounded-full shadow-lg transition-all hover:scale-105"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                onClick={nextRender}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-800 p-2 rounded-full shadow-lg transition-all hover:scale-105"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {result.renderImages.map((_, idx) => (
                  <div
                    key={idx}
                    onClick={() => setCurrentRenderIndex(idx)}
                    className={`w-2 h-2 rounded-full shadow-sm transition-all cursor-pointer ${idx === currentRenderIndex ? 'bg-emerald-500 scale-125' : 'bg-white/80 hover:bg-white'}`}
                  />
                ))}
              </div>
            </>
          )}

          {activeImage && (
            <button
              onClick={() => downloadImage(activeImage, `autoscape-${activeTab}${activeTab === 'render' ? '-' + (currentRenderIndex + 1) : ''}.png`)}
              className="absolute top-4 right-4 bg-white/90 hover:bg-white text-slate-800 px-4 py-2 rounded-lg shadow-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-all transform -translate-y-2 group-hover:translate-y-0 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download
            </button>
          )}
        </div>

        <div className="p-6 bg-slate-50/50">
          <h3 className="text-lg font-semibold text-slate-800 mb-2">{result.analysis.designConcept}</h3>
          <div className="flex gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Layout: {result.analysis.currentLayout}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Maintenance: {result.analysis.maintenanceLevel}
            </span>
            {activeTab === 'render' && result.renderImages.length > 1 && (
              <span className="ml-auto text-slate-400 font-medium">
                View {currentRenderIndex + 1} of {result.renderImages.length}
              </span>
            )}
          </div>
        </div>
      </div >

      {/* Analysis & Costs Grid */}
      < div className="grid grid-cols-1 lg:grid-cols-2 gap-8" >

        {/* Material List */}
        < div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 relative" >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              Material List & Estimates
            </h3>
            <button
              onClick={downloadCSV}
              className="text-xs bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 px-3 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1 border border-slate-200"
              title="Download as CSV (Excel)"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export to Excel
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 w-16">Image</th>
                  <th className="px-4 py-3">Material</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3 text-right">Est. Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {result.estimates.breakdown.map((item, idx) => {
                  const ragImage = findRagImage(item.name);
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        {ragImage ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                            <img src={ragImage} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {item.name}
                        <div className="text-xs text-slate-400 font-normal">{item.notes}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{item.quantity}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-700">{item.totalCost}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t border-slate-200 bg-slate-50 font-semibold text-slate-800">
                <tr>
                  <td className="px-4 py-3" colSpan={3}>Estimated Total</td>
                  <td className="px-4 py-3 text-right text-emerald-700">
                    {formatCurrency(result.estimates.totalCost)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Cost Breakdown Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
            Cost Distribution
          </h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(value: number) => [`$${value}`, 'Cost']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#10b981' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-400 mt-4 text-center">
            *Estimates are based on national averages and visual approximation. Labor costs may vary significantly by region.
          </p>
        </div >

      </div >

      {/* RAG Plant Palette */}
      {
        result.estimates.plantPalette && result.estimates.plantPalette.length > 0 && (
          <PlantPalette
            plants={result.estimates.plantPalette}
            totalBudget={{
              low: result.estimates.totalCost * 0.8,
              high: result.estimates.totalCost * 1.2
            }}
          />
        )
      }

      {/* RAG Product Gallery */}
      {
        ragBudget && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Matched Products from Database
                </h3>
                <p className="text-sm text-slate-600">Real items matched to your design via RAG</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-slate-500">Total Estimate</p>
                  <p className="text-2xl font-bold text-purple-700">${ragBudget.total_min_budget}</p>
                </div>
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isEditMode
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  {isEditMode ? 'Done Editing' : 'Edit Components'}
                </button>
              </div>
            </div>

            {/* Horizontal Scrollable Thumbnail Gallery */}
            <div className="overflow-x-auto pb-2 -mx-2 px-2">
              <div className="flex gap-4 min-w-max">
                {ragBudget.line_items.map((item, i) => (
                  <div key={i} className="relative flex-shrink-0 w-48 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 group">
                    {isEditMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveItem(i);
                        }}
                        className="absolute top-2 left-2 z-10 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600 transition-colors"
                        title="Remove item"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    )}

                    {item.image_url && (
                      <div className="relative aspect-square bg-slate-100 overflow-hidden">
                        <img
                          src={item.image_url}
                          alt={item.item}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                          ${item.cost}
                        </div>

                        {isEditMode && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setSelectedItemIndex(i);
                                setSwapModalOpen(true);
                              }}
                              className="bg-white text-slate-900 px-4 py-2 rounded-lg font-medium text-sm shadow-xl hover:bg-emerald-50 transition-colors flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                              Swap
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-3">
                      <p className="font-semibold text-slate-800 text-sm mb-1 line-clamp-2">{item.item}</p>
                      <p className="text-xs text-slate-500 line-clamp-1">{item.match}</p>
                      <p className="text-xs text-purple-600 font-medium mt-1">{item.price_estimate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <ProductSwapModal
              isOpen={swapModalOpen}
              onClose={() => setSwapModalOpen(false)}
              currentItemName={selectedItemIndex !== null ? ragBudget.line_items[selectedItemIndex].item : ''}
              onSelect={handleSwapItem}
            />
          </div>
        )
      }

      {
        isLoadingBudget && (
          <div className="bg-purple-50 rounded-2xl p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600">Analyzing your design and matching products...</p>
          </div>
        )
      }

      {/* Save Your Design - At Bottom */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl shadow-sm border border-green-200 p-8">
        <h3 className="text-2xl font-bold text-slate-900 mb-3 text-center">💾 Save Your Design</h3>
        <p className="text-slate-600 mb-6 text-center">Keep your design for future reference or share it with the community!</p>
        <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
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
            className="flex-1 py-4 px-6 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Save Privately
          </button>
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
            className="flex-1 py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg shadow-green-200 hover:shadow-xl hover:shadow-green-300 transform hover:-translate-y-0.5"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Share to Gallery
          </button>
        </div>
        <p className="text-sm text-slate-500 mt-4 text-center">
          Public designs will appear in the <strong>Community Gallery</strong> for others to discover and get inspired!
        </p>
      </div>
    </div >
  );
};