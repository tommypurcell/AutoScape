import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStyleImage } from '../data/styleReferences';
import { DesignStyle } from '../types';
import { ChevronDown, ArrowRight, Sun, Droplets, Wind } from 'lucide-react';

interface LandingPageProps {
    onGetStarted: () => void;
    onAbout: () => void;
    onStartTutorial?: () => void;
    onDesignerSignup?: () => void;
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

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onAbout, onStartTutorial, onDesignerSignup }) => {
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

            {/* Hero Section - AI Scanning Effect */}
            <div className="relative h-screen w-full overflow-hidden bg-slate-900">
                {/* Background Animation */}
                <div className="absolute inset-0">
                    {/* "Before" Image (Base) */}
                    <div className="absolute inset-0">
                        <img
                            src="/demo_clips/autoscape_hero_original.png"
                            onError={(e) => e.currentTarget.src = getStyleImage(DesignStyle.MODERN)}
                            className="w-full h-full object-cover grayscale-[30%]"
                            alt="Original Yard"
                        />
                        <div className="absolute inset-0 bg-black/40" />
                    </div>

                    {/* "After" Image (Revealed) */}
                    <div
                        className="absolute inset-0 animate-scan-once border-r-4 border-emerald-400 overflow-hidden shadow-[0_0_20px_rgba(52,211,153,0.5)] z-0"
                        style={{ animationIterationCount: '1' }}
                    >
                        <img
                            src="/demo_clips/autoscape_hero_gen.png"
                            onError={(e) => e.currentTarget.src = getStyleImage(DesignStyle.TROPICAL)}
                            className="absolute inset-0 w-screen max-w-none h-full object-cover"
                            alt="Designed Yard"
                        />
                        <div className="absolute inset-0 bg-emerald-500/10 mix-blend-overlay" />
                    </div>
                </div>

                {/* Content Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 mb-8 animate-fade-in-up">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="text-emerald-400 text-sm font-medium tracking-wide uppercase">AI-Powered Design Engine</span>
                    </div>

                    <h1 className="text-white text-5xl md:text-7xl lg:text-8xl font-light tracking-tight mb-8 drop-shadow-2xl">
                        Reimagine Your <br />
                        <span className="font-semibold bg-gradient-to-r from-white via-emerald-200 to-emerald-400 bg-clip-text text-transparent">
                            Outdoor World
                        </span>
                    </h1>

                    <p className="text-white/90 text-lg md:text-xl font-light tracking-wide max-w-2xl leading-relaxed drop-shadow-lg mb-12">
                        Upload a photo and watch as advanced AI transforms your yard into a sustainable,
                        breathtaking landscape in seconds.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={onGetStarted}
                            className="px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-black text-sm uppercase tracking-widest font-bold transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_rgba(16,185,129,0.4)] rounded-sm"
                        >
                            Design My Yard
                        </button>
                        <button
                            onClick={onDesignerSignup}
                            className="px-10 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/30 text-sm uppercase tracking-widest font-semibold transition-all duration-300 rounded-sm"
                        >
                            Are you a professional?
                        </button>
                    </div>
                </div>

                <div
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 cursor-pointer animate-bounce text-white/80 hover:text-white transition-colors"
                    onClick={scrollToContent}
                >
                    <ChevronDown size={32} strokeWidth={1} />
                </div>
            </div>

            {/* Before/After Examples Section */}
            <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <span className="inline-block px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
                            Real Transformations
                        </span>
                        <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
                            See What's <span className="font-semibold">Possible</span>
                        </h2>
                        <p className="text-gray-600 max-w-xl mx-auto">
                            AI-powered landscape design that transforms ordinary yards into extraordinary outdoor spaces
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Example 1 */}
                        <div className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow">
                            <img
                                src="/examples/example_1.png"
                                alt="Before and after landscape transformation"
                                className="w-full aspect-video object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                                <div className="text-white">
                                    <p className="font-semibold text-lg">Backyard Makeover</p>
                                    <p className="text-white/80 text-sm">From bare lawn to blooming paradise</p>
                                </div>
                            </div>
                        </div>

                        {/* Example 2 */}
                        <div className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow">
                            <img
                                src="/examples/example_2.jpg"
                                alt="Before and after garden transformation"
                                className="w-full aspect-video object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                                <div className="text-white">
                                    <p className="font-semibold text-lg">Garden Retreat</p>
                                    <p className="text-white/80 text-sm">Creating a serene fountain garden</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-center mt-10">
                        <button
                            onClick={onGetStarted}
                            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                        >
                            Create Your Transformation
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </section>

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
                            src="https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80"
                            alt="Formal Garden Design"
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
                            src="/demo_clips/autoscape_hero_gen.png"
                            alt="Landscape Design Plan"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/10"></div>
                    </div>
                </div>
            </section>

            {/* Slide Demo Section */}
            <DemoSection />

            {/* Designer Section - "Are you a Designer?" */}
            {/* Designer Section - "Are you a Designer?" - Bright & Professional */}
            <section className="py-24 relative overflow-hidden bg-gradient-to-br from-white via-blue-50 to-indigo-50">
                {/* Background Decorative Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-amber-100/50 to-transparent rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-emerald-100/50 to-transparent rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
                </div>

                <div className="max-w-6xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-2 bg-indigo-100 text-indigo-600 rounded-full text-sm font-bold uppercase tracking-wider mb-6">
                            For Professionals
                        </span>
                        <h2 className="text-4xl md:text-5xl font-light text-slate-900 mb-6">
                            Are You a <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Designer</span>?
                        </h2>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto font-light leading-relaxed">
                            Join AutoScape as a professional and transform how you work with clients using AI-powered tools.
                        </p>
                    </div>

                    {/* Benefits Grid */}
                    <div className="grid md:grid-cols-3 gap-8 mb-16">
                        {/* Card 1 */}
                        <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-slate-100 group">
                            <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">AI-Powered Insights</h3>
                            <p className="text-slate-500 leading-relaxed text-sm">
                                Get instant design analysis, material estimates, and plant recommendations to speed up your workflow.
                            </p>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-slate-100 group">
                            <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Find New Clients</h3>
                            <p className="text-slate-500 leading-relaxed text-sm">
                                Showcase your portfolio to homeowners actively looking for professional landscape designers.
                            </p>
                        </div>

                        {/* Card 3 */}
                        <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-slate-100 group">
                            <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Match Expectations</h3>
                            <p className="text-slate-500 leading-relaxed text-sm">
                                Create vivid visualizations that match client expectations before breaking ground.
                            </p>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="text-center">
                        <button
                            onClick={onDesignerSignup}
                            className="px-10 py-5 bg-slate-900 text-white font-bold uppercase tracking-widest rounded-lg transition-all transform hover:scale-105 shadow-xl hover:bg-slate-800"
                        >
                            Join as a Designer
                        </button>
                        <p className="mt-6 text-slate-500 text-xs uppercase tracking-widest">
                            Free to join • Build your portfolio • Connect with clients
                        </p>
                    </div>
                </div>
            </section>

            {/* Text-Heavy Editorial "Note" */}
            <section className="py-32 relative bg-emerald-950 overflow-hidden text-white">
                <div className="absolute inset-0 opacity-20 mix-blend-soft-light">
                    <img src={getStyleImage(DesignStyle.COTTAGE)} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-900/80 to-slate-900/90" />

                <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
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
                        <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
                        <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                    </div>
                    <div className="text-xs text-gray-600 font-mono">
                        © 2025 AutoScape Inc.
                    </div>
                </div>
            </footer>
        </div>
    );
};