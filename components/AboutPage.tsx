import React from 'react';
import { Linkedin, Github, Mail } from 'lucide-react';

interface AboutPageProps {
    onClose: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onClose }) => {
    const teamMembers = [
        {
            name: 'Rae Jin',
            role: 'Co-Founder & Full-Stack Developer',
            bio: 'Builds the frontend and manages infrastructure. Set up the vector database, Firebase deployment, and designed the user experience.',
            linkedin: 'https://www.linkedin.com/in/dalraejin1/',
            image: '/rae_profile.png',
        },
        {
            name: 'Tommy Purcell',
            role: 'Co-Founder & Full-Stack Developer',
            bio: 'Develops the backend and AI features. Built the Python API, integrated Gemini and Freepik, and handles all the generative AI magic.',
            linkedin: 'https://www.linkedin.com/in/tommypurcell/',
            image: '/tommy_profile.png',
        }
    ];

    const techStack = [
        {
            name: 'Google DeepMind',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Google_Gemini_logo.svg/200px-Google_Gemini_logo.svg.png',
            description: 'Gemini 2.0 Flash for AI generation'
        },
        {
            name: 'Qdrant',
            logo: 'https://qdrant.tech/img/logo.svg',
            description: 'Vector database for RAG'
        },
        {
            name: 'Freepik',
            logo: 'https://www.freepik.com/apple-icon-180x180.png',
            description: 'Image database & AI generation'
        },
        {
            name: 'Firebase',
            logo: 'https://www.gstatic.com/mobilesdk/160503_mobilesdk/logo/2x/firebase_28dp.png',
            description: 'Authentication & database'
        },
        {
            name: 'React',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg',
            description: 'Frontend framework'
        },
        {
            name: 'Vite',
            logo: 'https://vitejs.dev/logo.svg',
            description: 'Build tool'
        }
    ];

    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm overflow-y-auto animate-fade-in">
            <div className="min-h-screen py-12 px-4">
                <div className="max-w-6xl mx-auto bg-white overflow-hidden shadow-2xl">
                    {/* Header - Minimal Black */}
                    <div className="relative bg-gray-900 text-white p-16">
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors"
                        >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="text-center">
                            <p className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-4">About</p>
                            <h1 className="text-5xl md:text-6xl font-light tracking-tight mb-6">AutoScape</h1>
                            <p className="text-lg text-gray-300 max-w-2xl mx-auto font-light leading-relaxed">
                                Transforming landscape design with AI-powered creativity and real-world budgeting
                            </p>
                        </div>
                    </div>

                    {/* Mission Statement */}
                    <div className="p-16 bg-white border-b border-gray-100">
                        <div className="max-w-4xl mx-auto">
                            <p className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-6">Our Mission</p>
                            <p className="text-2xl md:text-3xl text-gray-900 font-light leading-relaxed border-l-4 border-black pl-8">
                                We're democratizing professional landscape design by combining cutting-edge AI technology
                                with real-world pricing data. AutoScape makes it easy for anyone to visualize and budget
                                their dream outdoor space.
                            </p>
                        </div>
                    </div>

                    {/* Team Section */}
                    <div className="p-16 bg-gray-50">
                        <p className="text-xs uppercase tracking-[0.3em] text-gray-400 text-center mb-12">The Team</p>
                        <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
                            {teamMembers.map((member, idx) => (
                                <div
                                    key={idx}
                                    className="group bg-white p-8 hover:shadow-xl transition-all duration-300"
                                >
                                    <div className="flex flex-col items-center text-center">
                                        {/* Avatar */}
                                        <div className="w-28 h-28 rounded-full overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-300 mb-6">
                                            <img
                                                src={member.image}
                                                alt={member.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>

                                        {/* Info */}
                                        <h3 className="text-2xl font-light text-gray-900 mb-1">{member.name}</h3>
                                        <p className="text-sm uppercase tracking-widest text-gray-500 mb-4">{member.role}</p>
                                        <p className="text-gray-600 mb-6 font-light leading-relaxed">{member.bio}</p>

                                        {/* Social Links */}
                                        <a
                                            href={member.linkedin}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-6 py-2 border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white rounded-none text-sm uppercase tracking-widest font-medium transition-colors"
                                        >
                                            <Linkedin className="w-4 h-4" />
                                            LinkedIn
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tech Stack */}
                    <div className="p-16 bg-gray-900 text-white">
                        <p className="text-xs uppercase tracking-[0.3em] text-gray-400 text-center mb-4">Powered By</p>
                        <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto font-light">
                            Built with cutting-edge technologies and platforms
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-6xl mx-auto">
                            {techStack.map((tech, idx) => (
                                <div
                                    key={idx}
                                    className="bg-white/5 hover:bg-white/10 p-6 flex flex-col items-center text-center transition-all duration-300 group"
                                    title={tech.description}
                                >
                                    <div className="w-12 h-12 mb-3 flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity">
                                        <img
                                            src={tech.logo}
                                            alt={tech.name}
                                            className="max-w-full max-h-full object-contain"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                    <h4 className="font-medium text-white text-sm mb-1">{tech.name}</h4>
                                    <p className="text-xs text-gray-500">{tech.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Features Highlight */}
                    <div className="p-16 bg-white">
                        <p className="text-xs uppercase tracking-[0.3em] text-gray-400 text-center mb-12">What We Built</p>
                        <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
                            <div className="text-center">
                                <div className="w-12 h-12 border border-gray-900 flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="font-medium text-gray-900 mb-2">AI Image Generation</h3>
                                <p className="text-gray-600 text-sm font-light">Gemini 2.0 Flash creates photorealistic landscape renders</p>
                            </div>

                            <div className="text-center">
                                <div className="w-12 h-12 border border-gray-900 flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                                <h3 className="font-medium text-gray-900 mb-2">RAG-Powered Budgeting</h3>
                                <p className="text-gray-600 text-sm font-light">Qdrant vector DB matches real products with accurate pricing</p>
                            </div>

                            <div className="text-center">
                                <div className="w-12 h-12 border border-gray-900 flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="font-medium text-gray-900 mb-2">2D Plans & Analysis</h3>
                                <p className="text-gray-600 text-sm font-light">AI-generated architectural plans and environmental analysis</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-900 p-8 text-center">
                        <p className="text-gray-400 font-light">
                            Built with care for the Freepik Hackathon 2024
                        </p>
                        <p className="text-gray-600 text-sm mt-2">
                            © 2024 AutoScape. Powered by AI and innovation.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
