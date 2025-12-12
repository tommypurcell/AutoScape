import React, { useState, useEffect } from 'react';
import { X, Upload, MapPin, Briefcase, Star, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface DesignerOnboardingProps {
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
    agreedToTerms: boolean;
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

export const DesignerOnboarding: React.FC<DesignerOnboardingProps> = ({ onComplete }) => {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<Partial<DesignerFormData>>({
        specialties: [],
        portfolioImages: [],
        role: 'designer',
        agreedToTerms: false
    });

    // Auto-fill for logged in users
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                email: user.email || '',
                fullName: user.displayName || prev.fullName || ''
            }));
        }
    }, [user]);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            case 1:
                return formData.fullName && formData.email && (user ? true : formData.password);
            case 2:
                return formData.businessName && formData.city && formData.state;
            case 3:
                return (formData.specialties?.length || 0) > 0 && formData.yearsExperience;
            case 4:
                return formData.bio && formData.bio.length >= 50 && formData.agreedToTerms;
            default:
                return true;
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
            <div className="bg-white rounded-2xl w-full shadow-xl border border-gray-100 overflow-hidden">
                {/* Header - Serious Business */}
                <div className="bg-slate-900 text-white p-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-400 text-sm font-medium mb-1 uppercase tracking-widest">Partner Application</p>
                            <h2 className="text-3xl font-light">Join <span className="font-semibold">AutoScape Pro</span></h2>
                        </div>
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
                    <div className="flex justify-between text-xs text-slate-400 mt-2">
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
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                {user ? 'Confirm Your Details' : 'Create Your Account'}
                            </h3>

                            {user && (
                                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 mb-4 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-emerald-900">You are logged in</p>
                                        <p className="text-xs text-emerald-700">We've pre-filled your information below.</p>
                                    </div>
                                </div>
                            )}

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
                                    // Disable email editing if logged in to prevent mismatch
                                    disabled={!!user}
                                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${user ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                                    placeholder="john@landscapedesign.com"
                                />
                                {user && <p className="text-xs text-gray-400 mt-1">Signed in as {user.email}</p>}
                            </div>

                            {!user && (
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
                            )}

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
                                                ? 'bg-indigo-600 text-white shadow-md'
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

                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <label className="flex items-start gap-4 cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.agreedToTerms || false}
                                            onChange={e => updateField('agreedToTerms', e.target.checked)}
                                            className="w-6 h-6 border-2 border-gray-300 rounded text-slate-900 focus:ring-slate-900 transition-colors cursor-pointer"
                                        />
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        <span className="font-medium text-gray-900">Contract Agreement</span>
                                        <p className="mt-1">
                                            I agree to the <a href="/terms" target="_blank" className="text-indigo-600 hover:text-indigo-800 underline font-medium">Designer Partnership Agreement</a> and <a href="/terms" target="_blank" className="text-indigo-600 hover:text-indigo-800 underline font-medium">Terms of Service</a>.
                                            I verify that all provided information is accurate and I am authorized to represent this business.
                                        </p>
                                    </div>
                                </label>
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
                                ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-lg'
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
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg'
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
