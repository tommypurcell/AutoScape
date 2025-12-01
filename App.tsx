import React, { useState, useEffect } from 'react';
import { UploadArea } from './components/UploadArea';
import { LoadingScreen } from './components/LoadingScreen';
import { ResultsView } from './components/ResultsView';
import { StyleGallery } from './components/StyleGallery';
import { generateLandscapeDesign } from './services/geminiService';
import { AppState, DesignStyle } from './types';
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

const AppContent: React.FC = () => {
  const [state, setState] = useState<AppState>({
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSidebar(true)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="font-bold text-xl text-slate-800 tracking-tight">AutoScape</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
              AI Powered
            </span>
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
        />
      ) : showCommunityGallery ? (
        <div className="min-h-screen bg-slate-50">
          <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16 items-center">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setShowCommunityGallery(false); setShowLanding(true); }}>
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                    A
                  </div>
                  <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-blue-600">
                    AutoScape
                  </span>
                </div>
                <button
                  onClick={() => setShowSidebar(true)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <Menu className="w-6 h-6 text-slate-600" />
                </button>
              </div>
            </div>
          </nav>
          <CommunityGallery onLoadDesign={handleLoadDesign} />
        </div>
      ) : (
        <div className="min-h-screen bg-slate-50">
          {/* Main Content */}
          <main className="flex-1 bg-slate-50">
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
                <div className="max-w-3xl mx-auto animate-fade-in">
                  <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
                      Reimagine Your Outdoors
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                      Upload a photo of your yard and let our AI generate a professional landscape design, labeled 2D plan, and cost estimate instantly.
                    </p>
                  </div>

                  {state.error && (
                    <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {state.error}
                    </div>
                  )}

                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-8 space-y-8">

                      {/* Uploads */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700">Current Yard Photo</label>
                          <UploadArea
                            label="Upload Yard Photo"
                            subLabel="Required"
                            required
                            multiple={false}
                            onFileSelect={handleYardSelect}
                            previewUrls={state.yardImagePreview ? [state.yardImagePreview] : []}
                            onClear={handleClearYard}
                          />
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium text-slate-700">Style References (Optional)</label>
                            {(selectedGalleryStyleIds.length > 0 || state.styleImages.length > 0) && (
                              <span className="text-xs text-emerald-600 font-medium">
                                {selectedGalleryStyleIds.length + state.styleImages.length} selected
                              </span>
                            )}
                          </div>

                          {/* Mode Toggle */}
                          <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                            <button
                              onClick={() => setStyleSelectionMode('gallery')}
                              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${styleSelectionMode === 'gallery'
                                ? 'bg-white text-emerald-600 shadow-sm'
                                : 'text-slate-600 hover:text-slate-800'
                                }`}
                            >
                              🖼️ Gallery
                            </button>
                            <button
                              onClick={() => setStyleSelectionMode('upload')}
                              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${styleSelectionMode === 'upload'
                                ? 'bg-white text-emerald-600 shadow-sm'
                                : 'text-slate-600 hover:text-slate-800'
                                }`}
                            >
                              📤 Upload
                            </button>
                          </div>

                          {/* Gallery Mode */}
                          {styleSelectionMode === 'gallery' && (
                            <StyleGallery
                              availableStyles={styleReferences}
                              selectedStyleIds={selectedGalleryStyleIds}
                              onStyleToggle={handleGalleryStyleToggle}
                              onClearAll={handleClearGalleryStyles}
                            />
                          )}

                          {/* Upload Mode */}
                          {styleSelectionMode === 'upload' && (
                            <>
                              {/* Upload button */}
                              <label className="block cursor-pointer">
                                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-emerald-500 hover:bg-emerald-50/50 transition-all">
                                  <svg className="w-8 h-8 mx-auto text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <p className="text-sm text-slate-600 font-medium">Add Custom Style Images</p>
                                  <p className="text-xs text-slate-400 mt-1">Click to select multiple images</p>
                                </div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  onChange={(e) => {
                                    const files = e.target.files ? Array.from(e.target.files) as File[] : [];
                                    if (files.length > 0) {
                                      handleStyleSelect(files);
                                      e.target.value = ''; // Reset input
                                    }
                                  }}
                                  className="hidden"
                                />
                              </label>

                              {/* Preview grid for uploaded images */}
                              {state.styleImagePreviews.length > 0 && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-600 font-medium">Uploaded Images</span>
                                    <button
                                      onClick={handleClearAllStyles}
                                      className="text-xs text-slate-500 hover:text-red-600 transition-colors"
                                    >
                                      Clear all ({state.styleImages.length})
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    {state.styleImagePreviews.map((preview, index) => (
                                      <div key={index} className="relative group">
                                        <img
                                          src={preview}
                                          alt={`Style ${index + 1}`}
                                          className="w-full h-24 object-cover rounded-lg border border-slate-200"
                                        />
                                        <button
                                          onClick={() => handleClearStyleImage(index)}
                                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                          title="Remove this image"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      <hr className="border-slate-100" />

                      {/* Controls */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <label className="block text-sm font-medium text-slate-700">Select Aesthetic</label>
                          <div className="grid grid-cols-2 gap-3">
                            {Object.entries(DesignStyle).map(([key, value]) => (
                              <button
                                key={key}
                                onClick={() => setState(s => ({ ...s, selectedStyle: value }))}
                                className={`px-4 py-3 text-xs font-medium rounded-lg border text-left transition-all ${state.selectedStyle === value
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500'
                                  : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                  }`}
                              >
                                {value}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className="block text-sm font-medium bg-white text-slate-700">Additional Preferences</label>
                          <textarea
                            className="w-full p-4 h-32 bg-white rounded-lg border-2 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 resize-none text-sm"
                            placeholder="e.g. I want a fire pit area, low maintenance plants, and a stone walkway..."
                            value={state.userPrompt}
                            onChange={(e) => setState(s => ({ ...s, userPrompt: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="pt-4">
                        <button
                          onClick={handleGenerate}
                          disabled={!state.yardImage}
                          className={`w-full py-4 rounded-xl text-white font-semibold text-lg shadow-lg transition-all transform active:scale-[0.99] flex items-center justify-center gap-2
                        ${state.yardImage
                              ? 'bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-200 shadow-emerald-100'
                              : 'bg-slate-300 cursor-not-allowed'
                            }
                      `}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                          Generate Design
                        </button>
                      </div>

                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-3 gap-8 text-center">
                    <div className="space-y-2">
                      <div className="w-10 h-10 bg-white rounded-full shadow-sm mx-auto flex items-center justify-center text-emerald-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                      <h4 className="font-semibold text-slate-800">Visual Redesign</h4>
                      <p className="text-xs text-slate-500">Photorealistic AI renders preserving your home's geometry.</p>
                    </div>
                    <div className="space-y-2">
                      <div className="w-10 h-10 bg-white rounded-full shadow-sm mx-auto flex items-center justify-center text-emerald-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </div>
                      <h4 className="font-semibold text-slate-800">Precise 2D Plans</h4>
                      <p className="text-xs text-slate-500">Top-down architectural plans derived directly from the render.</p>
                    </div>
                    <div className="space-y-2">
                      <div className="w-10 h-10 bg-white rounded-full shadow-sm mx-auto flex items-center justify-center text-emerald-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <h4 className="font-semibold text-slate-800">Accurate Costs</h4>
                      <p className="text-xs text-slate-500">Full estimates including materials and labor costs.</p>
                    </div>
                  </div>

                </div>
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
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
