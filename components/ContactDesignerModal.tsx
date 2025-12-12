import React, { useState } from 'react';
import { professionals, Professional } from '../data/professionals';
import { MapPin, Star, X, ArrowLeft, Send, Check } from 'lucide-react';

interface ContactDesignerModalProps {
    isOpen: boolean;
    onClose: () => void;
    designLink: string;
}

type ModalView = 'list' | 'form' | 'success';

export const ContactDesignerModal: React.FC<ContactDesignerModalProps> = ({
    isOpen,
    onClose,
    designLink
}) => {
    const [view, setView] = useState<ModalView>('list');
    const [selectedDesigner, setSelectedDesigner] = useState<Professional | null>(null);
    const [message, setMessage] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userName, setUserName] = useState('');
    const [selectedState, setSelectedState] = useState('California');
    const [roleFilter, setRoleFilter] = useState<string>('all');

    if (!isOpen) return null;

    // Filter professionals by state and role
    const filteredProfessionals = professionals.filter(pro => {
        const stateMatch = pro.state === selectedState;
        const roleMatch = roleFilter === 'all' ||
            (roleFilter === 'designer' && (pro.role === 'Landscape Architect' || pro.role === 'Garden Designer')) ||
            (roleFilter === 'contractor' && pro.role === 'Contractor');
        return stateMatch && roleMatch;
    }).slice(0, 6); // Limit to 6 for display

    const handleSelectDesigner = (designer: Professional) => {
        setSelectedDesigner(designer);
        setMessage(`Hi ${designer.name},\n\nI'm interested in your landscaping services. I've created a design using AutoScape that I'd like to discuss with you.\n\nDesign Link: ${designLink}\n\nPlease let me know if you're available for a consultation.\n\nBest regards`);
        setView('form');
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        // Here you would typically send the message to your backend
        console.log('Message sent to:', selectedDesigner?.name);
        console.log('Message:', message);
        console.log('From:', userName, userEmail);
        setView('success');

        // Reset and go back to list after 2 seconds
        setTimeout(() => {
            setMessage('');
            setSelectedDesigner(null);
            setView('list');
        }, 2000);
    };

    const handleBack = () => {
        setView('list');
        setSelectedDesigner(null);
    };

    const uniqueStates = [...new Set(professionals.map(p => p.state))].sort();

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        {view !== 'list' && (
                            <button onClick={handleBack} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                                <ArrowLeft className="w-5 h-5 text-slate-600" />
                            </button>
                        )}
                        <h2 className="text-xl font-bold text-slate-800">
                            {view === 'list' && 'Find a Designer Near You'}
                            {view === 'form' && `Message ${selectedDesigner?.name}`}
                            {view === 'success' && 'Message Sent!'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-slate-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {/* Designer List View */}
                    {view === 'list' && (
                        <div className="space-y-4">
                            {/* Filters */}
                            <div className="flex flex-wrap gap-3">
                                <select
                                    value={selectedState}
                                    onChange={(e) => setSelectedState(e.target.value)}
                                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    {uniqueStates.map(state => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                </select>
                                <select
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="all">All Professionals</option>
                                    <option value="designer">Designers & Architects</option>
                                    <option value="contractor">Contractors</option>
                                </select>
                            </div>

                            {/* Designer Cards */}
                            <div className="grid gap-3">
                                {filteredProfessionals.length === 0 ? (
                                    <p className="text-slate-500 text-center py-8">No professionals found in {selectedState}. Try selecting a different state.</p>
                                ) : (
                                    filteredProfessionals.map(pro => (
                                        <div
                                            key={pro.id}
                                            onClick={() => handleSelectDesigner(pro)}
                                            className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group"
                                        >
                                            <img
                                                src={pro.imageUrl}
                                                alt={pro.name}
                                                className="w-16 h-16 rounded-full object-cover border-2 border-slate-100 group-hover:border-emerald-400 transition-colors"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">{pro.name}</h3>
                                                <p className="text-sm text-slate-600">{pro.role}</p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <div className="flex items-center gap-1 text-sm">
                                                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                                        <span className="font-medium text-slate-700">{pro.rating.toFixed(1)}</span>
                                                        <span className="text-slate-500">({pro.reviewCount})</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-sm text-slate-500">
                                                        <MapPin className="w-3 h-3" />
                                                        <span>{pro.city}, {pro.state}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs text-slate-500">Fee Range</span>
                                                <p className="text-sm font-semibold text-emerald-600">{pro.feeRange}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Message Form View */}
                    {view === 'form' && selectedDesigner && (
                        <form onSubmit={handleSendMessage} className="space-y-4">
                            {/* Selected Designer Card */}
                            <div className="flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                                <img
                                    src={selectedDesigner.imageUrl}
                                    alt={selectedDesigner.name}
                                    className="w-14 h-14 rounded-full object-cover border-2 border-emerald-300"
                                />
                                <div>
                                    <h3 className="font-bold text-slate-800">{selectedDesigner.name}</h3>
                                    <p className="text-sm text-slate-600">{selectedDesigner.role} • {selectedDesigner.city}, {selectedDesigner.state}</p>
                                </div>
                            </div>

                            {/* Contact Form */}
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Your Name</label>
                                        <input
                                            type="text"
                                            value={userName}
                                            onChange={(e) => setUserName(e.target.value)}
                                            placeholder="John Doe"
                                            required
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Your Email</label>
                                        <input
                                            type="email"
                                            value={userEmail}
                                            onChange={(e) => setUserEmail(e.target.value)}
                                            placeholder="john@example.com"
                                            required
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        rows={8}
                                        required
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                                    />
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-sm text-blue-800">
                                        <strong>Design Link Included:</strong> {designLink}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors"
                            >
                                <Send className="w-4 h-4" />
                                Send Message
                            </button>
                        </form>
                    )}

                    {/* Success View */}
                    {view === 'success' && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                                <Check className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Message Sent!</h3>
                            <p className="text-slate-600">Your message has been sent to {selectedDesigner?.name}.</p>
                            <p className="text-sm text-slate-500 mt-2">They will respond to your email shortly.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
