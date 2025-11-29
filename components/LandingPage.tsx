import React, { useState, useEffect } from 'react';
import { styleReferences } from '../data/styleReferences';

interface LandingPageProps {
    onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Cycle through background images
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % Math.min(12, styleReferences.length));
        }, 4000); // Change every 4 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
            {/* Hero Section with Animated Background */}
            <div className="relative overflow-hidden">
                {/* Animated Background Images */}
                <div className="absolute inset-0 h-[700px]">
                    {styleReferences.slice(0, 12).map((style, index) => (
                        <div
                            key={style.id}
                            className={`absolute inset-0 transition-opacity duration-1000 ${index === currentImageIndex ? 'opacity-30' : 'opacity-0'
                                }`}
                        >
                            <img
                                src={style.imageUrl}
                                alt=""
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/60 to-white"></div>
                        </div>
                    ))}
                </div>

                {/* Hero Content */}
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
                    <div className="text-center animate-fade-in">
                        <div className="inline-block mb-4">
                            <span className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold">
                                🌿 AI-Powered Landscape Design
                            </span>
                        </div>

                        <h1 className="text-6xl md:text-7xl font-extrabold text-slate-900 mb-6 tracking-tight">
                            Transform Your
                            <span className="block bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                                Outdoor Space
                            </span>
                        </h1>

                        <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                            Upload a photo of your yard and let our AI create stunning landscape designs
                            with instant 3D renders, architectural plans, and real-world budget estimates.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <button
                                onClick={onGetStarted}
                                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-emerald-200 hover:shadow-emerald-300 transition-all transform hover:-translate-y-1 flex items-center gap-2"
                            >
                                Get Started Free
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </button>

                            <button className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl font-semibold text-lg shadow-lg border-2 border-slate-200 transition-all flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Watch Demo
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-slate-900 mb-4">
                        Everything You Need to Plan Your Dream Yard
                    </h2>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Professional-grade landscape design powered by cutting-edge AI technology
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Feature 1 */}
                    <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-slate-100">
                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-3">Photorealistic Renders</h3>
                        <p className="text-slate-600 leading-relaxed">
                            See your redesigned yard in stunning 3D. Our AI preserves your home's architecture while transforming your landscape.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-slate-100">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-3">Detailed 2D Plans</h3>
                        <p className="text-slate-600 leading-relaxed">
                            Get contractor-ready architectural plans with precise measurements and labeled elements for easy implementation.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-slate-100">
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-3">RAG-Powered Budgets</h3>
                        <p className="text-slate-600 leading-relaxed">
                            Real-world cost estimates matched to actual products from our Freepik database using advanced RAG technology.
                        </p>
                    </div>
                </div>
            </div>

            {/* How It Works */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-white mb-4">
                            Design Your Dream Yard in 3 Simple Steps
                        </h2>
                        <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                            From upload to finished design in under a minute
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-6 shadow-2xl">
                                1
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Upload Your Yard</h3>
                            <p className="text-slate-400">
                                Take a photo of your current outdoor space or upload an existing image
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-6 shadow-2xl">
                                2
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Choose Your Style</h3>
                            <p className="text-slate-400">
                                Select from our gallery or upload inspiration images to match your vision
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-6 shadow-2xl">
                                3
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Get Your Design</h3>
                            <p className="text-slate-400">
                                Receive photorealistic renders, 2D plans, and itemized budget estimates instantly
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Style Gallery Showcase */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-white">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-slate-900 mb-4">
                        Choose Your Perfect Style
                    </h2>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Browse our curated collection of landscape design styles. From modern minimalism to lush tropical gardens.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {styleReferences.map((style) => (
                        <div
                            key={style.id}
                            className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 cursor-pointer"
                        >
                            <img
                                src={style.imageUrl}
                                alt={style.name}
                                className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                                <div className="p-4 w-full">
                                    <h3 className="text-white font-bold text-lg mb-1">{style.name}</h3>
                                    <p className="text-white/80 text-sm">{style.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-12">
                    <button
                        onClick={onGetStarted}
                        className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-lg transition-all"
                    >
                        Explore All Styles →
                    </button>
                </div>
            </div>

            {/* CTA Section */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                <h2 className="text-5xl font-bold text-slate-900 mb-6">
                    Ready to Transform Your Yard?
                </h2>
                <p className="text-xl text-slate-600 mb-12">
                    Join thousands of homeowners who've reimagined their outdoor spaces with AutoScape
                </p>
                <button
                    onClick={onGetStarted}
                    className="px-12 py-5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-2xl font-bold text-xl shadow-2xl shadow-emerald-300 transition-all transform hover:-translate-y-1"
                >
                    Start Designing Now — It's Free!
                </button>
            </div>
        </div>
    );
};
