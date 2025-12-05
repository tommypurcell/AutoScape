import React, { useState } from 'react';
import { UploadArea } from './UploadArea';
import { DesignStyle, LocationType, SpaceSize, DesignStyleGroups } from '../types';
import { styleReferences } from '../data/styleReferences';
import { Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { HelpTip } from './HelpTip';

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
    initialStep?: number;
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
    initialStep = 1,
}) => {
    const [currentStep, setCurrentStep] = useState(initialStep);

    const steps = [
        { number: 1, title: 'Upload Photo', description: 'Add your yard image' },
        { number: 2, title: 'Choose Design', description: 'Select style & aesthetic' },
        { number: 3, title: 'Add Details', description: 'Describe your preferences' },
    ];

    const canProceedFromStep1 = yardImage !== null;
    const canProceedFromStep2 = selectedStyle !== null; // Style is always selected by default

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
                                <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                                    📸 Upload Your Yard Photo
                                    <HelpTip content="For best results, use a clear, well-lit photo taken from eye level. Ensure the entire area you want to redesign is visible." />
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
                                <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                                    🎨 Choose Your Design Style
                                    <HelpTip content="Select a style that matches your personal taste. This will guide the AI in choosing plants, materials, and layout." />
                                </h2>
                                <p className="text-gray-600">
                                    Select the aesthetic that best matches your vision
                                </p>
                            </div>

                            {/* Grouped Aesthetic Selection */}
                            <div className="space-y-8">
                                {Object.entries(DesignStyleGroups).map(([groupName, styles]) => (
                                    <div key={groupName} className="space-y-4">
                                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2">
                                            {groupName}
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {styles.map((style) => {
                                                // Deterministic image selection
                                                const hash = style.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                                                const imageIndex = hash % styleReferences.length;
                                                const imageUrl = styleReferences[imageIndex].imageUrl;

                                                const isSelected = selectedStyle === style;

                                                return (
                                                    <button
                                                        key={style}
                                                        onClick={() => onStyleChange(style)}
                                                        className={`group relative rounded-xl overflow-hidden aspect-[4/3] transition-all ${isSelected
                                                            ? 'ring-4 ring-green-600 ring-offset-2 shadow-xl scale-105 z-10'
                                                            : 'hover:shadow-lg hover:scale-105 hover:z-10'
                                                            }`}
                                                    >
                                                        <img
                                                            src={imageUrl}
                                                            alt={style}
                                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                        />

                                                        {/* Gradient overlay for text readability */}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                                                        <div className="absolute inset-0 flex flex-col justify-end p-3 text-left">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-white font-bold text-sm md:text-base drop-shadow-lg">
                                                                    {style}
                                                                </span>
                                                                {isSelected && (
                                                                    <div className="bg-green-600 text-white p-1 rounded-full shadow-lg">
                                                                        <Check className="w-3 h-3" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Add Details */}
                    {currentStep === 3 && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                                    ✍️ Add Your Preferences
                                    <HelpTip content="The more specific you are, the better! Mention specific plants, colors, or features (like a fire pit or pergola) you want to include." />
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
