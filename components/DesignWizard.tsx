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
        { number: 1, title: 'The Canvas', description: 'Upload your yard' },
        { number: 2, title: 'The Narrative', description: 'Choose your aesthetic' },
        { number: 3, title: 'The Details', description: 'Refine the vision' },
    ];

    const canProceedFromStep1 = yardImage !== null;
    const canProceedFromStep2 = selectedStyle !== null;

    const handleNext = () => {
        if (currentStep < 3) setCurrentStep(currentStep + 1);
    };

    const handlePrevious = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    return (
        <div className="max-w-screen-2xl mx-auto px-6 md:px-12 pb-24 animate-fade-in text-gray-900 font-light">
            {/* Editorial Header & Progress */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 md:mb-24 border-b border-gray-200 pb-8">
                <div>
                    <span className="block text-xs font-sans uppercase tracking-[0.2em] text-gray-500 mb-4">
                        Project Initiation
                    </span>
                    <h1 className="font-serif text-5xl md:text-7xl font-light italic text-gray-900">
                        {steps[currentStep - 1].title}
                    </h1>
                </div>

                {/* Minimalist Step Indicator */}
                <div className="flex items-center gap-8 mt-8 md:mt-0 font-sans text-sm tracking-widest">
                    {steps.map((step) => (
                        <div
                            key={step.number}
                            className={`flex items-center gap-2 ${currentStep === step.number ? 'text-black font-medium border-b border-black pb-1' :
                                    currentStep > step.number ? 'text-gray-400 line-through' : 'text-gray-300'
                                }`}
                        >
                            <span>0{step.number}</span>
                            <span className="hidden md:inline">{step.description}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Content Area - Clean, Open Layout */}
            <div className="min-h-[500px]">

                {/* Step 1: Upload */}
                {currentStep === 1 && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 animate-fade-in">
                        <div className="lg:col-span-4 space-y-6">
                            <h2 className="font-serif text-3xl italic">Define the Space</h2>
                            <p className="font-sans text-gray-600 leading-relaxed">
                                Provide a clear image of your landscape. This serves as the foundation for our generative design process. Lighting and perspective are key.
                            </p>

                            {yardImage && (
                                <div className="pt-8 space-y-8">
                                    <div className="space-y-2">
                                        <label className="block text-xs uppercase tracking-widest text-gray-500">Location Type</label>
                                        <select
                                            value={locationType}
                                            onChange={(e) => onLocationChange(e.target.value as LocationType)}
                                            className="w-full bg-transparent border-b border-gray-300 py-3 focus:border-black outline-none font-serif text-xl transition-all"
                                        >
                                            {Object.values(LocationType).map((type) => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-xs uppercase tracking-widest text-gray-500">Scale</label>
                                        <select
                                            value={spaceSize}
                                            onChange={(e) => onSizeChange(e.target.value as SpaceSize)}
                                            className="w-full bg-transparent border-b border-gray-300 py-3 focus:border-black outline-none font-serif text-xl transition-all"
                                        >
                                            {Object.values(SpaceSize).map((size) => (
                                                <option key={size} value={size}>{size}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="lg:col-span-8">
                            <div className="bg-gray-50 h-full min-h-[400px] flex flex-col justify-center">
                                <UploadArea
                                    label="DRAG & DROP IMAGE"
                                    subLabel="OR CLICK TO BROWSE"
                                    required
                                    multiple={false}
                                    onFileSelect={onYardSelect}
                                    previewUrls={yardImagePreview ? [yardImagePreview] : []}
                                    onClear={onClearYard}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Design Style */}
                {currentStep === 2 && (
                    <div className="space-y-12 animate-fade-in">
                        <div className="max-w-2xl">
                            <h2 className="font-serif text-3xl italic mb-4">Curate the Aesthetic</h2>
                            <p className="font-sans text-gray-600 leading-relaxed">
                                Select a design language that resonates with your vision. This choice informs the plant palette, material selection, and structural forms.
                            </p>
                        </div>

                        <div className="space-y-16">
                            {Object.entries(DesignStyleGroups).map(([groupName, styles]) => (
                                <div key={groupName} className="space-y-6">
                                    <h3 className="text-xs font-sans font-bold uppercase tracking-[0.2em] text-gray-400 border-b border-gray-100 pb-4">
                                        {groupName}
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">
                                        {styles.map((style) => {
                                            const hash = style.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                                            const imageIndex = hash % styleReferences.length;
                                            const imageUrl = styleReferences[imageIndex].imageUrl;
                                            const isSelected = selectedStyle === style;

                                            return (
                                                <button
                                                    key={style}
                                                    onClick={() => onStyleChange(style)}
                                                    className="group text-left"
                                                >
                                                    <div className={`relative aspect-[3/4] overflow-hidden mb-4 transition-all duration-500 ${isSelected ? 'opacity-100' : 'opacity-70 group-hover:opacity-100 grayscale group-hover:grayscale-0'}`}>
                                                        <img
                                                            src={imageUrl}
                                                            alt={style}
                                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                        />
                                                        {isSelected && (
                                                            <div className="absolute inset-0 border-[1px] border-white/50 m-2" />
                                                        )}
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className={`font-serif text-lg ${isSelected ? 'text-black italic' : 'text-gray-500 group-hover:text-black'}`}>
                                                            {style}
                                                        </span>
                                                        {isSelected && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
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

                {/* Step 3: Details */}
                {currentStep === 3 && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 animate-fade-in">
                        <div className="lg:col-span-4 space-y-8">
                            <div>
                                <h2 className="font-serif text-3xl italic mb-4">Refine the Vision</h2>
                                <p className="font-sans text-gray-600 leading-relaxed">
                                    Detail specific requirements, preferred flora, or functional elements. The more descriptive the narrative, the more tailored the result.
                                </p>
                            </div>

                            <div className="space-y-6 pt-8 border-t border-gray-100">
                                <div>
                                    <h4 className="font-sans text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Considerations</h4>
                                    <ul className="font-serif text-lg italic text-gray-600 space-y-2">
                                        <li>Hardscape materials</li>
                                        <li>Native plantings</li>
                                        <li>Water features</li>
                                        <li>Privacy screening</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-8">
                            <textarea
                                className="w-full h-full min-h-[400px] p-8 bg-gray-50 border border-transparent focus:border-gray-200 resize-none font-serif text-xl leading-relaxed outline-none transition-all placeholder:text-gray-300 placeholder:italic"
                                placeholder="Describe your ideal sanctuary..."
                                value={userPrompt}
                                onChange={(e) => onPromptChange(e.target.value)}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Minimalist Footer Navigation */}
            <div className="mt-24 pt-8 border-t border-gray-200 flex items-center justify-between font-sans text-sm tracking-widest uppercase">
                <button
                    onClick={handlePrevious}
                    disabled={currentStep === 1}
                    className={`transition-colors ${currentStep === 1 ? 'text-gray-200 cursor-not-allowed' : 'text-black hover:text-gray-600'}`}
                >
                    Back
                </button>

                {currentStep < 3 ? (
                    <button
                        onClick={handleNext}
                        disabled={(currentStep === 1 && !canProceedFromStep1) || (currentStep === 2 && !canProceedFromStep2)}
                        className={`px-8 py-4 bg-black text-white hover:bg-gray-800 transition-all ${((currentStep === 1 && !canProceedFromStep1) || (currentStep === 2 && !canProceedFromStep2))
                                ? 'opacity-50 cursor-not-allowed'
                                : ''
                            }`}
                    >
                        Continue
                    </button>
                ) : (
                    <button
                        onClick={onGenerate}
                        disabled={!yardImage}
                        className="px-12 py-4 bg-black text-white hover:bg-gray-800 transition-all disabled:opacity-50"
                    >
                        Generate Narrative
                    </button>
                )}
            </div>
        </div>
    );
};
