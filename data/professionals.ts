export interface Professional {
    id: string;
    name: string;
    role: 'Landscape Architect' | 'Garden Designer' | 'Contractor' | 'Horticulturist';
    state: string;
    city: string;
    rating: number;
    reviewCount: number;
    introduction: string;
    imageUrl: string;
    portfolioImages: string[];
    contactEmail: string;
    contactPhone: string;
    feeRange: string;
}

const US_STATES = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
    'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
    'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
    'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
    'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

const FIRST_NAMES = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

const INTROS = [
    "Specializing in sustainable and eco-friendly garden designs.",
    "Transforming outdoor spaces into living works of art.",
    "Expert in native plant selection and drought-tolerant landscapes.",
    "Creating modern, minimalist outdoor sanctuaries.",
    "Award-winning designer with 15+ years of experience.",
    "Passionate about bringing your dream garden to life.",
    "Focusing on functional and beautiful family-friendly yards.",
    "Blending hardscape and softscape for perfect harmony.",
    "Dedicated to organic gardening and permaculture principles.",
    "Luxury landscape architecture for discerning clients."
];

import { DesignStyle } from '../types';
import { getStyleImage } from './styleReferences';

// Portfolio images will be populated from real designs in storage
// Fallback set (served from /public) to guarantee visuals even when Firestore has none
let PORTFOLIO_IMAGES: string[] = [
    "/demo_clips/autoscape_hero_gen.png",
    "/demo_clips/after-pad.png",
    "/images/hero-after.jpg",
    "/demo_clips/estimate.png",
    "/demo_clips/pie-chart.png",
    "/demo_clips/scene_2_solution.jpg",
    "/demo_clips/scene_1_problem.jpg",
];

// Generate random avatar URL with number between 1-180
const getRandomAvatarUrl = (): string => {
    const randomNum = Math.floor(Math.random() * 180) + 1;
    return `https://mockmind-api.uifaces.co/content/human/${randomNum}.jpg`;
};

// Function to set portfolio images from real designs
export const setPortfolioImagesFromStorage = (imageUrls: string[]) => {
    if (imageUrls.length > 0) {
        PORTFOLIO_IMAGES = imageUrls;
    }
};

const generateProfessionals = (): Professional[] => {
    const professionals: Professional[] = [];
    let idCounter = 1;

    US_STATES.forEach(state => {
        // Generate 3 Designers
        for (let i = 0; i < 3; i++) {
            const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
            const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
            professionals.push({
                id: `prof-${idCounter++}`,
                name: `${firstName} ${lastName}`,
                role: i === 0 ? 'Landscape Architect' : 'Garden Designer',
                state: state,
                city: 'City Name', // Could be more specific if needed
                rating: 4 + Math.random(),
                reviewCount: Math.floor(Math.random() * 50) + 10,
                introduction: INTROS[Math.floor(Math.random() * INTROS.length)],
                imageUrl: getRandomAvatarUrl(),
                portfolioImages: [
                    PORTFOLIO_IMAGES[Math.floor(Math.random() * PORTFOLIO_IMAGES.length)],
                    PORTFOLIO_IMAGES[Math.floor(Math.random() * PORTFOLIO_IMAGES.length)]
                ],
                contactEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
                contactPhone: '(555) 123-4567',
                feeRange: i === 0 ? '$5,000 - $15,000' : '$2,000 - $8,000'
            });
        }

        // Generate 3 Landscapers
        for (let i = 0; i < 3; i++) {
            const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
            const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
            professionals.push({
                id: `prof-${idCounter++}`,
                name: `${firstName} ${lastName}`,
                role: 'Contractor',
                state: state,
                city: 'City Name',
                rating: 4 + Math.random(),
                reviewCount: Math.floor(Math.random() * 50) + 10,
                introduction: "Professional landscaping services including installation, maintenance, and hardscaping.",
                imageUrl: getRandomAvatarUrl(),
                portfolioImages: [
                    PORTFOLIO_IMAGES[Math.floor(Math.random() * PORTFOLIO_IMAGES.length)],
                    PORTFOLIO_IMAGES[Math.floor(Math.random() * PORTFOLIO_IMAGES.length)]
                ],
                contactEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
                contactPhone: '(555) 987-6543',
                feeRange: '$10,000 - $100,000+'
            });
        }
    });

    return professionals;
};

// Generate initial professionals
let cachedProfessionals: Professional[] = [];

export const getProfessionals = (): Professional[] => {
    if (cachedProfessionals.length === 0) {
        cachedProfessionals = generateProfessionals();
    }
    return cachedProfessionals;
};

// Regenerate professionals with new portfolio images
export const regenerateProfessionals = () => {
    cachedProfessionals = generateProfessionals();
    return cachedProfessionals;
};

export const professionals = generateProfessionals();
export const states = US_STATES;
