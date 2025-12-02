import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadArea } from './UploadArea';
import { StyleGallery } from './StyleGallery';
import { useDesign } from '../contexts/DesignContext';
import { useAuth } from '../contexts/AuthContext';
import { generateLandscapeDesign } from '../services/geminiService';
import { styleReferences } from '../data/styleReferences';
import { urlsToFiles } from '../utils/imageUtils';
import { saveDesign } from '../services/firestoreService';
import { DesignStyle } from '../types';

export const DesignConfiguration: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const {
        yardImage,
        yardImagePreview,
        styleImages,
        styleImagePreviews,
        userPrompt,
        selectedStyle,
        error,
        selectedGalleryStyleIds,
        styleSelectionMode,
        setYardImage,
        addStyleImages,
        removeStyleImage,
        clearAllStyles,
        setUserPrompt,
        setSelectedStyle,
        setResult,
        setError,
        setIsProcessing,
        toggleGalleryStyle,
        clearGalleryStyles,
        setStyleSelectionMode,
    } = useDesign();

    const handleYardSelect = (files: File[]) => {
        if (files.length > 0) {
            setYardImage(files[0]);
        }
    };

    const handleClearYard = () => {
        setYardImage(null);
    };

    const handleStyleSelect = (files: File[]) => {
        if (files.length > 0) {
            addStyleImages(Array.from(files));
        }
    };

    const handleGenerate = async () => {
        if (!yardImage) return;

        setIsProcessing(true);
        setError(null);
        navigate('/processing');

        try {
            // Merge gallery selections with custom uploads
            let allStyleImages = [...styleImages];

            // Convert gallery selections to File objects
            if (selectedGalleryStyleIds.length > 0) {
                const selectedStyles = styleReferences.filter(style =>
                    selectedGalleryStyleIds.includes(style.id)
                );
                const galleryImageUrls = selectedStyles.map(style => style.imageUrl);
                const galleryFiles = await urlsToFiles(galleryImageUrls);
                allStyleImages = [...allStyleImages, ...galleryFiles];
            }

            const finalResult = await generateLandscapeDesign(
                yardImage,
                allStyleImages,
                userPrompt,
                selectedStyle,
                (partial) => {
                    // Create a safe result object with defaults for missing data
                    const safeResult: any = {
                        renderImages: partial.renderImages || [],
                        planImage: partial.planImage || null,
                        analysis: partial.analysis || {
                            currentLayout: "Analyzing...",
                            designConcept: "Generating Design Concept...",
                            visualDescription: "Analyzing scene...",
                            maintenanceLevel: "Calculating..."
                        },
                        estimates: partial.estimates || {
                            totalCost: 0,
                            currency: "USD",
                            breakdown: [],
                            plantPalette: [],
                            ragEnhanced: false
                        }
                    };

                    setResult(safeResult);

                    // Navigate to results as soon as we have a render
                    if (partial.renderImages && partial.renderImages.length > 0) {
                        navigate('/results');
                    }
                }
            );

            setResult(finalResult);
            setIsProcessing(false);

            // Save to Firestore if user is logged in
            if (user) {
                try {
                    await saveDesign(user.uid, finalResult);
                    console.log('Design saved successfully');
                } catch (error) {
                    console.error('Failed to save design:', error);
                }
            }

        } catch (err) {
            console.error(err);
            setError("Something went wrong while generating your design. Please try again.");
            setIsProcessing(false);
            navigate('/upload');
        }
    };

    return (
        <div className="max-w-3xl mx-auto animate-fade-in py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
                    Reimagine Your Outdoors
                </h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    Upload a photo of your yard and let our AI generate a professional landscape design, labeled 2D plan, and cost estimate instantly.
                </p>
            </div>

            {error && (
                <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {error}
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-8 space-y-8">

                    {/* Uploads */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700">Current Yard Photo</label>
                            <UploadArea
                                label="Upload Yard Photo"
                                subLabel="Required"
                                required
                                multiple={false}
                                onFileSelect={handleYardSelect}
                                previewUrls={yardImagePreview ? [yardImagePreview] : []}
                                onClear={handleClearYard}
                            />
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-medium text-slate-700">Style References (Optional)</label>
                                {(selectedGalleryStyleIds.length > 0 || styleImages.length > 0) && (
                                    <span className="text-xs text-emerald-600 font-medium">
                                        {selectedGalleryStyleIds.length + styleImages.length} selected
                                    </span>
                                )}
                            </div>

                            {/* Mode Toggle */}
                            <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setStyleSelectionMode('gallery')}
                                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${styleSelectionMode === 'gallery'
                                        ? 'bg-white text-emerald-600 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-800'
                                        }`}
                                >
                                    🖼️ Gallery
                                </button>
                                <button
                                    onClick={() => setStyleSelectionMode('upload')}
                                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${styleSelectionMode === 'upload'
                                        ? 'bg-white text-emerald-600 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-800'
                                        }`}
                                >
                                    📤 Upload
                                </button>
                            </div>

                            {/* Gallery Mode */}
                            {styleSelectionMode === 'gallery' && (
                                <StyleGallery
                                    availableStyles={styleReferences}
                                    selectedStyleIds={selectedGalleryStyleIds}
                                    onStyleToggle={toggleGalleryStyle}
                                    onClearAll={clearGalleryStyles}
                                />
                            )}

                            {/* Upload Mode */}
                            {styleSelectionMode === 'upload' && (
                                <>
                                    {/* Upload button */}
                                    <label className="block cursor-pointer">
                                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-emerald-500 hover:bg-emerald-50/50 transition-all">
                                            <svg className="w-8 h-8 mx-auto text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <p className="text-sm text-slate-600 font-medium">Add Custom Style Images</p>
                                            <p className="text-xs text-slate-400 mt-1">Click to select multiple images</p>
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={(e) => {
                                                const files = e.target.files ? Array.from(e.target.files) as File[] : [];
                                                if (files.length > 0) {
                                                    handleStyleSelect(files);
                                                    e.target.value = ''; // Reset input
                                                }
                                            }}
                                            className="hidden"
                                        />
                                    </label>

                                    {/* Preview grid for uploaded images */}
                                    {styleImagePreviews.length > 0 && (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-slate-600 font-medium">Uploaded Images</span>
                                                <button
                                                    onClick={clearAllStyles}
                                                    className="text-xs text-slate-500 hover:text-red-600 transition-colors"
                                                >
                                                    Clear all ({styleImages.length})
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {styleImagePreviews.map((preview, index) => (
                                                    <div key={index} className="relative group">
                                                        <img
                                                            src={preview}
                                                            alt={`Style ${index + 1}`}
                                                            className="w-full h-24 object-cover rounded-lg border border-slate-200"
                                                        />
                                                        <button
                                                            onClick={() => removeStyleImage(index)}
                                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                            title="Remove this image"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-slate-700">Select Aesthetic</label>
                            <div className="grid grid-cols-2 gap-3">
                                {Object.entries(DesignStyle).map(([key, value]) => (
                                    <button
                                        key={key}
                                        onClick={() => setSelectedStyle(value)}
                                        className={`px-4 py-3 text-xs font-medium rounded-lg border text-left transition-all ${selectedStyle === value
                                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500'
                                            : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        {value}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-medium bg-white text-slate-700">Additional Preferences</label>
                            <textarea
                                className="w-full p-4 h-32 bg-white rounded-lg border-2 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 resize-none text-sm"
                                placeholder="e.g. I want a fire pit area, low maintenance plants, and a stone walkway..."
                                value={userPrompt}
                                onChange={(e) => setUserPrompt(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            onClick={handleGenerate}
                            disabled={!yardImage}
                            className={`w-full py-4 rounded-xl text-white font-semibold text-lg shadow-lg transition-all transform active:scale-[0.99] flex items-center justify-center gap-2
            ${yardImage
                                    ? 'bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-200 shadow-emerald-100'
                                    : 'bg-slate-300 cursor-not-allowed'
                                }
          `}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                            Generate Design
                        </button>
                    </div>

                </div>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-8 text-center">
                <div className="space-y-2">
                    <div className="w-10 h-10 bg-white rounded-full shadow-sm mx-auto flex items-center justify-center text-emerald-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <h4 className="font-semibold text-slate-800">Visual Redesign</h4>
                    <p className="text-xs text-slate-500">Photorealistic AI renders preserving your home's geometry.</p>
                </div>
                <div className="space-y-2">
                    <div className="w-10 h-10 bg-white rounded-full shadow-sm mx-auto flex items-center justify-center text-emerald-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <h4 className="font-semibold text-slate-800">Precise 2D Plans</h4>
                    <p className="text-xs text-slate-500">Top-down architectural plans derived directly from the render.</p>
                </div>
                <div className="space-y-2">
                    <div className="w-10 h-10 bg-white rounded-full shadow-sm mx-auto flex items-center justify-center text-emerald-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h4 className="font-semibold text-slate-800">Accurate Costs</h4>
                    <p className="text-xs text-slate-500">Full estimates including materials and labor costs.</p>
                </div>
            </div>
        </div>
    );
};
