import React, { useState, useEffect } from 'react';
import { X, Send, Image as ImageIcon, Loader } from 'lucide-react';
import { SavedDesign, getPublicDesigns, getUserDesigns } from '../services/firestoreService';
import { useDesign } from '../contexts/DesignContext';

interface MessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    professionalName: string;
}

export const MessageModal: React.FC<MessageModalProps> = ({ isOpen, onClose, professionalName }) => {
    const [note, setNote] = useState('');
    const [selectedDesign, setSelectedDesign] = useState<SavedDesign | null>(null);
    const [activeTab, setActiveTab] = useState<'my-designs' | 'gallery'>('my-designs');
    const [designs, setDesigns] = useState<SavedDesign[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [sentSuccess, setSentSuccess] = useState(false);

    // Mock user ID for now since we don't have auth fully implemented in this context
    // In a real app, this would come from an AuthContext
    const MOCK_USER_ID = 'user-123';

    useEffect(() => {
        if (isOpen) {
            fetchDesigns();
            setSentSuccess(false);
            setNote('');
            setSelectedDesign(null);
        }
    }, [isOpen, activeTab]);

    const fetchDesigns = async () => {
        setIsLoading(true);
        try {
            let fetchedDesigns: SavedDesign[] = [];
            if (activeTab === 'my-designs') {
                // In a real app with auth: fetchedDesigns = await getUserDesigns(currentUser.uid);
                // For now, we'll just fetch public designs as a fallback/mock or try to get user designs if we had a real user
                // Let's just use public designs for the demo but filter or label them differently if we could
                fetchedDesigns = await getPublicDesigns(10);
            } else {
                fetchedDesigns = await getPublicDesigns(20);
            }
            setDesigns(fetchedDesigns);
        } catch (error) {
            console.error("Error fetching designs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async () => {
        if (!note && !selectedDesign) return;

        setIsSending(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        setIsSending(false);
        setSentSuccess(true);

        // Close after success message
        setTimeout(() => {
            onClose();
        }, 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-xl font-bold text-gray-900">Message {professionalName}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {sentSuccess ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                <Send className="w-8 h-8" />
                            </div>
                            <h4 className="text-2xl font-bold text-gray-900">Message Sent!</h4>
                            <p className="text-gray-600">Your message and design have been sent to {professionalName}.</p>
                        </div>
                    ) : (
                        <>
                            {/* Note Input */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Your Message</label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder={`Hi ${professionalName}, I'm interested in your services for my landscaping project...`}
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none h-32"
                                />
                            </div>

                            {/* Design Selector */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-medium text-gray-700">Attach a Design (Optional)</label>
                                    <div className="flex bg-gray-100 p-1 rounded-lg">
                                        <button
                                            onClick={() => setActiveTab('my-designs')}
                                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeTab === 'my-designs' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            My Designs
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('gallery')}
                                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeTab === 'gallery' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            Gallery
                                        </button>
                                    </div>
                                </div>

                                {isLoading ? (
                                    <div className="flex justify-center py-8">
                                        <Loader className="w-8 h-8 text-green-600 animate-spin" />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-60 overflow-y-auto pr-2">
                                        {designs.map((design) => (
                                            <div
                                                key={design.id}
                                                onClick={() => setSelectedDesign(selectedDesign?.id === design.id ? null : design)}
                                                className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${selectedDesign?.id === design.id ? 'border-green-500 ring-2 ring-green-200' : 'border-transparent hover:border-gray-200'
                                                    }`}
                                            >
                                                <img
                                                    src={design.renderImages[0]}
                                                    alt="Design"
                                                    className="w-full h-full object-cover"
                                                />
                                                {selectedDesign?.id === design.id && (
                                                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                                        <div className="bg-green-500 text-white p-1 rounded-full">
                                                            <Send className="w-4 h-4" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {designs.length === 0 && (
                                            <div className="col-span-full text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-xl">
                                                No designs found in this category.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                {!sentSuccess && (
                    <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={isSending || (!note && !selectedDesign)}
                            className={`px-8 py-3 bg-green-700 text-white rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all ${isSending || (!note && !selectedDesign)
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'hover:bg-green-800 hover:shadow-xl hover:-translate-y-0.5'
                                }`}
                        >
                            {isSending ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Send Message
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
