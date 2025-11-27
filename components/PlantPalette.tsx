import React from 'react';
import { PlantCard, PlantReference } from './PlantCard';

interface PlantPaletteProps {
    plants: PlantReference[];
    totalBudget: { low: number; high: number };
}

export const PlantPalette: React.FC<PlantPaletteProps> = ({ plants, totalBudget }) => {
    if (!plants || plants.length === 0) {
        return null;
    }

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Plant Palette</h3>
                        <p className="text-sm text-slate-500">From your RAG catalog</p>
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Estimated Budget</div>
                    <div className="text-2xl font-bold text-emerald-700">
                        {formatCurrency(totalBudget.low)} - {formatCurrency(totalBudget.high)}
                    </div>
                </div>
            </div>

            {/* Plant Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plants.map((plant, index) => (
                    <PlantCard key={index} plant={plant} />
                ))}
            </div>

            {/* Footer Note */}
            <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="flex items-start gap-2 text-xs text-slate-500">
                    <svg className="w-4 h-4 text-emerald-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>
                        All plants shown are from your RAG database with verified botanical names and accurate market pricing.
                        Images show actual plant appearance for visual reference.
                    </p>
                </div>
            </div>
        </div>
    );
};
