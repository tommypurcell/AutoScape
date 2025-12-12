import React, { useState } from 'react';
import { X, Upload, MapPin, Briefcase, Star, CheckCircle } from 'lucide-react';

interface DesignerOnboardingProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (designerData: DesignerFormData) => void;
}

export interface DesignerFormData {
    businessName: string;
    fullName: string;
    email: string;
    password: string;
    phone: string;
    city: string;
    state: string;
    specialties: string[];
    yearsExperience: string;
    website?: string;
    bio: string;
    portfolioImages: string[];
    role: 'designer';
}

const specialtyOptions = [
    'Landscape Architect',
    'Garden Designer',
    'Hardscape Specialist',
    'Irrigation Expert',
    'Lighting Designer',
    'Pool Designer',
    'Sustainable Landscaping',
    'Native Plants Specialist',
    'Contractor/Installer'
];

const states = [
    'California', 'Texas', 'Florida', 'New York', 'Arizona', 'Colorado',
    'Washington', 'Oregon', 'Nevada', 'Georgia', 'North Carolina', 'Virginia',
    'Massachusetts', 'Illinois', 'Pennsylvania', 'Ohio', 'Michigan', 'New Jersey'
];

export const DesignerOnboarding: React.FC<DesignerOnboardingProps> = ({ isOpen, onClose, onComplete }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<Partial<DesignerFormData>>({
        specialties: [],
        portfolioImages: [],
        role: 'designer'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const updateField = (field: keyof DesignerFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleSpecialty = (specialty: string) => {
        const current = formData.specialties || [];
        if (current.includes(specialty)) {
            updateField('specialties', current.filter(s => s !== specialty));
        } else {
            updateField('specialties', [...current, specialty]);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            onComplete(formData as DesignerFormData);
        } catch (error) {
            console.error('Error submitting designer profile:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const canProceed = () => {
        switch (step) {
            case 1:
                return formData.fullName && formData.email && formData.password;
            case 2:
                return formData.businessName && formData.city && formData.state;
            case 3:
                return (formData.specialties?.length || 0) > 0 && formData.yearsExperience;
            case 4:
                return formData.bio && formData.bio.length >= 50;
            default:
                return true;
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-amber-100 text-sm font-medium mb-1">Designer Registration</p>
                            <h2 className="text-2xl font-bold">Join AutoScape Pro</h2>
                        </div>
                        <button onClick={onClose} className="text-white/80 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex gap-2 mt-6">
                        {[1, 2, 3, 4].map(s => (
                            <div
                                key={s}
                                className={`flex-1 h-1.5 rounded-full transition-colors ${s <= step ? 'bg-white' : 'bg-white/30'
                                    }`}
                            />
                        ))}
                    </div>
                    <div className="flex justify-between text-xs text-amber-100 mt-2">
                        <span>Account</span>
                        <span>Business</span>
                        <span>Expertise</span>
                        <span>Profile</span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[50vh]">
                    {/* Step 1: Account Info */}
                    {step === 1 && (
                        <div className="space-y-4 animate-fade-in">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Your Account</h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    value={formData.fullName || ''}
                                    onChange={e => updateField('fullName', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    placeholder="John Smith"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                <input
                                    type="email"
                                    value={formData.email || ''}
                                    onChange={e => updateField('email', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    placeholder="john@landscapedesign.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                                <input
                                    type="password"
                                    value={formData.password || ''}
                                    onChange={e => updateField('password', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    placeholder="Create a secure password"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    value={formData.phone || ''}
                                    onChange={e => updateField('phone', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    placeholder="(555) 123-4567"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Business Info */}
                    {step === 2 && (
                        <div className="space-y-4 animate-fade-in">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={formData.businessName || ''}
                                        onChange={e => updateField('businessName', e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                        placeholder="Green Gardens Design Co."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                                    <input
                                        type="text"
                                        value={formData.city || ''}
                                        onChange={e => updateField('city', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                        placeholder="Los Angeles"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                                    <select
                                        value={formData.state || ''}
                                        onChange={e => updateField('state', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    >
                                        <option value="">Select state</option>
                                        {states.map(state => (
                                            <option key={state} value={state}>{state}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Website (Optional)</label>
                                <input
                                    type="url"
                                    value={formData.website || ''}
                                    onChange={e => updateField('website', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    placeholder="https://yourwebsite.com"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 3: Expertise */}
                    {step === 3 && (
                        <div className="space-y-4 animate-fade-in">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Expertise</h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">Specialties * (Select all that apply)</label>
                                <div className="flex flex-wrap gap-2">
                                    {specialtyOptions.map(specialty => (
                                        <button
                                            key={specialty}
                                            onClick={() => toggleSpecialty(specialty)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${formData.specialties?.includes(specialty)
                                                    ? 'bg-amber-500 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {specialty}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience *</label>
                                <select
                                    value={formData.yearsExperience || ''}
                                    onChange={e => updateField('yearsExperience', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                >
                                    <option value="">Select experience</option>
                                    <option value="0-2">0-2 years</option>
                                    <option value="3-5">3-5 years</option>
                                    <option value="6-10">6-10 years</option>
                                    <option value="10+">10+ years</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Profile */}
                    {step === 4 && (
                        <div className="space-y-4 animate-fade-in">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete Your Profile</h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Bio / Introduction * <span className="text-gray-400 font-normal">(min. 50 characters)</span>
                                </label>
                                <textarea
                                    value={formData.bio || ''}
                                    onChange={e => updateField('bio', e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
                                    placeholder="Tell potential clients about yourself, your design philosophy, and what makes your work unique..."
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {(formData.bio?.length || 0)}/50 characters
                                </p>
                            </div>

                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-green-900">You're almost done!</p>
                                        <p className="text-xs text-green-700 mt-1">
                                            After signup, you can add portfolio images and designs to showcase your work.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 border-t flex justify-between">
                    {step > 1 ? (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium"
                        >
                            Back
                        </button>
                    ) : (
                        <div />
                    )}

                    {step < 4 ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            disabled={!canProceed()}
                            className={`px-8 py-3 rounded-lg font-semibold transition-all ${canProceed()
                                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            Continue
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={!canProceed() || isSubmitting}
                            className={`px-8 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${canProceed() && !isSubmitting
                                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                'Create Designer Account'
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
