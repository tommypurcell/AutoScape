import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';

export interface TutorialStep {
    id: string;
    title: string;
    description: string;
    targetElement?: string; // CSS selector for highlighting
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
    action?: string; // What the user should do
    image?: string; // Optional screenshot or illustration
    page: 'landing' | 'upload' | 'processing' | 'results';
}

interface TutorialWalkthroughProps {
    steps: TutorialStep[];
    isOpen: boolean;
    onClose: () => void;
    onComplete?: () => void;
    currentPage: 'landing' | 'upload' | 'processing' | 'results';
}

export const TutorialWalkthrough: React.FC<TutorialWalkthroughProps> = ({
    steps,
    isOpen,
    onClose,
    onComplete,
    currentPage,
}) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

    const currentStep = steps[currentStepIndex];
    const isLastStep = currentStepIndex === steps.length - 1;
    const isFirstStep = currentStepIndex === 0;

    // Filter steps for current page
    const pageSteps = steps.filter(step => step.page === currentPage);
    const currentPageStepIndex = pageSteps.findIndex(step => step.id === currentStep?.id);

    useEffect(() => {
        if (!isOpen || !currentStep?.targetElement) {
            setHighlightedElement(null);
            return;
        }

        // Find and highlight the target element
        const element = document.querySelector(currentStep.targetElement) as HTMLElement;
        if (element) {
            setHighlightedElement(element);
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        return () => {
            setHighlightedElement(null);
        };
    }, [currentStepIndex, currentStep, isOpen]);

    const handleNext = () => {
        if (isLastStep) {
            onComplete?.();
            onClose();
        } else {
            setCurrentStepIndex(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (!isFirstStep) {
            setCurrentStepIndex(prev => prev - 1);
        }
    };

    const handleSkip = () => {
        onClose();
    };

    if (!isOpen || !currentStep) return null;

    // Calculate tooltip position
    const getTooltipPosition = () => {
        if (!highlightedElement || currentStep.position === 'center') {
            return {
                position: 'fixed' as const,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
            };
        }

        const rect = highlightedElement.getBoundingClientRect();
        const position = currentStep.position || 'bottom';

        switch (position) {
            case 'top':
                return {
                    position: 'fixed' as const,
                    bottom: `${window.innerHeight - rect.top + 20}px`,
                    left: `${rect.left + rect.width / 2}px`,
                    transform: 'translateX(-50%)',
                };
            case 'bottom':
                return {
                    position: 'fixed' as const,
                    top: `${rect.bottom + 20}px`,
                    left: `${rect.left + rect.width / 2}px`,
                    transform: 'translateX(-50%)',
                };
            case 'left':
                return {
                    position: 'fixed' as const,
                    top: `${rect.top + rect.height / 2}px`,
                    right: `${window.innerWidth - rect.left + 20}px`,
                    transform: 'translateY(-50%)',
                };
            case 'right':
                return {
                    position: 'fixed' as const,
                    top: `${rect.top + rect.height / 2}px`,
                    left: `${rect.right + 20}px`,
                    transform: 'translateY(-50%)',
                };
            default:
                return {
                    position: 'fixed' as const,
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                };
        }
    };

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 z-50 pointer-events-none">
                {/* Dark overlay with cutout for highlighted element */}
                <div className="absolute inset-0 bg-black/60 pointer-events-auto" onClick={handleSkip} />

                {/* Highlight spotlight */}
                {highlightedElement && (
                    <div
                        className="absolute pointer-events-none"
                        style={{
                            top: highlightedElement.getBoundingClientRect().top - 8,
                            left: highlightedElement.getBoundingClientRect().left - 8,
                            width: highlightedElement.getBoundingClientRect().width + 16,
                            height: highlightedElement.getBoundingClientRect().height + 16,
                            boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.6)',
                            borderRadius: '12px',
                            transition: 'all 0.3s ease',
                        }}
                    />
                )}

                {/* Tutorial Card */}
                <div
                    className="pointer-events-auto bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-fade-in"
                    style={getTooltipPosition()}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 text-white">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                    <span className="text-sm font-bold">{currentStepIndex + 1}</span>
                                </div>
                                <h3 className="font-bold text-lg">{currentStep.title}</h3>
                            </div>
                            <button
                                onClick={handleSkip}
                                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-white/20 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-white h-full rounded-full transition-all duration-300"
                                    style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                                />
                            </div>
                            <span className="text-xs font-medium opacity-90">
                                {currentStepIndex + 1}/{steps.length}
                            </span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                        {/* Image/Screenshot */}
                        {currentStep.image && (
                            <div className="rounded-xl overflow-hidden border-2 border-slate-100">
                                <img
                                    src={currentStep.image}
                                    alt={currentStep.title}
                                    className="w-full h-48 object-cover"
                                />
                            </div>
                        )}

                        {/* Description */}
                        <p className="text-slate-700 leading-relaxed">
                            {currentStep.description}
                        </p>

                        {/* Action callout */}
                        {currentStep.action && (
                            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg">
                                <div className="flex items-start gap-3">
                                    <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-emerald-900 mb-1">Your Action:</p>
                                        <p className="text-sm text-emerald-800">{currentStep.action}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Page indicator */}
                        {pageSteps.length > 1 && (
                            <div className="flex items-center gap-2 pt-2">
                                <span className="text-xs text-slate-500">
                                    Step {currentPageStepIndex + 1} of {pageSteps.length} on this page
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <button
                            onClick={handleSkip}
                            className="text-sm text-slate-600 hover:text-slate-800 font-medium transition-colors"
                        >
                            Skip Tutorial
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrevious}
                                disabled={isFirstStep}
                                className={`p-2 rounded-lg transition-all ${isFirstStep
                                        ? 'text-slate-300 cursor-not-allowed'
                                        : 'text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            <button
                                onClick={handleNext}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-all transform active:scale-95"
                            >
                                {isLastStep ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Finish
                                    </>
                                ) : (
                                    <>
                                        Next
                                        <ChevronRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
