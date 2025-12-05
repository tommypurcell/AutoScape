import React from 'react';
import { X, Star, MapPin, Phone, Mail, DollarSign, Award } from 'lucide-react';
import { Professional } from '../data/professionals';

interface ProfessionalProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    professional: Professional;
    onMessage: () => void;
}

export const ProfessionalProfileModal: React.FC<ProfessionalProfileModalProps> = ({
    isOpen,
    onClose,
    professional,
    onMessage
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors backdrop-blur-md"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="flex flex-col md:flex-row h-full overflow-y-auto">

                    {/* Left Column: Visuals */}
                    <div className="w-full md:w-1/2 bg-gray-100 flex flex-col">
                        {/* Best Design (Hero Image) */}
                        <div className="relative h-64 md:h-2/3">
                            <img
                                src={professional.portfolioImages[0]}
                                alt="Best Work"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                                <div className="flex items-center gap-2 text-white mb-1">
                                    <Award className="w-5 h-5 text-yellow-400" />
                                    <span className="font-bold text-lg">Featured Project</span>
                                </div>
                            </div>
                        </div>

                        {/* Secondary Images Grid */}
                        <div className="h-32 md:h-1/3 grid grid-cols-2 gap-1 p-1 bg-white">
                            {professional.portfolioImages.slice(1).map((img, idx) => (
                                <img
                                    key={idx}
                                    src={img}
                                    alt={`Portfolio ${idx + 1}`}
                                    className="w-full h-full object-cover rounded-lg"
                                />
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Details */}
                    <div className="w-full md:w-1/2 p-8 flex flex-col bg-white">

                        {/* Header Info */}
                        <div className="flex items-start gap-4 mb-6">
                            <img
                                src={professional.imageUrl}
                                alt={professional.name}
                                className="w-20 h-20 rounded-full object-cover border-4 border-gray-50 shadow-lg"
                            />
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 leading-tight">{professional.name}</h2>
                                <p className="text-green-700 font-medium">{professional.role}</p>
                                <div className="flex items-center gap-1 text-yellow-400 mt-1">
                                    <Star className="w-4 h-4 fill-current" />
                                    <span className="text-sm font-bold text-gray-900">{professional.rating.toFixed(1)}</span>
                                    <span className="text-sm text-gray-500">({professional.reviewCount} reviews)</span>
                                </div>
                            </div>
                        </div>

                        {/* About Section */}
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">About</h3>
                            <p className="text-gray-600 leading-relaxed">
                                {professional.introduction}
                            </p>
                        </div>

                        {/* Fee Range Section */}
                        <div className="mb-8 bg-green-50 rounded-xl p-4 border border-green-100">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Estimated Project Fees</h4>
                                    <p className="text-xs text-gray-500">Typical range for full service</p>
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-green-700 ml-13 pl-13 text-center mt-2">
                                {professional.feeRange}
                            </p>
                        </div>

                        {/* Contact Info & Actions */}
                        <div className="mt-auto space-y-4">
                            <div className="flex items-center gap-2 text-gray-600">
                                <MapPin className="w-5 h-5 text-gray-400" />
                                <span>{professional.city}, {professional.state}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                                <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors">
                                    <Phone className="w-5 h-5" />
                                    Call
                                </button>
                                <button
                                    onClick={onMessage}
                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform"
                                >
                                    <Mail className="w-5 h-5" />
                                    Message
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
