import React from 'react';

export interface PlantReference {
    common_name: string;
    botanical_name: string;
    image_url: string;
    quantity: number;
    size: string;
    unit_price: string;
    total_estimate: string;
    rag_verified: boolean;
}

interface PlantCardProps {
    plant: PlantReference;
}

export const PlantCard: React.FC<PlantCardProps> = ({ plant }) => {
    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all">
            {/* Plant Image */}
            <div className="aspect-square bg-slate-100 relative overflow-hidden">
                {plant.image_url ? (
                    <img
                        src={plant.image_url}
                        alt={plant.common_name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}
                {plant.rag_verified && (
                    <div className="absolute top-2 right-2 bg-emerald-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Verified
                    </div>
                )}
            </div>

            {/* Plant Info */}
            <div className="p-4">
                <h4 className="font-bold text-slate-800 mb-1">{plant.common_name}</h4>
                {plant.botanical_name && (
                    <p className="text-xs italic text-slate-500 mb-3">{plant.botanical_name}</p>
                )}

                <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-slate-600">
                        <span>Quantity:</span>
                        <span className="font-medium">{plant.quantity} × {plant.size}</span>
                    </div>

                    <div className="flex justify-between text-slate-600">
                        <span>Unit Price:</span>
                        <span className="font-medium">{plant.unit_price}</span>
                    </div>

                    <div className="flex justify-between pt-2 border-t border-slate-100">
                        <span className="font-semibold text-slate-800">Subtotal:</span>
                        <span className="font-bold text-emerald-700">{plant.total_estimate}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
