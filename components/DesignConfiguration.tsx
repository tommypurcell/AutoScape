/**
 * DesignConfiguration.tsx
 * 
 * This component handles the multi-step wizard for setting up a new landscape design.
 * It guides the user through 5 easy steps:
 * 1. Upload Yard Photo
 * 2. Select Inspiration (optional)
 * 3. Choose Aesthetic (Style)
 * 4. Add Details (Prompt)
 * 5. Review & Generate
 * 
 * It uses the global DesignContext to store choices so they persist if the user navigates away.
 */

import React, { useState } from 'react';
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

    // Get all our state and functions from the global DesignContext
    const {
        yardImage,
        yardImagePreview,
        styleImages,
        styleImagePreviews,
        userPrompt,
        budget,
        selectedStyle,
        error,
        location,
        selectedGalleryStyleIds,
        styleSelectionMode,
        setYardImage,
        addStyleImages,
        removeStyleImage,
        clearAllStyles,
        setUserPrompt,
        setBudget,
        setSelectedStyle,
        setResult,
        setError,
        setIsProcessing,
        setLocation,
        toggleGalleryStyle,
        clearGalleryStyles,
        setStyleSelectionMode,
    } = useDesign();

    // Location data for climate-aware plant recommendations
    const locationData: Record<string, string[]> = {
        'United States': ['California', 'Texas', 'Florida', 'New York', 'Arizona', 'Colorado', 'Washington', 'Oregon', 'Nevada', 'Georgia', 'North Carolina', 'Virginia', 'Massachusetts', 'Illinois', 'Pennsylvania', 'Ohio', 'Michigan', 'New Jersey', 'Other US State'],
        'Canada': ['British Columbia', 'Ontario', 'Quebec', 'Alberta', 'Manitoba', 'Saskatchewan', 'Nova Scotia', 'Other Province'],
        'United Kingdom': ['England', 'Scotland', 'Wales', 'Northern Ireland'],
        'Australia': ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia', 'Tasmania', 'Other Territory'],
        'Other': ['Tropical Climate', 'Mediterranean Climate', 'Desert Climate', 'Temperate Climate', 'Cold Climate']
    };

    const [selectedCountry, setSelectedCountry] = useState<string>('United States');

    // Local state for the wizard step (1 to 5)
    const [currentStep, setCurrentStep] = useState(1);
    // Local state for custom style input
    const [customStyle, setCustomStyle] = useState('');

    // --- Handlers for File Uploads ---

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

    // --- Navigation Handlers ---

    const nextStep = () => {
        if (currentStep < 5) setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    // --- Main Generation Logic ---

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

            // Use custom style if entered, otherwise selected preset
            const finalStyle = customStyle.trim() ? customStyle : selectedStyle;

            const finalResult = await generateLandscapeDesign(
                yardImage,
                allStyleImages,
                userPrompt,
                finalStyle,
                budget,
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

            // Save to Firestore if user is logged in (as private by default)
            if (user) {
                try {
                    await saveDesign(user.uid, finalResult, false);
                    console.log('Design saved successfully');
                } catch (error) {
                    console.error('Failed to save design:', error);
                    // Don't block the user flow if save fails
                }
            }

        } catch (err) {
            console.error(err);
            setError("Something went wrong while generating your design. Please try again.");
            setIsProcessing(false);
            navigate('/upload');
        }
    };

    // --- Render Helpers ---

    // Progress Bar Component
    const ProgressBar = () => (
        <div className="mb-8">
            <div className="flex justify-between mb-2">
                {['Upload', 'Inspiration', 'Aesthetic', 'Details', 'Review'].map((label, idx) => {
                    const stepNum = idx + 1;
                    const isActive = stepNum <= currentStep;
                    return (
                        <div key={label} className={`text-xs font-medium ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {label}
                        </div>
                    );
                })}
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                    style={{ width: `${(currentStep / 5) * 100}%` }}
                />
            </div>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto animate-fade-in py-12 px-4 sm:px-6 lg:px-8">

            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
                    Design Your Dream Yard
                </h1>
                <p className="text-slate-600">
                    Step {currentStep} of 5
                </p>
            </div>

            <ProgressBar />

            {error && (
                <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {error}
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px] flex flex-col">
                <div className="p-8 flex-1">

                    {/* STEP 1: UPLOAD YARD */}
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-xl font-bold text-slate-800">Let's start with a photo</h2>
                            <p className="text-slate-600 text-sm">Upload a clear photo of your current yard. This will be the base for our design.</p>

                            <UploadArea
                                label="Upload Yard Photo"
                                subLabel="Required"
                                required
                                multiple={false}
                                onFileSelect={handleYardSelect}
                                previewUrls={yardImagePreview ? [yardImagePreview] : []}
                                onClear={handleClearYard}
                            />

                            {/* Location Selector */}
                            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Where is your property located?
                                </h3>
                                <p className="text-xs text-slate-500 mb-4">This helps us recommend climate-appropriate plants for your area.</p>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Country</label>
                                        <select
                                            value={selectedCountry}
                                            onChange={(e) => {
                                                setSelectedCountry(e.target.value);
                                                setLocation(locationData[e.target.value]?.[0] || '');
                                            }}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        >
                                            {Object.keys(locationData).map(country => (
                                                <option key={country} value={country}>{country}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">State / Province</label>
                                        <select
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        >
                                            {(locationData[selectedCountry] || []).map(region => (
                                                <option key={region} value={region}>{region}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {location && (
                                    <p className="mt-3 text-xs text-emerald-600 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                        AI will recommend plants suited for {location}'s climate
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 2: INSPIRATION */}
                    {currentStep === 2 && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">What inspires you?</h2>
                                    <p className="text-slate-600 text-sm">Select from our gallery or upload your own ideas (Optional).</p>
                                </div>
                                {(selectedGalleryStyleIds.length > 0 || styleImages.length > 0) && (
                                    <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-3 py-1 rounded-full">
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
                                <div className="space-y-4">
                                    <label className="block cursor-pointer">
                                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-emerald-500 hover:bg-emerald-50/50 transition-all">
                                            <svg className="w-10 h-10 mx-auto text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <p className="text-sm text-slate-600 font-medium">Click to upload inspiration photos</p>
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

                                    {/* Previews */}
                                    {styleImagePreviews.length > 0 && (
                                        <div className="grid grid-cols-3 gap-3">
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
                                                    >
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 3: AESTHETIC */}
                    {currentStep === 3 && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-xl font-bold text-slate-800">Choose your vibe</h2>
                            <p className="text-slate-600 text-sm">Select a style or describe your own.</p>

                            <div className="grid grid-cols-2 gap-3">
                                {Object.entries(DesignStyle).map(([key, value]) => (
                                    <button
                                        key={key}
                                        onClick={() => {
                                            setSelectedStyle(value);
                                            setCustomStyle(''); // Clear custom if preset selected
                                        }}
                                        className={`px-4 py-3 text-sm font-medium rounded-xl border text-left transition-all ${selectedStyle === value && !customStyle
                                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500 ring-offset-1'
                                            : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        {value}
                                    </button>
                                ))}
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-slate-500">Or type your own</span>
                                </div>
                            </div>

                            <div>
                                <input
                                    type="text"
                                    placeholder="e.g. Cyberpunk Zen Garden"
                                    value={customStyle}
                                    onChange={(e) => setCustomStyle(e.target.value)}
                                    className={`w-full p-4 rounded-xl border-2 transition-all ${customStyle
                                        ? 'border-emerald-500 ring-2 ring-emerald-500 ring-offset-1'
                                        : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500'}`}
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 4: DETAILS */}
                    {currentStep === 4 && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-xl font-bold text-slate-800">Any specific requests?</h2>
                            <p className="text-slate-600 text-sm">Tell us about features you want or click suggestions below to add them.</p>

                            <textarea
                                className="w-full p-4 h-32 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 resize-none text-base"
                                placeholder="e.g. I want a low maintenance yard with a stone walkway and a small water feature..."
                                value={userPrompt}
                                onChange={(e) => setUserPrompt(e.target.value)}
                            />

                            {/* Additional Preferences */}
                            <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <p className="text-sm font-medium text-slate-700">Additional Preferences</p>
                                <p className="text-xs text-slate-500">Click to add to your request:</p>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { label: '👨‍👩‍👧‍👦 Family-friendly', value: 'family-friendly with safe play areas' },
                                        { label: '🧒 Kid-safe', value: 'kid-safe with no sharp edges or toxic plants' },
                                        { label: '🐕 Pet-friendly', value: 'pet-friendly with durable grass and secure fencing' },
                                        { label: '✨ Luxury', value: 'luxury high-end premium finishes' },
                                        { label: '🪑 Furnished', value: 'fully furnished with outdoor furniture' },
                                        { label: '🌿 Low maintenance', value: 'low maintenance drought-resistant' },
                                        { label: '🔥 Fire pit', value: 'cozy fire pit seating area' },
                                        { label: '💧 Water feature', value: 'relaxing water feature or fountain' },
                                        { label: '🏊 Pool area', value: 'pool with surrounding deck' },
                                        { label: '🍽️ Outdoor dining', value: 'outdoor dining and entertainment space' },
                                        { label: '🌺 Colorful flowers', value: 'colorful seasonal flowers' },
                                        { label: '🌳 Privacy', value: 'privacy hedges and screening plants' },
                                        { label: '💡 Lighting', value: 'ambient outdoor lighting for evening use' },
                                        { label: '🧘 Zen garden', value: 'peaceful zen meditation space' },
                                    ].map((keyword) => (
                                        <button
                                            key={keyword.label}
                                            onClick={() => {
                                                const newPrompt = userPrompt
                                                    ? `${userPrompt}, ${keyword.value}`
                                                    : keyword.value;
                                                setUserPrompt(newPrompt);
                                            }}
                                            className="px-3 py-1.5 bg-white hover:bg-emerald-100 hover:text-emerald-700 text-slate-600 text-sm rounded-full transition-colors border border-slate-200 hover:border-emerald-300"
                                        >
                                            {keyword.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Budget Range (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. $5,000 - $10,000, Under $2,000, Unlimited"
                                    value={budget}
                                    onChange={(e) => setBudget(e.target.value)}
                                    className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 transition-all"
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 5: REVIEW */}
                    {currentStep === 5 && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-xl font-bold text-slate-800">Ready to design?</h2>
                            <p className="text-slate-600 text-sm">Review your choices before we generate your new yard.</p>

                            <div className="bg-slate-50 rounded-xl p-6 space-y-4 border border-slate-100">
                                <div className="flex gap-4">
                                    <div className="w-24 h-24 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0">
                                        {yardImagePreview && (
                                            <img src={yardImagePreview} alt="Yard" className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-800">Your Yard</h3>
                                        <p className="text-sm text-slate-500">{yardImage?.name}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                                    <div>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Style</span>
                                        <p className="font-medium text-slate-800">{customStyle || selectedStyle}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Budget</span>
                                        <p className="font-medium text-slate-800">{budget || "Not specified"}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inspiration</span>
                                        <p className="font-medium text-slate-800">{selectedGalleryStyleIds.length + styleImages.length} images</p>
                                    </div>
                                </div>

                                {userPrompt && (
                                    <div className="pt-4 border-t border-slate-200">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Notes</span>
                                        <p className="text-sm text-slate-600 mt-1 italic">"{userPrompt}"</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer Navigation */}
                <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                    <button
                        onClick={prevStep}
                        disabled={currentStep === 1}
                        className={`px-6 py-3 rounded-xl font-medium transition-colors ${currentStep === 1
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}
                    >
                        Back
                    </button>

                    {currentStep < 5 ? (
                        <button
                            onClick={nextStep}
                            disabled={currentStep === 1 && !yardImage}
                            className={`px-8 py-3 rounded-xl font-semibold text-white transition-all transform active:scale-95 ${currentStep === 1 && !yardImage
                                ? 'bg-slate-300 cursor-not-allowed'
                                : 'bg-slate-900 hover:bg-slate-800 shadow-lg'
                                }`}
                        >
                            Next Step
                        </button>
                    ) : (
                        <button
                            onClick={handleGenerate}
                            className="px-8 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-200 transition-all transform active:scale-95 flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                            Generate Design
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
