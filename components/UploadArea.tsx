import React, { useRef, useState } from 'react';
import { validateImageContent } from '../services/geminiService';

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
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const validateAndProcessFiles = async (files: File[]) => {
    setValidationError(null);
    setIsValidating(true);

    try {
      // Check file size for all files
      for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
          setValidationError(`File "${file.name}" is too large. Maximum size is 10MB.`);
          setIsValidating(false);
          return;
        }
      }

      // Validate the first/main image (for yard photos)
      const mainFile = files[0];
      if (mainFile && label.toLowerCase().includes('yard')) {
        const validation = await validateImageContent(mainFile);

        if (!validation.isValid) {
          setValidationError(validation.message || "Please upload an image of your outdoor space, yard, or garden.");
          setIsValidating(false);
          return;
        }
      }

      // All valid, proceed with upload
      onFileSelect(files);
    } catch (error) {
      console.warn("Validation error, proceeding anyway:", error);
      onFileSelect(files);
    } finally {
      setIsValidating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const hasPreviews = previewUrls && previewUrls.length > 0;

  return (
    <div className="space-y-3">
      {/* Validation Error Alert */}
      {validationError && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-medium">Invalid Image</p>
            <p className="text-sm mt-1">{validationError}</p>
          </div>
          <button
            onClick={() => setValidationError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div
        className={`relative group cursor-pointer border-2 border-dashed rounded-xl transition-all duration-200 ease-in-out overflow-hidden h-64
          ${isValidating ? 'border-blue-400 bg-blue-50' : hasPreviews ? 'border-emerald-500/50 bg-slate-50' : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'}
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

        {/* Validating Overlay */}
        {isValidating && (
          <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-10">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-blue-600 font-medium">Checking image...</p>
            <p className="text-sm text-blue-500 mt-1">Verifying this is an outdoor space</p>
          </div>
        )}

        {hasPreviews ? (
          <div className="w-full h-full p-4 overflow-y-auto custom-scrollbar">
            <div className={`grid gap-2 ${previewUrls.length === 1 ? 'grid-cols-1 h-full' : 'grid-cols-2'} `}>
              {previewUrls.map((url, idx) => (
                <div key={idx} className={`relative rounded-lg overflow-hidden border border-slate-200 shadow-sm ${previewUrls.length === 1 ? 'h-full' : 'aspect-square'} `}>
                  <img
                    src={url}
                    alt={`Preview ${idx + 1} `}
                    className="w-full h-full object-cover"
                  />
                  {multiple && (
                    <div className="absolute top-1 left-1 bg-black/50 text-white text-sm px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                      #{idx + 1}
                    </div>
                  )}
                </div>
              ))}
              {/* Add button for multiple uploads */}
              {multiple && (
                <div className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-emerald-300/50 rounded-lg bg-emerald-50/30 text-emerald-600 hover:bg-emerald-50 transition-colors">
                  <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  <span className="text-sm font-medium">Add More</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-700">
              {label} {required && <span className="text-red-500">*</span>}
            </h3>
            {subLabel && <p className="text-sm text-slate-500 mt-1">{subLabel}</p>}
            <p className="text-sm text-slate-400 mt-4">
              {multiple ? 'Upload multiple photos for better accuracy' : 'JPG, PNG up to 10MB'}
            </p>
          </div>
        )}
      </div>

      {hasPreviews && onClear && (
        <button
          onClick={(e) => { e.stopPropagation(); onClear(); }}
          className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 ml-1"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          Remove the picture
        </button>
      )}
    </div>
  );
};
