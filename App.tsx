import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { UploadArea } from './components/UploadArea';
import { LoadingScreen } from './components/LoadingScreen';
import { ResultsViewV2 as ResultsView } from './components/ResultsViewV2';
import { StyleGallery } from './components/StyleGallery';
import { generateLandscapeDesign } from './services/geminiService';
import { AppState, DesignStyle, LocationType, SpaceSize } from './types';
import { styleReferences } from './data/styleReferences';
import { urlsToFiles } from './utils/imageUtils';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DesignProvider, useDesign } from './contexts/DesignContext';
import { AuthModal } from './components/AuthModal';
import { saveDesign, getUserDesigns, SavedDesign, deleteDesign, getDesignById } from './services/firestoreService';
import { uploadBase64Image } from './services/storageService';
import { Sidebar } from './components/Sidebar';
import { AccountSettings } from './components/AccountSettings';
import CommunityGallery from './components/CommunityGallery';
import { AdminDashboard } from './components/AdminDashboard';
import { AboutPage } from './components/AboutPage';
import { LandingPage } from './components/LandingPage';
import { Menu } from 'lucide-react';
import { DesignWizard } from './components/DesignWizard';
import { ResultsPage } from './components/ResultsPage';
import { BusinessPage } from './components/BusinessPage';

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { loadDesign, setYardImage, setYardImagePreview, setResult } = useDesign();

  // Local state for design wizard (not in context)
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
    useRag: true,
    result: null,
    error: null,
  });

  const [selectedGalleryStyleIds, setSelectedGalleryStyleIds] = useState<string[]>([]);

  // UI State for Modals/Overlays
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);

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
    loadDesign(design);
    // Use shortId for the URL, fallback to id if shortId is missing
    const urlId = design.shortId || design.id;
    navigate(`/result/${urlId}`);
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
      locationType: LocationType.BACKYARD,
      spaceSize: SpaceSize.MEDIUM,
      useRag: true,
      result: null,
      error: null,
    });
    setSelectedGalleryStyleIds([]);
  };

  const handleNewDesign = () => {
    resetToUploadState();
    navigate('/create');
  };

  const handleSidebarNavigate = (action: string) => {
    setShowSidebar(false);
    if (action === 'new') {
      handleNewDesign();
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

  // Listen for save design events from ResultsView
  useEffect(() => {
    const handleSaveDesign = async (event: any) => {
      if (!user) return;

      const isPublic = event.detail?.isPublic || false;
      const designData = event.detail?.design || state.result;
      const yardUrl = event.detail?.yardImageUrl || state.yardImagePreview;

      if (!designData) {
        alert('❌ No design data available to save.');
        return;
      }

      try {
        const { id, shortId } = await saveDesign(user.uid, {
          renderImages: designData.renderImages,
          planImage: designData.planImage || '',
          estimates: designData.estimates,
          analysis: designData.analysis,
          yardImageUrl: yardUrl,
        }, isPublic);

        if (isPublic) {
          alert(`✅ Design saved and published to Community Gallery!\n\n🔗 Share link: ${window.location.origin}/result/${shortId}`);
        } else {
          alert(`✅ Design saved privately!\n\n🔗 Your link: ${window.location.origin}/result/${shortId}`);
        }

        // Reload gallery if on gallery page
        window.dispatchEvent(new CustomEvent('refreshGallery'));
      } catch (error) {
        console.error('Failed to save design:', error);
        alert('❌ Failed to save design. Please try again.');
      }
    };

    window.addEventListener('saveDesign', handleSaveDesign);
    return () => window.removeEventListener('saveDesign', handleSaveDesign);
  }, [user, state.result, state.yardImagePreview]);

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
        state.selectedStyle,
        '', // budget parameter (empty for now)
        undefined, // onProgress callback
        state.useRag
      );

      setState(prev => ({
        ...prev,
        step: 'results',
        result
      }));

      // Update context with the result
      setResult(result);

      // Save to Firestore for ALL users (authenticated or anonymous) to generate a unique URL
      try {
        // Use the local yard image preview URL (skip Firebase Storage upload to avoid CORS issues in development)
        // TODO: For production, enable Firebase Storage upload after configuring CORS on the storage bucket
        const yardImageUrl = state.yardImagePreview;

        // Use user ID or 'anonymous' for Firestore document
        const ownerId = user ? user.uid : 'anonymous';

        const { id, shortId } = await saveDesign(ownerId, {
          ...result,
          yardImageUrl,
        }, false); // Default to private, user can publish later
        console.log('Design saved successfully with shortId:', shortId);

        // Update context with yard image
        setYardImagePreview(yardImageUrl);

        // Navigate to the unique URL
        navigate(`/result/${shortId}`, { state: { result, yardImageUrl } });
      } catch (error) {
        console.error('Failed to save design:', error);
        // Fallback: Navigate with state only if saving fails
        setYardImagePreview(state.yardImagePreview);
        navigate('/result/generated', { state: { result, yardImageUrl: state.yardImagePreview } });
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
      {/* Navbar - Visible on all pages */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button
              onClick={() => setShowSidebar(true)}
              className="p-2 hover:bg-gray-50 rounded transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
            <span
              onClick={() => navigate('/')}
              className="font-bold text-xl text-green-700 cursor-pointer"
            >
              AutoScape
            </span>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              <button onClick={() => navigate('/about')} className="text-gray-700 hover:text-green-700 transition-colors font-normal">About</button>
              <button onClick={() => navigate('/business')} className="text-gray-700 hover:text-green-700 transition-colors font-normal">Business</button>
              <button
                onClick={() => navigate('/gallery')}
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

      <Routes>
        <Route path="/" element={
          <LandingPage
            onGetStarted={() => navigate('/create')}
            onAbout={() => navigate('/about')}
            onStartTutorial={() => navigate('/create')}
          />
        } />

        <Route path="/create" element={
          <div className="min-h-screen bg-gray-50">
            <main className="flex-1 bg-gray-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {state.step === 'processing' ? (
                  <LoadingScreen />
                ) : (
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
                      useRag={state.useRag}
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
                      onUseRagChange={(useRag) => setState(s => ({ ...s, useRag }))}
                      onGenerate={handleGenerate}
                      initialStep={state.error ? 3 : 1}
                    />
                  </>
                )}
              </div>
            </main>
          </div>
        } />

        <Route path="/result/:id" element={<ResultsPage />} />

        {/* Temporary route for immediate results without ID */}
        <Route path="/result/generated" element={<ResultsPage />} />

        <Route path="/gallery" element={
          <div className="min-h-screen bg-gray-50">
            <CommunityGallery onLoadDesign={handleLoadDesign} />
          </div>
        } />

        <Route path="/about" element={<AboutPage onClose={() => navigate('/')} />} />

        <Route path="/business" element={<BusinessPage />} />
        <Route path="/admin" element={<AdminDashboard onClose={() => navigate('/')} />} />
      </Routes>

      {/* Modals & Overlays */}
      {showAuthModal && !user && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

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
