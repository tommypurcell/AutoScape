import { TutorialStep } from '../components/TutorialWalkthrough';

export const tutorialSteps: TutorialStep[] = [
    // Landing Page Steps
    {
        id: 'welcome',
        title: 'Welcome to AutoScape! 🎉',
        description: 'AutoScape uses AI to transform your outdoor space. We\'ll create photorealistic designs, detailed 2D plans, and accurate cost estimates - all in minutes!',
        page: 'landing',
        position: 'center',
        action: 'Click "Get Started" to begin your design journey',
    },

    // Upload Page Steps
    {
        id: 'upload-yard',
        title: 'Upload Your Yard Photo',
        description: 'Start by uploading a clear photo of your current outdoor space. The AI will analyze your yard\'s layout, existing features, and dimensions.',
        targetElement: '[data-tutorial="yard-upload"]',
        page: 'upload',
        position: 'right',
        action: 'Click or drag to upload a photo of your yard',
    },
    {
        id: 'select-style',
        title: 'Choose Your Design Style',
        description: 'Browse our curated gallery of landscape styles or upload your own inspiration photos. You can select multiple styles to blend different aesthetics!',
        targetElement: '[data-tutorial="style-gallery"]',
        page: 'upload',
        position: 'left',
        action: 'Select one or more style references from the gallery',
    },
    {
        id: 'choose-aesthetic',
        title: 'Pick Your Aesthetic',
        description: 'Select the overall aesthetic that matches your vision. This helps the AI understand the mood and feel you want for your outdoor space.',
        targetElement: '[data-tutorial="aesthetic-selector"]',
        page: 'upload',
        position: 'right',
        action: 'Choose an aesthetic style (Modern, Traditional, etc.)',
    },
    {
        id: 'add-preferences',
        title: 'Add Your Preferences',
        description: 'Tell us about specific features you want! Mention things like fire pits, water features, plant types, seating areas, or any special requirements.',
        targetElement: '[data-tutorial="preferences-input"]',
        page: 'upload',
        position: 'left',
        action: 'Type your preferences and requirements (optional but recommended)',
    },
    {
        id: 'generate-design',
        title: 'Generate Your Design',
        description: 'Ready to see the magic? Click the button to start the AI design process. This typically takes 30-60 seconds.',
        targetElement: '[data-tutorial="generate-button"]',
        page: 'upload',
        position: 'top',
        action: 'Click "Generate Design" to start the AI process',
    },

    // Processing Page Steps
    {
        id: 'processing-wait',
        title: 'AI is Working Its Magic ✨',
        description: 'Our AI is analyzing your yard, understanding your style preferences, and creating a custom landscape design just for you. This includes generating photorealistic renders, a detailed 2D plan, and cost estimates.',
        page: 'processing',
        position: 'center',
        action: 'Sit back and relax - this takes about 30-60 seconds',
    },

    // Results Page Steps
    {
        id: 'view-renders',
        title: 'Your Design Renders',
        description: 'Here are your photorealistic design renders! These show exactly how your transformed outdoor space will look. You can view multiple variations and angles.',
        targetElement: '[data-tutorial="render-gallery"]',
        page: 'results',
        position: 'bottom',
        action: 'Browse through your design renders',
    },
    {
        id: 'compare-before-after',
        title: 'Compare Before & After',
        description: 'Use the comparison slider to see the transformation side-by-side. Drag the slider left and right to compare your current yard with the new design.',
        targetElement: '[data-tutorial="comparison-slider"]',
        page: 'results',
        position: 'top',
        action: 'Drag the slider to compare before and after',
    },
    {
        id: 'view-plan',
        title: 'Check the 2D Plan',
        description: 'This is your detailed architectural plan showing the layout from above. It includes measurements, plant placements, and hardscape elements.',
        targetElement: '[data-tutorial="plan-view"]',
        page: 'results',
        position: 'bottom',
        action: 'Review the 2D plan for layout details',
    },
    {
        id: 'review-budget',
        title: 'Explore Cost Estimates',
        description: 'See a detailed breakdown of estimated costs including materials, plants, labor, and installation. Costs are itemized so you know exactly what to expect.',
        targetElement: '[data-tutorial="budget-section"]',
        page: 'results',
        position: 'top',
        action: 'Review the budget breakdown and line items',
    },
    {
        id: 'save-design',
        title: 'Save Your Design',
        description: 'Love your design? Save it to your account! You can also choose to publish it to the Community Gallery to inspire others.',
        targetElement: '[data-tutorial="save-button"]',
        page: 'results',
        position: 'top',
        action: 'Click the save button to keep your design',
    },
    {
        id: 'create-new',
        title: 'Try Another Design',
        description: 'Want to explore different styles? Click "New Design" to start fresh with different preferences, or adjust your current inputs to generate variations.',
        targetElement: '[data-tutorial="new-design-button"]',
        page: 'results',
        position: 'top',
        action: 'Click "New Design" to create another version',
    },
    {
        id: 'tutorial-complete',
        title: 'You\'re All Set! 🎊',
        description: 'Congratulations! You now know how to use AutoScape to create stunning landscape designs. Feel free to experiment with different styles, preferences, and photos. Happy designing!',
        page: 'results',
        position: 'center',
        action: 'Start creating your dream outdoor space!',
    },
];

// Helper function to get steps for a specific page
export const getStepsForPage = (page: TutorialStep['page']) => {
    return tutorialSteps.filter(step => step.page === page);
};

// Helper function to get step by ID
export const getStepById = (id: string) => {
    return tutorialSteps.find(step => step.id === id);
};
