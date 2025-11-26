import React, { useState } from 'react';
import { StyleReference } from '../data/styleReferences';
import { StylePreviewModal } from './StylePreviewModal';

interface StyleGalleryProps {
  availableStyles: StyleReference[];
  selectedStyleIds: string[];
  onStyleToggle: (styleId: string) => void;
  onClearAll: () => void;
}

export const StyleGallery: React.FC<StyleGalleryProps> = ({
  availableStyles,
  selectedStyleIds,
  onStyleToggle,
  onClearAll,
}) => {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const isSelected = (styleId: string) => selectedStyleIds.includes(styleId);

  const handleImageClick = (index: number) => {
    setPreviewIndex(index);
  };

  const closePreview = () => {
    setPreviewIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* Header with selection count */}
      {selectedStyleIds.length > 0 && (
        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-emerald-800">
              {selectedStyleIds.length} style{selectedStyleIds.length !== 1 ? 's' : ''} selected
            </span>
          </div>
          <button
            onClick={onClearAll}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-medium transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
        {availableStyles.map((style, index) => {
          const selected = isSelected(style.id);
          
          return (
            <button
              key={style.id}
              onClick={() => handleImageClick(index)}
              className={`relative group rounded-xl overflow-hidden transition-all duration-200 ${
                selected
                  ? 'ring-4 ring-emerald-500 shadow-lg scale-[0.98]'
                  : 'ring-2 ring-slate-200 hover:ring-emerald-300 hover:shadow-md hover:scale-[1.02]'
              }`}
            >
              {/* Image - Larger aspect ratio for better visibility */}
              <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                <img
                  src={style.imageUrl}
                  alt={style.name}
                  className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>

              {/* Overlay with checkmark when selected */}
              {selected && (
                <div className="absolute inset-0 bg-emerald-600/20 flex items-center justify-center pointer-events-none">
                  <div className="bg-emerald-600 rounded-full p-2 shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Label */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 pointer-events-none">
                <p className="text-white text-xs font-semibold truncate">{style.name}</p>
                <p className="text-white/80 text-[10px] truncate">{style.description}</p>
              </div>

              {/* Selection indicator badge */}
              {selected && (
                <div className="absolute top-2 right-2 bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg pointer-events-none">
                  ✓
                </div>
              )}

              {/* Hover hint */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center pointer-events-none">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 px-3 py-1.5 rounded-full text-xs font-medium text-slate-800">
                  Click to preview
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Helper text */}
      <p className="text-xs text-slate-500 text-center mt-4">
        🔍 Click images to preview and select • Browse full-size designs
      </p>

      {/* Preview Modal */}
      {previewIndex !== null && (
        <StylePreviewModal
          styles={availableStyles}
          initialIndex={previewIndex}
          selectedStyleIds={selectedStyleIds}
          onClose={closePreview}
          onToggleSelection={onStyleToggle}
          onClearAll={onClearAll}
        />
      )}
    </div>
  );
};
