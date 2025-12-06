import React, { useRef } from 'react';

interface UploadAreaProps {
  label: string;
  subLabel?: string;
  onFileSelect: (files: File[]) => void;
  previewUrls: string[];
  required?: boolean;
  accept?: string;
  multiple?: boolean;
  onClear?: () => void;
}

export const UploadArea: React.FC<UploadAreaProps> = ({
  label,
  subLabel,
  onFileSelect,
  previewUrls,
  required = false,
  accept = "image/*",
  multiple = false,
  onClear
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // For multiple, we might append in parent, but here we just emit the new selection
      onFileSelect(Array.from(e.target.files));
      // Reset input so same file can be selected again if needed
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const hasPreviews = previewUrls && previewUrls.length > 0;

  return (
    <div className="space-y-4 h-full w-full">
      <div
        className={`relative group cursor-pointer border border-dashed transition-all duration-300 ease-out overflow-hidden h-full min-h-[320px] flex flex-col items-center justify-center
          ${hasPreviews ? 'border-gray-300 bg-white' : 'border-gray-300 hover:border-black bg-white hover:bg-gray-50'}
        `}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={accept}
          multiple={multiple}
          className="hidden"
        />

        {hasPreviews ? (
          <div className="w-full h-full p-4 overflow-y-auto custom-scrollbar relative">
            <div className={`grid gap-4 ${previewUrls.length === 1 ? 'grid-cols-1 h-full' : 'grid-cols-2'}`}>
              {previewUrls.map((url, idx) => (
                <div key={idx} className={`relative overflow-hidden ${previewUrls.length === 1 ? 'h-full' : 'aspect-square'}`}>
                  <img
                    src={url}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {multiple && (
                    <div className="absolute top-2 left-2 bg-black text-white text-[10px] uppercase tracking-wider px-2 py-1">
                      #{idx + 1}
                    </div>
                  )}
                </div>
              ))}
              {/* Add button for multiple uploads */}
              {multiple && (
                <div className="aspect-square flex flex-col items-center justify-center border border-dashed border-gray-300 text-gray-400 hover:text-black hover:border-black transition-all">
                  <span className="text-3xl font-light mb-2">+</span>
                  <span className="text-xs uppercase tracking-widest">Add Image</span>
                </div>
              )}
            </div>

            {onClear && (
              <button
                onClick={(e) => { e.stopPropagation(); onClear(); }}
                className="absolute top-4 right-4 bg-white/90 backdrop-blur border border-gray-200 text-black p-2 hover:bg-black hover:text-white transition-colors z-10"
                title="Clear Selection"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8 pointer-events-none">
            <div className="mb-6 opacity-30 group-hover:opacity-100 transition-opacity duration-300">
              <svg className="w-12 h-12 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-serif text-2xl italic text-black mb-2">
              {label} {required && <span className="text-gray-400">*</span>}
            </h3>
            {subLabel && <p className="text-xs font-sans uppercase tracking-[0.2em] text-gray-400">{subLabel}</p>}
          </div>
        )}
      </div>
    </div>
  );
};
