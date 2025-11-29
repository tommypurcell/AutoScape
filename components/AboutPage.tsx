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
            gradient: 'from-blue-500 to-cyan-500'
        },
        {
            name: 'Tommy Purcell',
            role: 'Co-Founder & Full-Stack Developer',
            bio: 'Develops the backend and AI features. Built the Python API, integrated Gemini and Freepik, and handles all the generative AI magic.',
            linkedin: 'https://www.linkedin.com/in/tommypurcell/',
            image: '/tommy_profile.png',
            gradient: 'from-purple-500 to-pink-500'
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
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm overflow-y-auto animate-fade-in">
            <div className="min-h-screen py-12 px-4">
                <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="relative bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 text-white p-12">
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors"
                        >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="text-center">
                            <h1 className="text-5xl font-extrabold mb-4">About AutoScape</h1>
                            <p className="text-xl text-white/90 max-w-2xl mx-auto">
                                Transforming landscape design with AI-powered creativity and real-world budgeting
                            </p>
                        </div>
                    </div>

                    {/* Mission Statement */}
                    <div className="p-12 bg-gradient-to-br from-slate-50 to-white">
                        <div className="max-w-4xl mx-auto text-center">
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">Our Mission</h2>
                            <p className="text-lg text-slate-600 leading-relaxed">
                                We're democratizing professional landscape design by combining cutting-edge AI technology
                                with real-world pricing data. AutoScape makes it easy for anyone to visualize and budget
                                their dream outdoor space, powered by advanced RAG architecture and generative AI.
                            </p>
                        </div>
                    </div>

                    {/* Team Section */}
                    <div className="p-12 bg-white">
                        <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Meet the Team</h2>
                        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                            {teamMembers.map((member, idx) => (
                                <div
                                    key={idx}
                                    className="group bg-gradient-to-br from-slate-50 to-white rounded-2xl p-8 border border-slate-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                                >
                                    <div className="flex flex-col items-center text-center">
                                        {/* Avatar */}
                                        <div className={`w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-2xl mb-6 transform group-hover:scale-110 transition-transform duration-300`}>
                                            <img
                                                src={member.image}
                                                alt={member.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>

                                        {/* Info */}
                                        <h3 className="text-2xl font-bold text-slate-900 mb-2">{member.name}</h3>
                                        <p className="text-emerald-600 font-semibold mb-4">{member.role}</p>
                                        <p className="text-slate-600 mb-6 leading-relaxed">{member.bio}</p>

                                        {/* Social Links */}
                                        <div className="flex gap-4">
                                            <a
                                                href={member.linkedin}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
                                            >
                                                <Linkedin className="w-4 h-4" />
                                                LinkedIn
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tech Stack */}
                    <div className="p-12 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                        <h2 className="text-3xl font-bold text-center mb-4">Powered By</h2>
                        <p className="text-center text-slate-300 mb-12 max-w-2xl mx-auto">
                            Built with cutting-edge technologies and platforms to deliver the best experience
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-6xl mx-auto">
                            {techStack.map((tech, idx) => (
                                <div
                                    key={idx}
                                    className="bg-white rounded-xl p-6 flex flex-col items-center text-center hover:scale-105 transition-transform duration-300 group"
                                    title={tech.description}
                                >
                                    <div className="w-16 h-16 mb-3 flex items-center justify-center">
                                        <img
                                            src={tech.logo}
                                            alt={tech.name}
                                            className="max-w-full max-h-full object-contain"
                                            onError={(e) => {
                                                // Fallback if image doesn't load
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                    <h4 className="font-bold text-slate-900 text-sm mb-1">{tech.name}</h4>
                                    <p className="text-xs text-slate-500">{tech.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Features Highlight */}
                    <div className="p-12 bg-white">
                        <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">What We Built</h2>
                        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-slate-900 mb-2">AI Image Generation</h3>
                                <p className="text-slate-600 text-sm">Gemini 2.0 Flash creates photorealistic landscape renders</p>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-slate-900 mb-2">RAG-Powered Budgeting</h3>
                                <p className="text-slate-600 text-sm">Qdrant vector DB matches real products with accurate pricing</p>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-slate-900 mb-2">2D Plans & Analysis</h3>
                                <p className="text-slate-600 text-sm">AI-generated architectural plans and environmental analysis</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-slate-50 p-8 text-center border-t border-slate-200">
                        <p className="text-slate-600">
                            Built with ❤️ for the Freepik Hackathon 2024
                        </p>
                        <p className="text-slate-500 text-sm mt-2">
                            © 2024 AutoScape. Powered by AI and innovation.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
