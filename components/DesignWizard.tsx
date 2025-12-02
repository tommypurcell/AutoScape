import React, { useState } from 'react';
import { UploadArea } from './UploadArea';
import { StyleGallery } from './StyleGallery';
import { DesignStyle, LocationType, SpaceSize, DesignStyleGroups } from '../types';
import { styleReferences } from '../data/styleReferences';
import { Check, ChevronRight, ChevronLeft } from 'lucide-react';

interface DesignWizardProps {
    yardImage: File | null;
    yardImagePreview: string | null;
    styleImages: File[];
    styleImagePreviews: string[];
    selectedGalleryStyleIds: string[];
    selectedStyle: DesignStyle | string;
    locationType: LocationType;
    spaceSize: SpaceSize;
    userPrompt: string;
    onYardSelect: (files: File[]) => void;
    onClearYard: () => void;
    onStyleSelect: (files: File[]) => void;
    onClearStyleImage: (index: number) => void;
    onClearAllStyles: () => void;
    onGalleryStyleToggle: (styleId: string) => void;
    onClearGalleryStyles: () => void;
    onStyleChange: (style: DesignStyle | string) => void;
    onLocationChange: (type: LocationType) => void;
    onSizeChange: (size: SpaceSize) => void;
    onPromptChange: (prompt: string) => void;
    onGenerate: () => void;
}

export const DesignWizard: React.FC<DesignWizardProps> = ({
    yardImage,
    yardImagePreview,
    styleImages,
    styleImagePreviews,
    selectedGalleryStyleIds,
    selectedStyle,
    locationType,
    spaceSize,
    userPrompt,
    onYardSelect,
    onClearYard,
    onStyleSelect,
    onClearStyleImage,
    onClearAllStyles,
    onGalleryStyleToggle,
    onClearGalleryStyles,
    onStyleChange,
    onLocationChange,
    onSizeChange,
    onPromptChange,
    onGenerate,
}) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [styleSelectionMode, setStyleSelectionMode] = useState<'gallery' | 'upload'>('gallery');

    const steps = [
        { number: 1, title: 'Upload Photo', description: 'Add your yard image' },
        { number: 2, title: 'Choose Design', description: 'Select style & aesthetic' },
        { number: 3, title: 'Add Details', description: 'Describe your preferences' },
    ];

    const canProceedFromStep1 = yardImage !== null;
    const canProceedFromStep2 = selectedGalleryStyleIds.length > 0 || styleImages.length > 0;

    const handleNext = () => {
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleStepClick = (stepNumber: number) => {
        // Only allow clicking on completed steps or the next step
        if (stepNumber === 1) {
            setCurrentStep(1);
        } else if (stepNumber === 2 && canProceedFromStep1) {
            setCurrentStep(2);
        } else if (stepNumber === 3 && canProceedFromStep1 && canProceedFromStep2) {
            setCurrentStep(3);
        }
    };

    return (
        <div className="max-w-5xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
                    Create Your Design
                </h1>
                <p className="text-lg text-gray-600">
                    Follow these simple steps to generate your landscape design
                </p>
            </div>

            {/* Step Indicator */}
            <div className="mb-12">
                <div className="flex items-center justify-between max-w-2xl mx-auto">
                    {steps.map((step, index) => (
                        <React.Fragment key={step.number}>
                            <div className="flex flex-col items-center flex-1">
                                <button
                                    onClick={() => handleStepClick(step.number)}
                                    disabled={
                                        (step.number === 2 && !canProceedFromStep1) ||
                                        (step.number === 3 && (!canProceedFromStep1 || !canProceedFromStep2))
                                    }
                                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all mb-2 ${currentStep === step.number
                                        ? 'bg-green-700 text-white ring-4 ring-green-200 scale-110'
                                        : currentStep > step.number
                                            ? 'bg-green-600 text-white cursor-pointer hover:bg-green-700'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    {currentStep > step.number ? (
                                        <Check className="w-6 h-6" />
                                    ) : (
                                        step.number
                                    )}
                                </button>
                                <div className="text-center">
                                    <p className={`font-semibold text-sm ${currentStep === step.number ? 'text-green-700' : 'text-gray-600'
                                        }`}>
                                        {step.title}
                                    </p>
                                    <p className="text-xs text-gray-500">{step.description}</p>
                                </div>
                            </div>
                            {index < steps.length - 1 && (
                                <div className={`flex-1 h-1 mx-4 mb-8 rounded-full transition-all ${currentStep > step.number ? 'bg-green-600' : 'bg-gray-200'
                                    }`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Step Content */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-8 md:p-12 min-h-[500px]">

                    {/* Step 1: Upload Photo */}
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    📸 Upload Your Yard Photo
                                </h2>
                                <p className="text-gray-600">
                                    Take a clear photo of your outdoor space. The AI will analyze the layout and create a design that fits perfectly.
                                </p>
                            </div>

                            <div className="max-w-xl mx-auto space-y-8">
                                <UploadArea
                                    label="Upload Yard Photo"
                                    subLabel="Required"
                                    required
                                    multiple={false}
                                    onFileSelect={onYardSelect}
                                    previewUrls={yardImagePreview ? [yardImagePreview] : []}
                                    onClear={onClearYard}
                                />

                                {yardImage && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                                        <div className="space-y-3">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Location Type
                                            </label>
                                            <select
                                                value={locationType}
                                                onChange={(e) => onLocationChange(e.target.value as LocationType)}
                                                className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                            >
                                                {Object.values(LocationType).map((type) => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Space Size
                                            </label>
                                            <select
                                                value={spaceSize}
                                                onChange={(e) => onSizeChange(e.target.value as SpaceSize)}
                                                className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                            >
                                                {Object.values(SpaceSize).map((size) => (
                                                    <option key={size} value={size}>{size}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg max-w-xl mx-auto">
                                <p className="text-sm text-blue-900">
                                    <strong>💡 Pro Tip:</strong> Use good lighting and capture the full area you want to redesign for best results.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Choose Design */}
                    {currentStep === 2 && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    🎨 Choose Your Design Style
                                </h2>
                                <p className="text-gray-600">
                                    Select style references and pick your preferred aesthetic
                                </p>
                            </div>

                            {/* Style References */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <label className="block text-lg font-semibold text-gray-800">
                                        Style References
                                    </label>
                                    {(selectedGalleryStyleIds.length > 0 || styleImages.length > 0) && (
                                        <span className="text-sm text-green-700 font-medium">
                                            {selectedGalleryStyleIds.length + styleImages.length} selected
                                        </span>
                                    )}
                                </div>

                                {/* Mode Toggle */}
                                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg max-w-xs">
                                    <button
                                        onClick={() => setStyleSelectionMode('gallery')}
                                        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${styleSelectionMode === 'gallery'
                                            ? 'bg-white text-green-700 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-800'
                                            }`}
                                    >
                                        🖼️ Gallery
                                    </button>
                                    <button
                                        onClick={() => setStyleSelectionMode('upload')}
                                        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${styleSelectionMode === 'upload'
                                            ? 'bg-white text-green-700 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-800'
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
                                        onStyleToggle={onGalleryStyleToggle}
                                        onClearAll={onClearGalleryStyles}
                                    />
                                )}

                                {/* Upload Mode */}
                                {styleSelectionMode === 'upload' && (
                                    <>
                                        <label className="block cursor-pointer">
                                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-green-600 hover:bg-green-50/50 transition-all">
                                                <svg className="w-10 h-10 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <p className="text-sm text-gray-600 font-medium">Add Custom Style Images</p>
                                                <p className="text-xs text-gray-400 mt-1">Click to select multiple images</p>
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={(e) => {
                                                    const files = e.target.files ? Array.from(e.target.files) as File[] : [];
                                                    if (files.length > 0) {
                                                        onStyleSelect(files);
                                                        e.target.value = '';
                                                    }
                                                }}
                                                className="hidden"
                                            />
                                        </label>

                                        {styleImagePreviews.length > 0 && (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-600 font-medium">Uploaded Images</span>
                                                    <button
                                                        onClick={onClearAllStyles}
                                                        className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                                                    >
                                                        Clear all ({styleImages.length})
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {styleImagePreviews.map((preview, index) => (
                                                        <div key={index} className="relative group">
                                                            <img
                                                                src={preview}
                                                                alt={`Style ${index + 1}`}
                                                                className="w-full h-24 object-cover rounded-lg border border-gray-200"
                                                            />
                                                            <button
                                                                onClick={() => onClearStyleImage(index)}
                                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
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

                            <hr className="border-gray-200 my-8" />

                            {/* Grouped Aesthetic Selection */}
                            <div className="space-y-6">
                                <label className="block text-lg font-semibold text-gray-800">
                                    Select Design Aesthetic
                                </label>
                                <div className="space-y-6">
                                    {Object.entries(DesignStyleGroups).map(([groupName, styles]) => (
                                        <div key={groupName} className="space-y-3">
                                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                                {groupName}
                                            </h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {styles.map((style) => (
                                                    <button
                                                        key={style}
                                                        onClick={() => onStyleChange(style)}
                                                        className={`px-4 py-3 text-sm font-medium rounded-lg border text-left transition-all ${selectedStyle === style
                                                            ? 'border-green-600 bg-green-50 text-green-800 ring-2 ring-green-600'
                                                            : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        {style}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Add Details */}
                    {currentStep === 3 && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    ✍️ Add Your Preferences
                                </h2>
                                <p className="text-gray-600">
                                    Tell us about specific features you want in your landscape design
                                </p>
                            </div>

                            <div className="max-w-2xl mx-auto space-y-4">
                                <label className="block text-lg font-semibold text-gray-800">
                                    Additional Preferences (Optional)
                                </label>
                                <textarea
                                    className="w-full p-4 h-48 bg-white rounded-lg border-2 border-gray-200 focus:border-green-600 focus:ring-green-600 resize-none text-sm"
                                    placeholder="e.g. I want a fire pit area with comfortable seating, low maintenance native plants, a stone walkway to the backyard, and a small vegetable garden..."
                                    value={userPrompt}
                                    onChange={(e) => onPromptChange(e.target.value)}
                                />

                                <div className="grid md:grid-cols-2 gap-4 mt-6">
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <h4 className="font-semibold text-gray-800 mb-2 text-sm">💡 Suggestions:</h4>
                                        <ul className="text-xs text-gray-600 space-y-1">
                                            <li>• Fire pit or outdoor kitchen</li>
                                            <li>• Water features (fountain, pond)</li>
                                            <li>• Seating areas or pergola</li>
                                            <li>• Plant preferences (native, low-maintenance)</li>
                                        </ul>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <h4 className="font-semibold text-gray-800 mb-2 text-sm">🎯 Be Specific:</h4>
                                        <ul className="text-xs text-gray-600 space-y-1">
                                            <li>• Mention colors you like</li>
                                            <li>• Budget considerations</li>
                                            <li>• Maintenance level desired</li>
                                            <li>• Special requirements (pets, kids)</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation Footer */}
                <div className="px-8 md:px-12 py-6 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                    <button
                        onClick={handlePrevious}
                        disabled={currentStep === 1}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${currentStep === 1
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Previous
                    </button>

                    <div className="text-sm text-gray-500">
                        Step {currentStep} of {steps.length}
                    </div>

                    {currentStep < 3 ? (
                        <button
                            onClick={handleNext}
                            disabled={
                                (currentStep === 1 && !canProceedFromStep1) ||
                                (currentStep === 2 && !canProceedFromStep2)
                            }
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${(currentStep === 1 && !canProceedFromStep1) ||
                                (currentStep === 2 && !canProceedFromStep2)
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-green-700 text-white hover:bg-green-800 shadow-lg hover:shadow-xl'
                                }`}
                        >
                            Next
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            onClick={onGenerate}
                            disabled={!yardImage}
                            className={`flex items-center gap-2 px-8 py-3 rounded-lg font-bold text-lg transition-all transform active:scale-95 ${yardImage
                                ? 'bg-green-700 text-white hover:bg-green-800 shadow-lg hover:shadow-xl'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                            Generate Design
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
