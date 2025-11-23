import React, { useState } from 'react';
import { GeneratedDesign, MaterialItem } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ResultsViewProps {
  result: GeneratedDesign;
  onReset: () => void;
  originalImage: string | null;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ result, onReset, originalImage }) => {
  const [activeTab, setActiveTab] = useState<'original' | 'render' | 'plan'>('render');
  const [currentRenderIndex, setCurrentRenderIndex] = useState(0);

  const getActiveImage = () => {
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

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "AutoScape_Estimate.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = result.estimates.breakdown.map(item => ({
    name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
    cost: parseFloat(item.totalCost.replace(/[^0-9.]/g, '')) || 0
  }));

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  const nextRender = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentRenderIndex((prev) => (prev + 1) % result.renderImages.length);
  };

  const prevRender = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentRenderIndex((prev) => (prev - 1 + result.renderImages.length) % result.renderImages.length);
  };

  return (
    <div className="space-y-12 animate-fade-in pb-20">
      
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Your Redesign</h2>
        <button onClick={onReset} className="text-sm text-slate-500 hover:text-emerald-600 flex items-center gap-2 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Start New Project
        </button>
      </div>

      {/* Visuals Section */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="flex border-b border-slate-100">
          {(['original', 'render', 'plan'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-sm font-medium capitalize transition-colors relative ${
                activeTab === tab ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab === 'original' ? 'Original Yard' : tab === 'render' ? '3D Redesign' : '2D Plan'}
              {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
            </button>
          ))}
        </div>
        
        <div className="relative aspect-video bg-slate-100 flex items-center justify-center group overflow-hidden">
          {activeImage ? (
             <img src={activeImage} alt={activeTab} className="w-full h-full object-cover transition-opacity duration-300" />
          ) : (
             <div className="text-slate-400 italic">Image generation failed or is unavailable.</div>
          )}
          
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
      </div>

      {/* Analysis & Costs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Material List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 relative">
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
                  <th className="px-4 py-3">Material</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3 text-right">Est. Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {result.estimates.breakdown.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {item.name}
                      <div className="text-xs text-slate-400 font-normal">{item.notes}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.quantity}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-700">{item.totalCost}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-slate-200 bg-slate-50 font-semibold text-slate-800">
                <tr>
                  <td className="px-4 py-3" colSpan={2}>Estimated Total</td>
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
                <YAxis type="category" dataKey="name" width={100} tick={{fontSize: 11, fill: '#64748b'}} />
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
        </div>

      </div>
    </div>
  );
};