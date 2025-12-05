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

// Placeholder images from Unsplash/Freepik style
const PORTFOLIO_IMAGES = [
    "https://images.unsplash.com/photo-1558904541-efa843a96f01?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1600596542815-3ad19c6f9805?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1598902168898-9a792f212807?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1557429287-b2e26467fc2b?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1584479898061-15742e14f50d?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1592595896551-12b371d546d5?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=800"
];

const PROFILE_IMAGES = [
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200"
];

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
                imageUrl: PROFILE_IMAGES[Math.floor(Math.random() * PROFILE_IMAGES.length)],
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
                imageUrl: PROFILE_IMAGES[Math.floor(Math.random() * PROFILE_IMAGES.length)],
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

export const professionals = generateProfessionals();
export const states = US_STATES;
