import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { LoadingScreen } from './components/LoadingScreen';
import { ResultsView } from './components/ResultsView';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DesignProvider, useDesign } from './contexts/DesignContext';
import { AuthModal } from './components/AuthModal';
import { Sidebar } from './components/Sidebar';
import { AccountSettings } from './components/AccountSettings';
import CommunityGallery from './components/CommunityGallery';
import { AdminDashboard } from './components/AdminDashboard';
import { AboutPage } from './components/AboutPage';
import { LandingPage } from './components/LandingPage';
import { DesignConfiguration } from './components/DesignConfiguration';
import { Menu } from 'lucide-react';

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { loadDesign } = useDesign();

  // UI State for Modals/Overlays
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);

  const handleSidebarNavigate = (action: string) => {
    setShowSidebar(false);
    if (action === 'new') {
      navigate('/upload');
    } else if (action === 'settings') {
      setShowAccountSettings(true);
    } else if (action === 'gallery') {
      navigate('/gallery');
    } else if (action === 'admin') {
      navigate('/admin');
    } else if (action === 'about') {
      navigate('/about');
    }
  };

  const isLanding = location.pathname === '/';
  const isGallery = location.pathname === '/gallery';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      {!isLanding && (
        <nav className={`border-b border-slate-200 sticky top-0 z-30 ${isGallery ? 'bg-white/80 backdrop-blur-md' : 'bg-white'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {isGallery ? (
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                    A
                  </div>
                  <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-blue-600">
                    AutoScape
                  </span>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setShowSidebar(true)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Menu className="w-6 h-6 text-slate-600" />
                  </button>
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                    <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="font-bold text-xl text-slate-800 tracking-tight">AutoScape</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              {isGallery && (
                <button
                  onClick={() => setShowSidebar(true)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors md:hidden"
                >
                  <Menu className="w-6 h-6 text-slate-600" />
                </button>
              )}
              {!isGallery && (
                <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  AI Powered
                </span>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="flex-1 bg-slate-50">
        <Routes>
          <Route path="/" element={<LandingPage onGetStarted={() => navigate('/upload')} onAbout={() => navigate('/about')} />} />
          <Route path="/upload" element={<DesignConfiguration />} />
          <Route path="/processing" element={<LoadingScreen />} />
          <Route path="/results" element={<ResultsView />} />
          <Route path="/gallery" element={<CommunityGallery onLoadDesign={(design) => {
            loadDesign(design);
            navigate('/results');
          }} />} />
          <Route path="/admin" element={<AdminDashboard onClose={() => navigate('/')} />} />
          <Route path="/about" element={<AboutPage onClose={() => navigate('/')} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Modals & Overlays */}
      {showAuthModal && !user && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

      <Sidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        onNewDesign={() => {
          navigate('/upload');
          setShowSidebar(false);
        }}
        onLoadDesign={(design) => {
          loadDesign(design);
          navigate('/results');
          setShowSidebar(false);
        }}
        onOpenSettings={() => {
          setShowSidebar(false);
          setShowAccountSettings(true);
        }}
        onLogin={() => {
          setShowSidebar(false);
          setShowAuthModal(true);
        }}
        onNavigate={handleSidebarNavigate}
      />

      {showAccountSettings && (
        <AccountSettings onClose={() => setShowAccountSettings(false)} />
      )}
    </div>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <DesignProvider>
        <AppContent />
      </DesignProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;