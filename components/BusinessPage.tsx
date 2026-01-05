import React, { useState, useEffect } from 'react';
import { states, Professional as MockProfessional, setPortfolioImagesFromStorage, regenerateProfessionals } from '../data/professionals';
import { getAllDesigners, DesignerProfile, getPublicDesigns } from '../services/firestoreService';
import { MapPin, Star, Search, Filter, Phone, Mail, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MessageModal } from './MessageModal';
import { ProfessionalProfileModal } from './ProfessionalProfileModal';
import { useAuth } from '../contexts/AuthContext';

// Extend MockProfessional to include optional Firestore fields
interface Professional extends MockProfessional {
    userId?: string;
}

export const BusinessPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [selectedState, setSelectedState] = useState<string>('California');
    const [filterRole, setFilterRole] = useState<'All' | 'Designer' | 'Landscaper'>('All');
    const [filteredPros, setFilteredPros] = useState<Professional[]>([]);
    const [allPros, setAllPros] = useState<Professional[]>(regenerateProfessionals());
    const [isLoading, setIsLoading] = useState(false);

    // Messaging State
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [selectedPro, setSelectedPro] = useState<Professional | null>(null);

    // Profile Modal State
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    useEffect(() => {
        const fetchAndMergeDesigners = async () => {
            setIsLoading(true);
            try {
                // Start with local mock data so the UI never appears empty
                let combinedPros: Professional[] = [...regenerateProfessionals()];

                // Fetch real design images from storage to use for mock professionals
                try {
                    const publicDesigns = await getPublicDesigns(20);
                    const storageImages = publicDesigns
                        .flatMap(d => d.renderImages)
                        .filter(img => img && img.length > 0);

                    if (storageImages.length > 0) {
                        setPortfolioImagesFromStorage(storageImages);
                        combinedPros = [...regenerateProfessionals()];
                    }
                } catch (err) {
                    console.warn("Falling back to local mock images for pros:", err);
                }

                // Fetch real designers from Firestore (best effort)
                try {
                    const realDesigners = await getAllDesigners();
                    const mappedRealPros: Professional[] = realDesigners.map(d => ({
                        id: d.id,
                        userId: d.userId,
                        name: d.businessName || d.fullName,
                        role: 'Garden Designer', // Default role if not specified, or map from d.specialties
                        state: d.state,
                        city: d.city,
                        rating: d.rating || 5.0, // New profiles have 0 rating, give them a boost for display? Or 0.
                        reviewCount: d.reviewCount || 0,
                        introduction: d.bio,
                        imageUrl: d.avatarUrl || `https://mockmind-api.uifaces.co/content/human/${Math.floor(Math.random() * 180) + 1}.jpg`,
                        portfolioImages: d.portfolioImages && d.portfolioImages.length > 0
                            ? d.portfolioImages
                            : ["/demo_clips/autoscape_hero_gen.png"],
                        contactEmail: d.email,
                        contactPhone: d.phone || '',
                        feeRange: 'Contact for pricing'
                    }));

                    combinedPros = [...mappedRealPros, ...combinedPros];
                } catch (err) {
                    console.warn("No real designers loaded; using mock pros only:", err);
                }

                setAllPros(combinedPros);
            } catch (error) {
                console.error("Error fetching designers:", error);
                setAllPros(regenerateProfessionals());
            } finally {
                setIsLoading(false);
            }
        };

        fetchAndMergeDesigners();
    }, []);

    useEffect(() => {
        // Filter professionals based on state and role
        if (selectedState) {
            const filtered = allPros.filter(p => {
                // Normalize state comparison
                const stateMatch = p.state.toLowerCase() === selectedState.toLowerCase();
                const roleMatch = filterRole === 'All'
                    ? true
                    : filterRole === 'Designer'
                        ? (p.role === 'Landscape Architect' || p.role === 'Garden Designer')
                        : p.role === 'Contractor';
                return stateMatch && roleMatch;
            });
            setFilteredPros(filtered);
        } else {
            setFilteredPros([]);
        }
    }, [selectedState, filterRole, allPros]); // Depend on allPros too

    const handleUseLocation = () => {
        setIsLoading(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        // In a real app, we would use a reverse geocoding API here.
                        // For this hackathon demo, we'll simulate finding a state based on "location".
                        // We'll just pick a random state to demonstrate the functionality.
                        // const { latitude, longitude } = position.coords;

                        // Simulate API delay
                        await new Promise(resolve => setTimeout(resolve, 1500));

                        const randomState = states[Math.floor(Math.random() * states.length)];
                        setSelectedState(randomState);
                        setIsLoading(false);
                    } catch (error) {
                        console.error("Error getting location:", error);
                        setIsLoading(false);
                        alert("Could not determine location. Please select a state manually.");
                    }
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    setIsLoading(false);
                    alert("Location access denied. Please select a state manually.");
                }
            );
        } else {
            alert("Geolocation is not supported by this browser.");
            setIsLoading(false);
        }
    };

    const handleMessageClick = (pro: Professional) => {
        setSelectedPro(pro);
        setIsMessageModalOpen(true);
        // Close profile modal if open, to switch to message modal
        setIsProfileModalOpen(false);
    };

    const handleProfileClick = (pro: Professional) => {
        setSelectedPro(pro);
        setIsProfileModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-8 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="text-center mb-12 animate-fade-in">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
                        Find Local Professionals
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
                        Connect with top-rated landscape architects, garden designers, and contractors in your area to bring your vision to life.
                    </p>

                    {user ? (
                        <button
                            onClick={() => navigate('/business/dashboard')}
                            className="px-8 py-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2 mx-auto"
                        >
                            <LayoutDashboard className="w-5 h-5" />
                            Go to Partner Dashboard
                        </button>
                    ) : (
                        <button
                            onClick={() => navigate('/designer-signup')}
                            className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            Join as a Business Partner
                        </button>
                    )}
                </div>

                {/* Search & Filter Section */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-12 border border-gray-100 animate-fade-in">
                    <div className="flex flex-col md:flex-row gap-6 items-center justify-between">

                        {/* Location Selector */}
                        <div className="w-full md:w-1/2 space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Select Location</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <select
                                        value={selectedState}
                                        onChange={(e) => setSelectedState(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none appearance-none"
                                    >
                                        <option value="">Select a State...</option>
                                        {states.map(state => (
                                            <option key={state} value={state}>{state}</option>
                                        ))}
                                    </select>
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                </div>
                                <button
                                    onClick={handleUseLocation}
                                    disabled={isLoading}
                                    className="px-4 py-3 bg-green-100 text-green-700 rounded-xl font-medium hover:bg-green-200 transition-colors flex items-center gap-2 whitespace-nowrap"
                                >
                                    {isLoading ? (
                                        <div className="animate-spin w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full"></div>
                                    ) : (
                                        <MapPin className="w-5 h-5" />
                                    )}
                                    <span className="hidden sm:inline">Use My Location</span>
                                </button>
                            </div>
                        </div>

                        {/* Role Filter */}
                        <div className="w-full md:w-auto space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Filter by Type</label>
                            <div className="flex bg-gray-100 p-1 rounded-xl">
                                {['All', 'Designer', 'Landscaper'].map((role) => (
                                    <button
                                        key={role}
                                        onClick={() => setFilterRole(role as any)}
                                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${filterRole === role
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        {role}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results Grid */}
                {!selectedState ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Location Selected</h3>
                        <p className="text-gray-500">Please select a state or use your location to see professionals near you.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredPros.map((pro) => (
                            <div key={pro.id} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group flex flex-col h-full">
                                {/* Portfolio Image (Best Work) */}
                                <div
                                    className="relative h-48 overflow-hidden cursor-pointer"
                                    onClick={() => handleProfileClick(pro)}
                                >
                                    <img
                                        src={pro.portfolioImages[0]}
                                        alt={`${pro.name}'s best work`}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-gray-800 shadow-sm">
                                        {pro.role}
                                    </div>
                                </div>

                                {/* Profile Info */}
                                <div className="p-6 flex-1 flex flex-col">
                                    <div
                                        className="flex items-start gap-4 mb-4 cursor-pointer"
                                        onClick={() => handleProfileClick(pro)}
                                    >
                                        <img
                                            src={pro.imageUrl}
                                            alt={pro.name}
                                            className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md -mt-10 bg-white relative z-10"
                                        />
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 leading-tight hover:text-green-600 transition-colors">{pro.name}</h3>
                                            <div className="flex items-center gap-1 text-yellow-400 mt-1">
                                                <Star className="w-4 h-4 fill-current" />
                                                <span className="text-sm font-medium text-gray-700">{pro.rating.toFixed(1)}</span>
                                                <span className="text-sm text-gray-400">({pro.reviewCount} reviews)</span>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-gray-600 text-sm mb-6 line-clamp-3 flex-1">
                                        {pro.introduction}
                                    </p>

                                    <div className="space-y-3 mt-auto pt-6 border-t border-gray-100">
                                        <div className="flex items-center gap-3 text-sm text-gray-600">
                                            <MapPin className="w-4 h-4 text-green-600" />
                                            {pro.city}, {pro.state}
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors">
                                                <Phone className="w-4 h-4" />
                                                Call
                                            </button>
                                            <button
                                                onClick={() => handleMessageClick(pro)}
                                                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                                            >
                                                <Mail className="w-4 h-4" />
                                                Message
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Message Modal */}
            {selectedPro && (
                <MessageModal
                    isOpen={isMessageModalOpen}
                    onClose={() => setIsMessageModalOpen(false)}
                    professionalName={selectedPro.name}
                    recipientUserId={selectedPro.userId || ''}
                />
            )}

            {/* Profile Modal */}
            {selectedPro && (
                <ProfessionalProfileModal
                    isOpen={isProfileModalOpen}
                    onClose={() => setIsProfileModalOpen(false)}
                    professional={selectedPro}
                    onMessage={() => handleMessageClick(selectedPro)}
                />
            )}
        </div>
    );
};



