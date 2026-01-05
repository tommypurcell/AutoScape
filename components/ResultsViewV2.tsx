import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GeneratedDesign } from '../types';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { saveDesign, adjustUserCredits } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';
import { useDesign } from '../contexts/DesignContext';
import { getVideoEndpoint } from '../config/api';
import { Loader } from 'lucide-react';

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

  const handleGenerateVideo = async () => {
    if (!originalImage || !result.renderImages[currentRenderIndex]) return;
    if (!user) {
      alert('Please sign in to generate videos.');
      return;
    }
    if (credits <= 0) {
      alert('No credits remaining.');
      return;
    }
    setIsGeneratingVideo(true);
    try {
      const toBase64 = async (src: string) => {
        if (src.startsWith('data:')) return src.split(',')[1];
        const res = await fetch(src);
        const blob = await res.blob();
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = () => reject();
          reader.readAsDataURL(blob);
        });
      };

      const [orig, rend] = await Promise.all([
        toBase64(originalImage),
        toBase64(result.renderImages[currentRenderIndex])
      ]);

      const resp = await fetch(getVideoEndpoint(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ original_image: orig, redesign_image: rend, provider: 'gemini', duration: 5 })
      });
      const data = await resp.json();
      if (!resp.ok || data.status === 'error') throw new Error(data.error || 'Video generation failed');
      setVideoUrl(data.video_url || null);
      // Decrement credit on success
      try {
        await adjustUserCredits(user.uid, -1);
        setCredits((c) => Math.max((c || 0) - 1, 0));
      } catch (err) {
        console.warn('Credit decrement failed:', err);
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to generate video.');
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  return (
    <div className="space-y-8 pb-10 px-3 sm:px-6 lg:px-16 xl:px-24">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow border border-slate-200 p-6 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm text-emerald-600 font-semibold">Design ID: {currentShortId || designShortId || 'Unsaved'}</p>
            <h1 className="text-2xl font-bold text-slate-800">Your Landscape Transformation</h1>
            <p className="text-slate-600">Render, plan, and costs generated by AutoScape.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCopyLink} disabled={isSaving} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60">
              {copied ? 'Copied' : 'Copy Link'}
            </button>
            <button onClick={() => onReset()} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors">
              New Design
            </button>
          </div>
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
      </div>

      {/* 1) Compare */}
      {originalImage && result.renderImages[currentRenderIndex] && (
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
    </div>
  );
};
