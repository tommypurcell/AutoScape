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
            <div
              key={style.id}
              className={`relative group rounded-xl overflow-hidden transition-all duration-200 ${selected
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
                <div className="absolute inset-0 bg-emerald-600/10 pointer-events-none" />
              )}

              {/* Label - Moved below image */}
              <div className="p-3 bg-white border-t border-slate-100">
                <p className="text-slate-800 text-sm font-bold truncate">{style.name}</p>
                <p className="text-slate-500 text-xs truncate">{style.description}</p>
              </div>

              {/* Selection indicator badge */}
              {selected && (
                <div className="absolute top-2 right-2 bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg pointer-events-none z-10 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  Selected
                </div>
              )}

              {/* Hover Actions Overlay */}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3 backdrop-blur-[2px]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStyleToggle(style.id);
                  }}
                  className={`w-32 py-2.5 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 flex items-center justify-center gap-2 backdrop-blur-md border ${selected
                    ? 'bg-red-500/80 hover:bg-red-600/90 text-white border-red-400/50'
                    : 'bg-emerald-600/80 hover:bg-emerald-500/90 text-white border-emerald-400/50'
                    } shadow-lg`}
                >
                  {selected ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Remove
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Select
                    </>
                  )}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleImageClick(index);
                  }}
                  className="w-32 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-semibold backdrop-blur-md transition-all transform hover:scale-105 flex items-center justify-center gap-2 border border-white/40 shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Preview
                </button>
              </div>
            </div>
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
