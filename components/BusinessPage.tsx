import React, { useState, useEffect } from 'react';
import { professionals, states, Professional } from '../data/professionals';
import { MapPin, Star, Search, Filter, Phone, Mail } from 'lucide-react';
import { MessageModal } from './MessageModal';
import { ProfessionalProfileModal } from './ProfessionalProfileModal';

export const BusinessPage: React.FC = () => {
    const [selectedState, setSelectedState] = useState<string>('');
    const [filterRole, setFilterRole] = useState<'All' | 'Designer' | 'Landscaper'>('All');
    const [filteredPros, setFilteredPros] = useState<Professional[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Messaging State
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [selectedPro, setSelectedPro] = useState<Professional | null>(null);

    // Profile Modal State
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    useEffect(() => {
        // Filter professionals based on state and role
        if (selectedState) {
            const filtered = professionals.filter(p => {
                const stateMatch = p.state === selectedState;
                const roleMatch = filterRole === 'All'
                    ? true
                    : filterRole === 'Designer'
                        ? (p.role === 'Landscape Architect' || p.role === 'Garden Designer')
                        : p.role === 'Contractor';
                return stateMatch && roleMatch;
            });
            setFilteredPros(filtered);
        } else {
            // No state selected: Show random featured professionals (fallback)
            // Create a deterministic but randomized-looking selection based on the role filter if active
            let pool = professionals;

            if (filterRole !== 'All') {
                pool = professionals.filter(p =>
                    filterRole === 'Designer'
                        ? (p.role === 'Landscape Architect' || p.role === 'Garden Designer')
                        : p.role === 'Contractor'
                );
            }

            // Shuffle and pick 6
            const shuffled = [...pool].sort(() => 0.5 - Math.random());
            setFilteredPros(shuffled.slice(0, 6));
        }
    }, [selectedState, filterRole]);

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
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Connect with top-rated landscape architects, garden designers, and contractors in your area to bring your vision to life.
                    </p>
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
                {/* Results Grid */}
                {filteredPros.length > 0 ? (
                    <>
                        {!selectedState && (
                            <div className="mb-8 flex items-center gap-2 text-gray-400 font-light uppercase tracking-widest text-sm animate-fade-in">
                                <Star className="w-4 h-4" />
                                <span>Featured Professionals</span>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredPros.map((pro) => (
                                <div key={pro.id} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group flex flex-col h-full animate-fade-in">
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
                                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-800 shadow-sm">
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
                                                    <span className="text-xs text-gray-400">({pro.reviewCount} reviews)</span>
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
                    </>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Professionals Found</h3>
                        <p className="text-gray-500">We couldn't find any professionals matching your criteria.</p>
                    </div>
                )}
            </div>

            {/* Message Modal */}
            {selectedPro && (
                <MessageModal
                    isOpen={isMessageModalOpen}
                    onClose={() => setIsMessageModalOpen(false)}
                    professionalName={selectedPro.name}
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
