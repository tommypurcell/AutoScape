import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStyleImage } from '../data/styleReferences';
import { DesignStyle } from '../types';
import { ChevronDown, ArrowRight, Sun, Droplets, Wind } from 'lucide-react';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { getDesignById, SavedDesign } from '../services/firestoreService';

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
    const [featuredDesign, setFeaturedDesign] = useState<SavedDesign | null>(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Fetch featured design for gallery
    useEffect(() => {
        const fetchFeaturedDesign = async () => {
            try {
                const design = await getDesignById('l33e1w');
                if (design) {
                    setFeaturedDesign(design);
                }
            } catch (error) {
                console.error('Error fetching featured design:', error);
            }
        };
        fetchFeaturedDesign();
    }, []);

    // Scroll animation observer
    useEffect(() => {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        const animatedElements = document.querySelectorAll('.scroll-animate, .scroll-animate-left, .scroll-animate-right, .scroll-animate-rotate, .scroll-animate-rotate-reverse');
        animatedElements.forEach(el => observer.observe(el));

        return () => observer.disconnect();
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
                            src="/images/hero-before.png"
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
                            src="/images/hero-after.jpg"
                            onError={(e) => e.currentTarget.src = getStyleImage(DesignStyle.TROPICAL)}
                            className="absolute inset-0 w-screen max-w-none h-full object-cover"
                            alt="Designed Yard"
                        />
                        <div className="absolute inset-0 bg-emerald-500/10 mix-blend-overlay" />
                    </div>
                </div>

                {/* Content Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-10 bg-gradient-to-t from-black/60 via-black/20 to-black/40">
                    <div className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 mb-10 animate-fade-in-up hover:bg-black/70 transition-colors cursor-default select-none shadow-lg">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                        <span className="text-emerald-300 text-sm font-semibold tracking-[0.2em] uppercase">AI Design Engine</span>
                    </div>

                    <h1 className="text-white text-5xl md:text-7xl lg:text-8xl font-light tracking-tight mb-8 drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
                        Reimagine Your <br />
                        <span className="font-semibold text-white mt-1 block drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
                            Outdoor World
                        </span>
                    </h1>

                    <p className="text-white/90 text-lg md:text-xl font-light tracking-wide max-w-2xl leading-relaxed drop-shadow-md mb-12">
                        Upload a photo and watch as advanced AI transforms your yard into a sustainable,
                        breathtaking landscape in seconds.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-5">
                        <button
                            onClick={onGetStarted}
                            className="group relative px-9 py-4 bg-emerald-600 hover:bg-emerald-500 text-white text-sm uppercase tracking-[0.15em] font-semibold transition-all duration-300 shadow-[0_10px_30px_rgba(5,150,105,0.3)] hover:shadow-[0_20px_40px_rgba(5,150,105,0.4)] hover:-translate-y-1 rounded-full overflow-hidden border border-emerald-500/50"
                        >
                            <span className="relative z-10">Design My Yard</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </button>
                        <button
                            onClick={onDesignerSignup}
                            className="px-9 py-4 bg-white/5 hover:bg-white/10 backdrop-blur-md text-white border border-white/20 hover:border-white/40 text-sm uppercase tracking-[0.15em] font-medium transition-all duration-300 hover:-translate-y-1 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.1)]"
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







            {/* Video Generation Showcase */}
            {/* Real Transformations Gallery */}
            <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
                <div className="max-w-7xl mx-auto px-6">
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
                        {/* Gallery Item 1 */}
                        <div className="group">
                            <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow">
                                <BeforeAfterSlider
                                    beforeImage="/demo_clips/autoscape_hero_original.png"
                                    afterImage="/demo_clips/autoscape_hero_gen.png"
                                    beforeLabel="Before"
                                    afterLabel="After"
                                />
                            </div>
                            <div className="mt-4 text-center">
                                <h3 className="text-lg font-semibold text-gray-900">Park Makeover</h3>
                                <p className="text-sm text-gray-600">From bare lawn to blooming paradise</p>
                            </div>
                        </div>

                        {/* Gallery Item 2 */}
                        <div className="group">
                            <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow">
                                {featuredDesign ? (
                                    <BeforeAfterSlider
                                        beforeImage='/demo_clips/before-pad.JPG'
                                        afterImage='/demo_clips/after-pad.png'
                                        beforeLabel="Before"
                                        afterLabel="After"
                                    />
                                ) : (
                                    <BeforeAfterSlider
                                        beforeImage='/demo_clips/before-pad.JPG'
                                        afterImage='/demo_clips/after-pad.png'
                                        beforeLabel="Before"
                                        afterLabel="After"
                                    />
                                )}
                            </div>
                            <div className="mt-4 text-center">
                                <h3 className="text-lg font-semibold text-gray-900">Garden Retreat</h3>
                                <p className="text-sm text-gray-600">Creating a serene fountain garden</p>
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

            {/* Cost Estimation Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-12 scroll-animate">
                        <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
                            Know Your <span className="font-semibold">Investment</span>
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Get detailed cost breakdowns and material estimates instantly with AI-powered analysis
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        {/* Pie Chart Image */}
                        <div className="order-2 md:order-1 scroll-animate-rotate">
                            <img
                                src="/demo_clips/pie-chart.png"
                                alt="Cost breakdown pie chart"
                                className="w-full rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300"
                            />
                            <p className="text-center text-sm text-gray-500 mt-4">
                                Visual cost breakdown by category
                            </p>
                        </div>

                        {/* Estimate Details Image */}
                        <div className="order-1 md:order-2 scroll-animate-rotate-reverse">
                            <img
                                src="/demo_clips/estimate.png"
                                alt="Detailed material estimates"
                                className="w-full rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300"
                            />
                            <p className="text-center text-sm text-gray-500 mt-4">
                                Itemized material list with quantities and pricing
                            </p>
                        </div>
                    </div>

                    <div className="mt-12 text-center scroll-animate">
                        <div className="inline-flex flex-col md:flex-row gap-4 items-center justify-center">
                            <div className="flex items-center gap-2 text-gray-700 scroll-animate stagger-1">
                                <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm font-medium">Instant cost analysis</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700 scroll-animate stagger-2">
                                <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm font-medium">Export to Excel or Sheets</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700 scroll-animate stagger-3">
                                <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm font-medium">RAG-verified plant pricing</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-24 md:py-32 bg-gradient-to-b from-slate-900 to-black text-white relative overflow-hidden">
                {/* Subtle background pattern */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }} />
                </div>

                <div className="max-w-6xl mx-auto px-6 relative z-10">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-bold uppercase tracking-wider mb-6 border border-emerald-500/30">
                            Powered by AI
                        </span>
                        <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
                            Cinematic <span className="font-semibold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Video Generation</span>
                        </h2>
                        <p className="text-xl text-gray-300 max-w-2xl mx-auto font-light leading-relaxed">
                            Watch your transformation come to life with AI-generated videos that smoothly morph your yard from before to after.
                        </p>
                    </div>

                    {/* Video Container */}
                    <div className="relative max-w-4xl mx-auto">
                        {/* Glow effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl blur-2xl opacity-20" />

                        {/* Video */}
                        <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
                            <video
                                src="https://firebasestorage.googleapis.com/v0/b/autoscape-dfc00.firebasestorage.app/o/designs%2FOMZtAXa0X1YByXLuzce6rKYP4rC2%2Fvideos%2FxTBZ0Wpd2hHzGzxu9TJs_gemini_1765711470264.mp4?alt=media&token=0806160b-f71f-4233-a983-03e7d88d6e10"
                                controls
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full aspect-video"
                            />
                        </div>

                        {/* Feature highlights below video */}
                        <div className="grid md:grid-cols-3 gap-6 mt-12">
                            <div className="text-center p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Smooth Transitions</h3>
                                <p className="text-gray-400 text-sm">AI-powered morphing creates seamless before-to-after transformations</p>
                            </div>

                            <div className="text-center p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Instant Generation</h3>
                                <p className="text-gray-400 text-sm">Create shareable videos in seconds, perfect for social media</p>
                            </div>

                            <div className="text-center p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Cinematic Quality</h3>
                                <p className="text-gray-400 text-sm">Professional-grade output that showcases your design vision</p>
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="text-center mt-16">
                        <button
                            onClick={onGetStarted}
                            className="px-10 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-bold uppercase tracking-widest rounded-lg transition-all transform hover:scale-105 shadow-lg"
                        >
                            Generate Your Video
                        </button>
                        <p className="mt-4 text-gray-400 text-sm">
                            Available with every design • No extra cost
                        </p>
                    </div>
                </div>
            </section>




            {/* Our Philosophy */}

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
                            src={getStyleImage(DesignStyle.JAPANESE)}
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
                            src={getStyleImage(DesignStyle.MODERN)}
                            alt="Detailed Plan"
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
            <section className="py-24 relative overflow-hidden bg-white">
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
                            <p className="text-slate-600 leading-relaxed text-sm">
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
                            <p className="text-slate-600 leading-relaxed text-sm">
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
                            <p className="text-slate-600 leading-relaxed text-sm">
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
                        <p className="mt-6 text-slate-600 text-sm uppercase tracking-widest">
                            Free to join • Build your portfolio • Connect with clients
                        </p>
                    </div>
                </div>
            </section>

            {/* Text-Heavy Editorial "Note" */}
            <section className="py-32 relative bg-black overflow-hidden text-white">
                <div className="absolute inset-0">
                    <img src={getStyleImage(DesignStyle.COTTAGE)} className="w-full h-full object-cover opacity-90" alt="Beautiful Landscape" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/70" />

                <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
                    <Wind className="mx-auto mb-8 text-white/80" size={32} />
                    <h2 className="text-3xl md:text-5xl font-serif italic mb-12 drop-shadow-lg">
                        "The goal of life is living in agreement with nature."
                    </h2>
                    <p className="text-white/90 font-light text-lg mb-16 leading-relaxed drop-shadow-md">
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
                    <p className="mt-6 text-sm text-white/60 uppercase tracking-widest">
                        Free for Early Access Users
                    </p>
                </div>
            </section>


        </div>
    );
};
