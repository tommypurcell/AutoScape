import React from 'react';
import { styleReferences } from '../data/styleReferences';

interface AboutPageProps {
    onClose: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onClose }) => {

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
                <div className="max-w-6xl mx-auto bg-white overflow-hidden shadow-2xl rounded-2xl">
                    {/* Header - Vivid & Bold */}
                    <div className="relative h-96">
                        <img
                            src={styleReferences[3]?.imageUrl || '/concept.jpg'}
                            alt="Studio background"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/90 to-purple-900/80 mix-blend-multiply" />
                        <div className="absolute inset-0 bg-black/30" />

                        <div className="relative h-full flex flex-col items-center justify-center text-center p-8">
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors bg-black/20 hover:bg-black/40 p-2 rounded-full backdrop-blur-sm"
                            >
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300 mb-4 font-bold drop-shadow-md">Our Studio</p>
                            <h1 className="text-6xl md:text-8xl font-light tracking-tight mb-6 text-white drop-shadow-xl">AutoScape</h1>
                            <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto font-light leading-relaxed drop-shadow-lg">
                                Transforming landscape design with AI-powered creativity and real-world budgeting
                            </p>
                        </div>
                    </div>

                    {/* Mission Statement with Side Image */}
                    <div className="grid md:grid-cols-2">
                        <div className="p-16 bg-white flex flex-col justify-center">
                            <p className="text-xs uppercase tracking-[0.3em] text-indigo-600 mb-6 font-bold">Our Mission</p>
                            <p className="text-2xl md:text-3xl text-gray-900 font-light leading-relaxed border-l-4 border-indigo-600 pl-8">
                                We're democratizing professional landscape design by combining cutting-edge AI technology
                                with real-world pricing data. AutoScape makes it easy for anyone to visualize and budget
                                their dream outdoor space.
                            </p>
                        </div>
                        <div className="relative h-full min-h-[300px]">
                            <img
                                src={styleReferences[1]?.imageUrl}
                                alt="Mission context"
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-indigo-900/20 mix-blend-overlay" />
                        </div>
                    </div>



                    {/* Tech Stack - Dark & Neon */}
                    <div className="p-16 bg-slate-900 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />

                        <p className="text-xs uppercase tracking-[0.3em] text-indigo-300 text-center mb-4 relative z-10">Powered By</p>
                        <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto font-light relative z-10">
                            Built with cutting-edge technologies and platforms
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-6xl mx-auto relative z-10">
                            {techStack.map((tech, idx) => (
                                <div
                                    key={idx}
                                    className="bg-white/5 hover:bg-white/10 p-6 flex flex-col items-center text-center transition-all duration-300 group backdrop-blur-sm rounded-xl border border-white/5 hover:border-indigo-500/50"
                                    title={tech.description}
                                >
                                    <div className="w-12 h-12 mb-3 flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity">
                                        <img
                                            src={tech.logo}
                                            alt={tech.name}
                                            className="max-w-full max-h-full object-contain filter "
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

                    {/* Features Highlight - Bright Cards */}
                    <div className="p-16 bg-gradient-to-br from-indigo-50 to-white">
                        <p className="text-xs uppercase tracking-[0.3em] text-indigo-900 text-center mb-12 font-bold">What We Built</p>
                        <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
                            <div className="text-center group p-6 rounded-2xl hover:bg-white hover:shadow-xl transition-all">
                                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-lg text-gray-900 mb-2">AI Image Generation</h3>
                                <p className="text-gray-600 text-sm">Gemini 2.0 Flash creates photorealistic landscape renders</p>
                            </div>

                            <div className="text-center group p-6 rounded-2xl hover:bg-white hover:shadow-xl transition-all">
                                <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-lg text-gray-900 mb-2">RAG-Powered Budgeting</h3>
                                <p className="text-gray-600 text-sm">Qdrant vector DB matches real products with accurate pricing</p>
                            </div>

                            <div className="text-center group p-6 rounded-2xl hover:bg-white hover:shadow-xl transition-all">
                                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-lg text-gray-900 mb-2">2D Plans & Analysis</h3>
                                <p className="text-gray-600 text-sm">AI-generated architectural plans and environmental analysis</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-slate-950 p-8 text-center border-t border-slate-900">
                        <p className="text-gray-500 font-light text-sm">
                            Built with care for the Freepik Hackathon 2024
                        </p>
                        <p className="text-gray-600 text-xs mt-2">
                            © 2024 AutoScape. Powered by AI and innovation.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
