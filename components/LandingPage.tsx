import React, { useState, useEffect } from 'react';
import { styleReferences } from '../data/styleReferences';

interface LandingPageProps {
    onGetStarted: () => void;
    onAbout: () => void;
    onStartTutorial?: () => void;
}

const DemoSection: React.FC = () => {
    const slides = [
        {
            image: '/demo_clips/scene_1_problem.jpg',
            title: 'The Problem',
            description: 'Hard to visualize potential in an empty yard.'
        },
        {
            image: '/demo_clips/scene_3_analysis.jpg',
            title: 'AI Analysis',
            description: 'Gemini 2.0 scans your environment for structure and lighting.'
        },
        {
            image: '/demo_clips/scene_2_solution.jpg',
            title: 'The Solution',
            description: 'Instant, photorealistic redesigns matching your style.'
        },
        {
            image: '/demo_clips/scene_5_budget.jpg',
            title: 'Real Budgeting',
            description: 'RAG-powered cost estimates with real-world items.'
        }
    ];

    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 4000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div id="demo-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">See AutoScape in Action</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Watch how we transform a simple photo into a complete landscape plan
                </p>
            </div>

            <div className="relative w-full max-w-5xl mx-auto aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
                {slides.map((slide, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'
                            }`}
                    >
                        <img
                            src={slide.image}
                            alt={slide.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent">
                            <div className="absolute bottom-0 left-0 p-8 md:p-12">
                                <h3 className="text-3xl md:text-4xl font-bold text-white mb-2">{slide.title}</h3>
                                <p className="text-xl text-gray-300">{slide.description}</p>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Progress Indicators */}
                <div className="absolute bottom-8 right-8 flex gap-2">
                    {slides.map((_, index) => (
                        <div
                            key={index}
                            className={`h-1 rounded-full transition-all duration-300 ${index === currentSlide ? 'w-8 bg-green-600' : 'w-2 bg-white/30'
                                }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onAbout, onStartTutorial }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Cycle through background images
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % Math.min(12, styleReferences.length));
        }, 4000); // Change every 4 seconds

        return () => clearInterval(interval);
    }, []);

    const scrollToDemo = () => {
        const element = document.getElementById('demo-section');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">

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
                            <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
                                🌿 AI-Powered Landscape Design
                            </span>
                        </div>

                        <h1 className="text-6xl md:text-7xl font-extrabold text-gray-900 mb-6 tracking-tight">
                            Transform Your
                            <span className="block bg-gradient-to-r from-green-700 to-blue-600 bg-clip-text text-transparent">
                                Outdoor Space
                            </span>
                        </h1>

                        <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                            Upload a photo of your yard and let our AI create stunning landscape designs
                            with instant 3D renders, architectural plans, and real-world budget estimates.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <button
                                onClick={onGetStarted}
                                className="px-8 py-4 bg-green-700 hover:bg-green-600 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-green-200 hover:shadow-green-300 transition-all transform hover:-translate-y-1 flex items-center gap-2"
                            >
                                Get Started Free
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </button>
                            <button
                                onClick={scrollToDemo}
                                className="px-8 py-4 bg-white hover:bg-gray-50 text-green-700 border-2 border-green-700 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                How It Works
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Demo Section */}
            <DemoSection />

            {/* Features Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                        Everything You Need to Plan Your Dream Yard
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Professional-grade landscape design powered by cutting-edge AI technology
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Feature 1 */}
                    <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-gray-100">
                        <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-green-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Photorealistic Renders</h3>
                        <p className="text-gray-600 leading-relaxed">
                            See your redesigned yard in stunning 3D. Our AI preserves your home's architecture while transforming your landscape.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-gray-100">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Detailed 2D Plans</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Get contractor-ready architectural plans with precise measurements and labeled elements for easy implementation.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-gray-100">
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">RAG-Powered Budgets</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Real-world cost estimates matched to actual products from our Freepik database using advanced RAG technology.
                        </p>
                    </div>
                </div>
            </div>

            {/* How It Works */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-white mb-4">
                            Design Your Dream Yard in 3 Simple Steps
                        </h2>
                        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                            From upload to finished design in under a minute
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-6 shadow-2xl">
                                1
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Upload Your Yard</h3>
                            <p className="text-gray-400">
                                Take a photo of your current outdoor space or upload an existing image
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-6 shadow-2xl">
                                2
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Choose Your Style</h3>
                            <p className="text-gray-400">
                                Select from our gallery or upload inspiration images to match your vision
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-6 shadow-2xl">
                                3
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Get Your Design</h3>
                            <p className="text-gray-400">
                                Receive photorealistic renders, 2D plans, and itemized budget estimates instantly
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Style Gallery Showcase */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-white">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                        Choose Your Perfect Style
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
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
                        className="px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold text-lg transition-all"
                    >
                        Explore All Styles →
                    </button>
                </div>
            </div>

            {/* CTA Section */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                <h2 className="text-5xl font-bold text-gray-900 mb-6">
                    Ready to Transform Your Yard?
                </h2>
                <p className="text-xl text-gray-600 mb-12">
                    Join thousands of homeowners who've reimagined their outdoor spaces with AutoScape
                </p>
                <button
                    onClick={onGetStarted}
                    className="px-12 py-5 bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white rounded-2xl font-bold text-xl shadow-2xl shadow-green-300 transition-all transform hover:-translate-y-1"
                >
                    Start Designing Now — It's Free!
                </button>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-3 gap-8 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                                    A
                                </div>
                                <span className="text-xl font-bold">AutoScape</span>
                            </div>
                            <p className="text-gray-400 text-sm">
                                AI-powered landscape design with instant 3D renders and real-world budgeting.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-bold mb-4">Quick Links</h3>
                            <ul className="space-y-2 text-gray-400 text-sm">
                                <li>
                                    <button onClick={onAbout} className="hover:text-white transition-colors">
                                        About Us
                                    </button>
                                </li>
                                <li>
                                    <button onClick={onGetStarted} className="hover:text-white transition-colors">
                                        Get Started
                                    </button>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-bold mb-4">Powered By</h3>
                            <ul className="space-y-2 text-gray-400 text-sm">
                                <li>Google Gemini 2.0</li>
                                <li>Qdrant Vector DB</li>
                                <li>Freepik API</li>
                                <li>Firebase</li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
                        <p>© 2024 AutoScape. Built for Freepik Hackathon. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};
