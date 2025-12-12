// DesignContext.tsx
// This file contains the logic for interacting with the Google GenAI API
// It is used to generate landscape designs based on user input


import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AppState, DesignStyle, GeneratedDesign } from '../types';
import { styleReferences } from '../data/styleReferences';
import { urlsToFiles } from '../utils/imageUtils';

interface DesignContextType {
    // State
    yardImage: File | null;
    yardImagePreview: string | null;
    styleImages: File[];
    styleImagePreviews: string[];
    userPrompt: string;
    budget: string;
    selectedStyle: DesignStyle;
    result: GeneratedDesign | null;
    error: string | null;
    isProcessing: boolean;
    location: string; // User's location for climate-aware plant recommendations

    // Gallery State
    selectedGalleryStyleIds: string[];
    styleSelectionMode: 'gallery' | 'upload';

    // Actions
    setYardImage: (file: File | null) => void;
    setYardImagePreview: (url: string | null) => void;
    addStyleImages: (files: File[]) => void;
    removeStyleImage: (index: number) => void;
    clearAllStyles: () => void;
    setUserPrompt: (prompt: string) => void;
    setBudget: (budget: string) => void;
    setSelectedStyle: (style: DesignStyle) => void;
    setResult: (result: GeneratedDesign | null) => void;
    setError: (error: string | null) => void;
    setIsProcessing: (isProcessing: boolean) => void;
    setLocation: (location: string) => void;

    // Gallery Actions
    toggleGalleryStyle: (styleId: string) => void;
    clearGalleryStyles: () => void;
    setStyleSelectionMode: (mode: 'gallery' | 'upload') => void;

    // Helpers
    resetDesign: () => void;
    loadDesign: (design: any) => void;
}

const DesignContext = createContext<DesignContextType | undefined>(undefined);

export const DesignProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [yardImage, setYardImageState] = useState<File | null>(null);
    const [yardImagePreview, setYardImagePreview] = useState<string | null>(null);
    const [styleImages, setStyleImages] = useState<File[]>([]);
    const [styleImagePreviews, setStyleImagePreviews] = useState<string[]>([]);
    const [userPrompt, setUserPrompt] = useState('');
    const [budget, setBudget] = useState('');
    const [selectedStyle, setSelectedStyle] = useState<DesignStyle>(DesignStyle.MODERN);
    const [result, setResult] = useState<GeneratedDesign | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [location, setLocation] = useState<string>('California'); // Default to California

    // Gallery state
    const [selectedGalleryStyleIds, setSelectedGalleryStyleIds] = useState<string[]>([]);
    const [styleSelectionMode, setStyleSelectionMode] = useState<'gallery' | 'upload'>('gallery');

    const setYardImage = (file: File | null) => {
        if (yardImagePreview) URL.revokeObjectURL(yardImagePreview);

        if (file) {
            setYardImageState(file);
            setYardImagePreview(URL.createObjectURL(file));
        } else {
            setYardImageState(null);
            setYardImagePreview(null);
        }
    };

    const addStyleImages = (files: File[]) => {
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setStyleImages(prev => [...prev, ...files]);
        setStyleImagePreviews(prev => [...prev, ...newPreviews]);
    };

    const removeStyleImage = (index: number) => {
        URL.revokeObjectURL(styleImagePreviews[index]);
        setStyleImages(prev => prev.filter((_, i) => i !== index));
        setStyleImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const clearAllStyles = () => {
        styleImagePreviews.forEach(url => URL.revokeObjectURL(url));
        setStyleImages([]);
        setStyleImagePreviews([]);
    };

    const toggleGalleryStyle = (styleId: string) => {
        setSelectedGalleryStyleIds(prev => {
            if (prev.includes(styleId)) {
                return prev.filter(id => id !== styleId);
            } else {
                return [...prev, styleId];
            }
        });
    };

    const clearGalleryStyles = () => {
        setSelectedGalleryStyleIds([]);
    };

    const resetDesign = () => {
        if (yardImagePreview) URL.revokeObjectURL(yardImagePreview);
        styleImagePreviews.forEach(url => URL.revokeObjectURL(url));

        setYardImageState(null);
        setYardImagePreview(null);
        setStyleImages([]);
        setStyleImagePreviews([]);
        setUserPrompt('');
        setBudget('');
        setSelectedStyle(DesignStyle.MODERN);
        setResult(null);
        setError(null);
        setIsProcessing(false);
        setSelectedGalleryStyleIds([]);
        setStyleSelectionMode('gallery');
        setLocation('California');
    };

    const loadDesign = (design: any) => {
        setResult({
            renderImages: design.renderImages,
            planImage: design.planImage,
            estimates: design.estimates,
            analysis: design.analysis,
        });
    };

    return (
        <DesignContext.Provider value={{
            yardImage,
            yardImagePreview,
            styleImages,
            styleImagePreviews,
            userPrompt,
            budget,
            selectedStyle,
            result,
            error,
            isProcessing,
            location,
            selectedGalleryStyleIds,
            styleSelectionMode,
            setYardImage,
            setYardImagePreview,
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
            resetDesign,
            loadDesign
        }}>
            {children}
        </DesignContext.Provider>
    );
};

export const useDesign = () => {
    const context = useContext(DesignContext);
    if (context === undefined) {
        throw new Error('useDesign must be used within a DesignProvider');
    }
    return context;
};
