import React, { useState, useEffect } from 'react';
import { StyleReference } from '../data/styleReferences';

interface StylePreviewModalProps {
  styles: StyleReference[];
  initialIndex: number;
  selectedStyleIds: string[];
  onClose: () => void;
  onToggleSelection: (styleId: string) => void;
  onClearAll: () => void;
}

export const StylePreviewModal: React.FC<StylePreviewModalProps> = ({
  styles,
  initialIndex,
  selectedStyleIds,
  onClose,
  onToggleSelection,
  onClearAll,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const currentStyle = styles[currentIndex];
  const isSelected = selectedStyleIds.includes(currentStyle.id);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === ' ') {
        e.preventDefault();
        onToggleSelection(currentStyle.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, currentStyle.id]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % styles.length);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + styles.length) % styles.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
        aria-label="Close preview"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Main content container */}
      <div className="w-full h-full flex flex-col p-4 md:p-8">
        {/* Main image area */}
        <div className="flex-1 flex items-center justify-center mb-4 relative">
          {/* Previous button */}
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-sm transition-all z-10"
            aria-label="Previous image"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Main image */}
          <div className="relative max-w-5xl max-h-full">
            <img
              src={currentStyle.imageUrl}
              alt={currentStyle.name}
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
            />
            
            {/* Selection badge */}
            {isSelected && (
              <div className="absolute top-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                Selected
              </div>
            )}
          </div>

          {/* Next button */}
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-sm transition-all z-10"
            aria-label="Next image"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Info and action bar */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-white text-lg font-semibold">{currentStyle.name}</h3>
              <p className="text-white/70 text-sm">{currentStyle.description}</p>
              <p className="text-white/50 text-xs mt-1">
                {currentIndex + 1} of {styles.length}
                {selectedStyleIds.length > 0 && (
                  <span className="ml-2">• {selectedStyleIds.length} selected</span>
                )}
              </p>
            </div>
            
            {/* Unselect All button */}
            {selectedStyleIds.length > 0 && (
              <button
                onClick={onClearAll}
                className="px-4 py-3 rounded-lg font-semibold transition-all bg-red-500/80 text-white hover:bg-red-600"
              >
                Unselect All
              </button>
            )}

            {/* Select/Deselect button */}
            <button
              onClick={() => onToggleSelection(currentStyle.id)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                isSelected
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-white text-slate-800 hover:bg-gray-100'
              }`}
            >
              {isSelected ? (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Selected
                </span>
              ) : (
                'Select Style'
              )}
            </button>
          </div>
        </div>

        {/* Thumbnail carousel */}
        <div className="relative">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            {styles.map((style, index) => {
              const selected = selectedStyleIds.includes(style.id);
              const isCurrent = index === currentIndex;
              
              return (
                <button
                  key={style.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden transition-all ${
                    isCurrent
                      ? 'ring-4 ring-white scale-110'
                      : 'ring-2 ring-white/30 hover:ring-white/60'
                  }`}
                >
                  <img
                    src={style.imageUrl}
                    alt={style.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Selection indicator */}
                  {selected && (
                    <div className="absolute top-1 right-1 bg-emerald-600 rounded-full p-1">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Current indicator */}
                  {isCurrent && (
                    <div className="absolute inset-0 bg-white/20" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Keyboard hints */}
        <div className="text-center text-white/50 text-xs mt-4">
          Use arrow keys to navigate • Space to select • Esc to close
        </div>
      </div>
    </div>
  );
};
