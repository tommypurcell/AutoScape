import React, { useState, useEffect } from 'react';
import { UploadArea } from './components/UploadArea';
import { LoadingScreen } from './components/LoadingScreen';
import { ResultsView } from './components/ResultsView';
import { StyleGallery } from './components/StyleGallery';
import { generateLandscapeDesign } from './services/geminiService';
import { AppState, DesignStyle, LocationType, SpaceSize } from './types';
import { styleReferences } from './data/styleReferences';
import { urlsToFiles } from './utils/imageUtils';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthModal } from './components/AuthModal';
import { saveDesign, getUserDesigns, SavedDesign, deleteDesign } from './services/firestoreService';
import { uploadBase64Image } from './services/storageService';
import { Sidebar } from './components/Sidebar';
import { AccountSettings } from './components/AccountSettings';
import { DesignHistory } from './components/DesignHistory';
import CommunityGallery from './components/CommunityGallery';
import { AdminDashboard } from './components/AdminDashboard';
import { AboutPage } from './components/AboutPage';
import { LandingPage } from './components/LandingPage';
import { Menu } from 'lucide-react'; // Assuming Menu icon is from lucide-react
import { TutorialWalkthrough } from './components/TutorialWalkthrough';
import { tutorialSteps } from './data/tutorialSteps';
import { DesignWizard } from './components/DesignWizard';

const AppContent: React.FC = () => {
  const [state, setState] = useState<AppState>({
    step: 'upload',
    yardImage: null,
    yardImagePreview: null,
    styleImages: [],
    styleImagePreviews: [],
    userPrompt: '',
    selectedStyle: DesignStyle.MODERN,
    locationType: LocationType.BACKYARD,
    spaceSize: SpaceSize.MEDIUM,
    result: null,
    error: null,
  });

  // Gallery selection state
  const [selectedGalleryStyleIds, setSelectedGalleryStyleIds] = useState<string[]>([]);
  const [styleSelectionMode, setStyleSelectionMode] = useState<'gallery' | 'upload'>('gallery');
  const { user, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showCommunityGallery, setShowCommunityGallery] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showAboutPage, setShowAboutPage] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(() => {
    return localStorage.getItem('autoscape_tutorial_completed') === 'true';
  });

  const handleYardSelect = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setState(prev => ({
        ...prev,
        yardImage: file,
        yardImagePreview: URL.createObjectURL(file)
      }));
    }
  };

  const handleClearYard = () => {
    setState(prev => ({
      ...prev,
      yardImage: null,
      yardImagePreview: null
    }));
  };

  const handleStyleSelect = (files: File[]) => {
    if (files.length > 0) {
      const newFiles = Array.from(files);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));

      setState(prev => ({
        ...prev,
        styleImages: [...prev.styleImages, ...newFiles],
        styleImagePreviews: [...prev.styleImagePreviews, ...newPreviews]
      }));
    }
  };

  const handleClearStyleImage = (index: number) => {
    setState(prev => {
      // Revoke the URL to free memory
      URL.revokeObjectURL(prev.styleImagePreviews[index]);

      return {
        ...prev,
        styleImages: prev.styleImages.filter((_, i) => i !== index),
        styleImagePreviews: prev.styleImagePreviews.filter((_, i) => i !== index)
      };
    });
  };

  const handleClearAllStyles = () => {
    // Revoke all URLs
    state.styleImagePreviews.forEach(url => URL.revokeObjectURL(url));

    setState(prev => ({
      ...prev,
      styleImages: [],
      styleImagePreviews: []
    }));
  };

  // Gallery handlers
  const handleGalleryStyleToggle = (styleId: string) => {
    setSelectedGalleryStyleIds(prev => {
      if (prev.includes(styleId)) {
        return prev.filter(id => id !== styleId);
      } else {
        return [...prev, styleId];
      }
    });
  };

  const handleClearGalleryStyles = () => {
    setSelectedGalleryStyleIds([]);
  };

  const handleLoadDesign = (design: SavedDesign) => {
    setState(prev => ({
      ...prev,
      step: 'results',
      result: {
        renderImages: design.renderImages,
        planImage: design.planImage,
        estimates: design.estimates,
        analysis: design.analysis,
      }
    }));
    setShowLanding(false);
  };

  const resetToUploadState = () => {
    // Clean up any object URLs before resetting
    state.styleImagePreviews.forEach(url => URL.revokeObjectURL(url));
    if (state.yardImagePreview) {
      URL.revokeObjectURL(state.yardImagePreview);
    }

    setState({
      step: 'upload',
      yardImage: null,
      yardImagePreview: null,
      styleImages: [],
      styleImagePreviews: [],
      userPrompt: '',
      selectedStyle: DesignStyle.MODERN,
      result: null,
      error: null,
    });
    setSelectedGalleryStyleIds([]);
  };

  const handleNewDesign = () => {
    resetToUploadState();
    setShowLanding(false);
  };

  const handleStartTutorial = () => {
    setShowTutorial(true);
    setShowLanding(false);
    resetToUploadState();
  };

  const handleCompleteTutorial = () => {
    localStorage.setItem('autoscape_tutorial_completed', 'true');
    setHasSeenTutorial(true);
    setShowTutorial(false);
  };

  const getCurrentPage = (): 'landing' | 'upload' | 'processing' | 'results' => {
    if (showLanding) return 'landing';
    if (state.step === 'processing') return 'processing';
    if (state.step === 'results') return 'results';
    return 'upload';
  };

  const handleSidebarNavigate = (action: string) => {
    if (action === 'new') {
      handleNewDesign();
      setShowCommunityGallery(false);
      setShowAdminDashboard(false);
      setShowAboutPage(false);
    } else if (action === 'settings') {
      setShowAccountSettings(true);
    } else if (action === 'gallery') {
      setShowCommunityGallery(true);
      setShowLanding(false);
      setShowAdminDashboard(false);
      setShowAboutPage(false);
    } else if (action === 'admin') {
      setShowAdminDashboard(true);
      setShowCommunityGallery(false);
      setShowLanding(false);
      setShowAboutPage(false);
    } else if (action === 'about') {
      setShowAboutPage(true);
      setShowCommunityGallery(false);
      setShowAdminDashboard(false);
      setShowLanding(false);
    }
  };

  // Listen for save design events from ResultsView
  useEffect(() => {
    const handleSaveDesign = async (event: any) => {
      if (!user || !state.result) return;

      const isPublic = event.detail?.isPublic || false;

      try {
        await saveDesign(user.uid, {
          renderImages: state.result.renderImages,
          planImage: state.result.planImage || '',
          estimates: state.result.estimates,
          analysis: state.result.analysis,
          isPublic: isPublic
        });

        alert(isPublic ? '✅ Design saved and published to Community Gallery!' : '✅ Design saved privately!');
      } catch (error) {
        console.error('Failed to save design:', error);
        alert('❌ Failed to save design. Please try again.');
      }
    };

    window.addEventListener('saveDesign', handleSaveDesign);
    return () => window.removeEventListener('saveDesign', handleSaveDesign);
  }, [user, state.result]);

  const handleGenerate = async () => {
    if (!state.yardImage) return;

    setState(prev => ({ ...prev, step: 'processing', error: null }));

    try {
      // Merge gallery selections with custom uploads
      let allStyleImages = [...state.styleImages];

      // Convert gallery selections to File objects
      if (selectedGalleryStyleIds.length > 0) {
        const selectedStyles = styleReferences.filter(style =>
          selectedGalleryStyleIds.includes(style.id)
        );
        const galleryImageUrls = selectedStyles.map(style => style.imageUrl);
        const galleryFiles = await urlsToFiles(galleryImageUrls);
        allStyleImages = [...allStyleImages, ...galleryFiles];
      }

      const result = await generateLandscapeDesign(
        state.yardImage,
        allStyleImages,
        state.userPrompt,
        state.selectedStyle
      );

      setState(prev => ({
        ...prev,
        step: 'results',
        result
      }));

      // Save to Firestore if user is logged in
      if (user) {
        try {
          await saveDesign(user.uid, result);
          console.log('Design saved successfully');
        } catch (error) {
          console.error('Failed to save design:', error);
        }
      }
    } catch (err) {
      console.error(err);
      setState(prev => ({
        ...prev,
        step: 'upload',
        error: "Something went wrong while generating your design. Please try again."
      }));
    }
  };

  const handleReset = () => resetToUploadState();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button
              onClick={() => setShowSidebar(true)}
              className="p-2 hover:bg-gray-50 rounded transition-colors"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-bold text-xl text-green-700">AutoScape</span>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              <button className="text-gray-700 hover:text-green-700 transition-colors font-normal">About</button>
              <button className="text-gray-700 hover:text-green-700 transition-colors font-normal">Business</button>
              <button
                onClick={() => handleSidebarNavigate('gallery')}
                className="text-gray-700 hover:text-green-700 transition-colors font-normal"
              >
                Gallery
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={() => setShowAccountSettings(true)}
                className="text-gray-700 hover:text-green-700 transition-colors font-normal"
              >
                Account
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="text-gray-700 hover:text-green-700 transition-colors font-normal"
                >
                  Sign in
                </button>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-full font-normal transition-colors"
                >
                  Sign up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Landing Page or Main App */}
      {showLanding ? (
        <LandingPage
          onGetStarted={() => setShowLanding(false)}
          onAbout={() => {
            setShowAboutPage(true);
            setShowLanding(false);
          }}
          onStartTutorial={handleStartTutorial}
        />
      ) : showCommunityGallery ? (
        <div className="min-h-screen bg-gray-50">
          <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16 items-center">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setShowCommunityGallery(false); setShowLanding(true); }}>
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                    A
                  </div>
                  <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-blue-600">
                    AutoScape
                  </span>
                </div>
                <button
                  onClick={() => setShowSidebar(true)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Menu className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>
          </nav>
          <CommunityGallery onLoadDesign={handleLoadDesign} />
        </div>
      ) : (
        <div className="min-h-screen bg-gray-50">
          {/* Main Content */}
          <main className="flex-1 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

              {state.step === 'processing' && <LoadingScreen />}

              {state.step === 'results' && state.result && (
                <ResultsView
                  result={state.result}
                  onReset={handleReset}
                  originalImage={state.yardImagePreview}
                />
              )}

              {state.step === 'upload' && (
                <>
                  {state.error && (
                    <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2 max-w-5xl mx-auto">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {state.error}
                    </div>
                  )}

                  <DesignWizard
                    yardImage={state.yardImage}
                    yardImagePreview={state.yardImagePreview}
                    styleImages={state.styleImages}
                    styleImagePreviews={state.styleImagePreviews}
                    selectedGalleryStyleIds={selectedGalleryStyleIds}
                    selectedStyle={state.selectedStyle}
                    userPrompt={state.userPrompt}
                    onYardSelect={handleYardSelect}
                    onClearYard={handleClearYard}
                    onStyleSelect={handleStyleSelect}
                    onClearStyleImage={handleClearStyleImage}
                    onClearAllStyles={handleClearAllStyles}
                    onGalleryStyleToggle={handleGalleryStyleToggle}
                    onClearGalleryStyles={handleClearGalleryStyles}
                    onStyleChange={(style) => setState(s => ({ ...s, selectedStyle: style }))}
                    locationType={state.locationType}
                    spaceSize={state.spaceSize}
                    onLocationChange={(type) => setState(s => ({ ...s, locationType: type }))}
                    onSizeChange={(size) => setState(s => ({ ...s, spaceSize: size }))}
                    onPromptChange={(prompt) => setState(s => ({ ...s, userPrompt: prompt }))}
                    onGenerate={handleGenerate}
                  />
                </>
              )}
            </div>
          </main>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && !user && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

      {/* Sidebar */}
      <Sidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        onNewDesign={handleNewDesign}
        onLoadDesign={handleLoadDesign}
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

      {/* Account Settings */}
      {showAccountSettings && (
        <AccountSettings onClose={() => setShowAccountSettings(false)} />
      )}

      {/* Admin Dashboard */}
      {showAdminDashboard && (
        <AdminDashboard onClose={() => setShowAdminDashboard(false)} />
      )}

      {/* About Page */}
      {showAboutPage && (
        <AboutPage onClose={() => setShowAboutPage(false)} />
      )}

      {/* Tutorial Walkthrough */}
      <TutorialWalkthrough
        steps={tutorialSteps}
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        onComplete={handleCompleteTutorial}
        currentPage={getCurrentPage()}
      />
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
