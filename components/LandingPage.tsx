import React, { useState, useEffect } from 'react';
import { styleReferences } from '../data/styleReferences';
import { ChevronDown, ArrowRight, Sun, Droplets, Wind } from 'lucide-react';

interface LandingPageProps {
    onGetStarted: () => void;
    onAbout: () => void;
    onStartTutorial?: () => void;
}

const DemoSection: React.FC = () => {
    const slides = [
        {
            image: '/demo_clips/scene_1_problem.jpg',
            title: 'The Challenge',
            description: 'Unlocking the hidden potential of your outdoor sanctuary.'
        },
        {
            image: '/demo_clips/scene_3_analysis.jpg',
            title: 'The Insight',
            description: 'Intelligent analysis of terrain, lighting, and architectural context.'
        },
        {
            image: '/demo_clips/scene_2_solution.jpg',
            title: 'The Vision',
            description: 'Photorealistic reimagining of space, tailored to your aesthetic.'
        },
        {
            image: '/demo_clips/scene_5_budget.jpg',
            title: 'The Reality',
            description: 'Grounded estimates connecting dreams with tangible resources.'
        }
    ];

    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div id="demo-section" className="w-full bg-white py-24 md:py-32 border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="order-2 lg:order-1">
                    <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                        {slides.map((slide, index) => (
                            <div
                                key={index}
                                className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                                    }`}
                            >
                                <img
                                    src={slide.image}
                                    alt={slide.title}
                                    className="w-full h-full object-cover filter brightness-[0.95]"
                                />
                            </div>
                        ))}
                    </div>
                    {/* Minimal Progress Bar */}
                    <div className="flex mt-6 gap-2">
                        {slides.map((_, index) => (
                            <div
                                key={index}
                                className={`h-0.5 transition-all duration-500 ${index === currentSlide ? 'w-12 bg-black' : 'w-4 bg-gray-300'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                <div className="order-1 lg:order-2 space-y-8">
                    <h2 className="text-4xl md:text-5xl font-light tracking-tight text-gray-900">
                        Visualizing the <br /> <span className="font-semibold">Unseen Potential</span>
                    </h2>
                    <div className="space-y-6">
                        {slides.map((slide, index) => (
                            <div
                                key={index}
                                className={`transition-all duration-500 border-l-2 pl-6 ${index === currentSlide ? 'border-black opacity-100' : 'border-gray-100 opacity-40'
                                    }`}
                            >
                                <h3 className="text-xl font-medium text-gray-900 mb-2">{slide.title}</h3>
                                <p className="text-gray-600 leading-relaxed font-light">{slide.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onAbout, onStartTutorial }) => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToContent = () => {
        window.scrollTo({
            top: window.innerHeight,
            behavior: 'smooth'
        });
    };

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-black selection:text-white">

            {/* Hero Section - Full Viewport */}
            <div className="relative h-screen w-full overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src="/concept.jpg"
                        onError={(e) => e.currentTarget.src = styleReferences[4].imageUrl}
                        className="w-full h-full object-cover object-center scale-105 animate-subtle-zoom"
                        alt="Landscape Concept"
                    />
                    <div className="absolute inset-0 bg-black/30 md:bg-black/20" />
                </div>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                    <h1 className="text-white text-5xl md:text-7xl lg:text-8xl font-light tracking-tight mb-6 drop-shadow-lg">
                        Living with <br /><span className="font-semibold">Nature</span>
                    </h1>
                    <p className="text-white/90 text-lg md:text-xl font-light tracking-wide max-w-2xl leading-relaxed drop-shadow-md">
                        AutoScape bridges the gap between architectural precision and organic beauty,
                        using AI to craft sustainable, enduring landscapes.
                    </p>

                    <button
                        onClick={onGetStarted}
                        className="mt-12 px-10 py-4 bg-white text-black text-sm uppercase tracking-widest font-semibold hover:bg-black hover:text-white transition-all duration-300 transform hover:-translate-y-1"
                    >
                        Start Your Project
                    </button>
                </div>

                <div
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 cursor-pointer animate-bounce text-white/80 hover:text-white transition-colors"
                    onClick={scrollToContent}
                >
                    <ChevronDown size={32} strokeWidth={1} />
                </div>
            </div>

            {/* Philosophy Section - Editorial Style */}
            <section className="py-24 md:py-32 max-w-5xl mx-auto px-6 md:px-12">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                    <div className="md:col-span-4">
                        <h2 className="text-3xl font-light uppercase tracking-widest text-gray-400 mb-4 sticky top-32">Our Philosophy</h2>
                    </div>
                    <div className="md:col-span-8 space-y-10">
                        <p className="text-2xl md:text-3xl leading-relaxed font-light text-gray-900 border-l-4 border-black pl-8">
                            "A landscape is not just a view; it is a living system. We believe in designs that honor the native ecology while elevating the human experience."
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
                            <div>
                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><Sun size={18} /> Contextual Design</h3>
                                <p className="text-gray-600 font-light leading-relaxed">
                                    Every site has a voice. Our AI analyzes local climate, soil conditions, and architectural vernacular to create designs that feel inevitable, not imposed.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><Droplets size={18} /> Sustainable Future</h3>
                                <p className="text-gray-600 font-light leading-relaxed">
                                    Water-wise planting and permeable hardscapes aren't optional—they are the foundation of modern luxury. We prioritize native species that thrive with minimal intervention.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Split Image/Text Section - "The Approach" */}
            <section className="w-full bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 min-h-[600px]">
                    <div className="relative h-full min-h-[400px]">
                        <img
                            src={styleReferences[2].imageUrl}
                            alt="Modern Japanese Garden"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex items-center justify-center p-12 md:p-24">
                        <div className="max-w-md">
                            <h2 className="text-3xl md:text-4xl font-light mb-6">Curated Aesthetics</h2>
                            <p className="text-gray-600 mb-8 font-light leading-relaxed">
                                From the structured calm of a rigorous modern grid to the wild, impressionistic waves of a meadow garden, style is personal. AutoScape translates your vague inspirations into concrete, buildable plans.
                            </p>
                            <button
                                onClick={onGetStarted}
                                className="group flex items-center gap-2 text-sm font-semibold uppercase tracking-widest border-b border-black pb-1 hover:text-gray-600 hover:border-gray-400 transition-colors"
                            >
                                Explore Styles <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 min-h-[600px]">
                    <div className="flex items-center justify-center p-12 md:p-24 order-2 md:order-1">
                        <div className="max-w-md">
                            <h2 className="text-3xl md:text-4xl font-light mb-6">Transparency & Control</h2>
                            <p className="text-gray-600 mb-8 font-light leading-relaxed">
                                Design is often opaque. We bring clarity with instant RAG-powered material lists and cost estimates. Know the price of your dream before you break ground.
                            </p>
                            <ul className="space-y-4 mb-4 font-light text-gray-700">
                                <li className="flex items-center gap-4">
                                    <span className="w-1.5 h-1.5 bg-black rounded-full" /> Real-time cost estimation
                                </li>
                                <li className="flex items-center gap-4">
                                    <span className="w-1.5 h-1.5 bg-black rounded-full" /> Detailed plant palettes
                                </li>
                                <li className="flex items-center gap-4">
                                    <span className="w-1.5 h-1.5 bg-black rounded-full" /> Architectural 2D plans
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="relative h-full min-h-[400px] order-1 md:order-2">
                        <img
                            src={styleReferences[6].imageUrl}
                            alt="Detailed Plan"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/10"></div>
                    </div>
                </div>
            </section>

            {/* Slide Demo Section */}
            <DemoSection />

            {/* Text-Heavy Editorial "Note" */}
            <section className="py-32 bg-gray-900 text-white">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <Wind className="mx-auto mb-8 text-gray-400" size={32} />
                    <h2 className="text-3xl md:text-5xl font-serif italic mb-12">
                        "The goal of life is living in agreement with nature."
                    </h2>
                    <p className="text-gray-400 font-light text-lg mb-16 leading-relaxed">
                        In a world of concrete and noise, your personal landscape is a refuge. <br />
                        It is where you reconnect, recharge, and remember what matters. <br />
                        Let us help you build that sanctuary.
                    </p>
                    <button
                        onClick={onGetStarted}
                        className="px-12 py-5 bg-white text-black text-sm uppercase tracking-widest font-bold hover:bg-gray-200 transition-colors transform hover:scale-105 duration-300"
                    >
                        Begin Your Journey
                    </button>
                    <p className="mt-6 text-xs text-gray-500 uppercase tracking-widest">
                        Free for Early Access Users
                    </p>
                </div>
            </section>

            {/* Minimal Footer */}
            <footer className="bg-black text-white py-12 border-t border-gray-900">
                <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                        <span className="text-xl font-bold tracking-tight">AutoScape</span>
                        <p className="text-xs text-gray-500 mt-2 font-light max-w-xs">
                            Architectural Artificial Intelligence for the Modern Era.
                        </p>
                    </div>
                    <div className="flex gap-8 text-sm font-light text-gray-400">
                        <button onClick={onAbout} className="hover:text-white transition-colors">Studio</button>
                        <button onClick={onGetStarted} className="hover:text-white transition-colors">Start Project</button>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                    </div>
                    <div className="text-xs text-gray-600 font-mono">
                        © 2025 AutoScape Inc.
                    </div>
                </div>
            </footer>
        </div>
    );
};
