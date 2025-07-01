import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useDocumentStore } from './stores/document-store';
import { useAuthStore, initializeAuth } from './stores/auth-store';

// Import page components
import { PurposeDefinition } from './pages/PurposeDefinition';
import { ResearchProgress } from './components/features/ResearchProgress/ResearchProgress';

/**
 * Home page component for starting new BrainLift documents
 */
function HomePage() {
  const { createNewDocument, currentDocument, documentHistory, loadDocumentFromHistory } = useDocumentStore();
  const navigate = useNavigate();
  const [showHistory, setShowHistory] = useState(false);

  const handleCreateNew = () => {
    createNewDocument();
    navigate('/purpose');
  };

  const handleViewHistory = () => {
    setShowHistory(!showHistory);
  };

  const handleContinueDocument = (documentId: string) => {
    loadDocumentFromHistory(documentId);
    navigate('/purpose');
  };

  // Auto-restore current document when app starts
  useEffect(() => {
    if (currentDocument && currentDocument.chatHistory.length > 0) {
      // If there's a current document with chat history, it means the user was working on something
      // Auto-navigate them back to it only if they're on the home page
      navigate('/purpose');
    }
  }, []); // Only run on component mount

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            BrainLift Generator
          </h1>
          <p className="text-slate-600">
            AI-powered desktop application for creating BrainLift documents
          </p>
        </header>

        <main className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-8">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">
              Welcome to BrainLift Generator
            </h2>
            <p className="text-slate-600 mb-6">
              This application will help you create structured BrainLift documents 
              that guide Large Language Models beyond consensus thinking to identify 
              potential SpikyPOVs (contrarian viewpoints with evidence).
            </p>
            <div className="flex gap-4">
              <button 
                onClick={handleCreateNew}
                className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                Create New BrainLift
              </button>
              <button 
                onClick={handleViewHistory}
                className="px-6 py-3 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                {showHistory ? 'Hide History' : 'View History'} ({documentHistory.length})
              </button>
            </div>
          </div>

          {/* Document History */}
          {showHistory && documentHistory.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Document History
              </h3>
              <div className="space-y-3">
                {documentHistory.slice(0, 10).map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                    <div>
                      <div className="font-medium text-slate-800">{doc.title}</div>
                      <div className="text-sm text-slate-500">
                        {doc.status.replace('-', ' ')} • {new Date(doc.updatedAt).toLocaleDateString()} • {doc.chatHistory.length} messages
                      </div>
                    </div>
                    <button 
                      onClick={() => handleContinueDocument(doc.id)}
                      className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded hover:bg-primary-200 transition-colors"
                    >
                      Continue
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Show message when no history exists */}
          {showHistory && documentHistory.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 text-center">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                No Documents Yet
              </h3>
              <p className="text-slate-500">
                Create your first BrainLift document to get started!
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/**
 * Research page component
 */
function ResearchPage() {
  const { currentDocument, createNewDocument } = useDocumentStore();
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleCreateNew = () => {
    createNewDocument();
    navigate('/purpose');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleGoHome}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Home
              </button>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Research Phase</h1>
                <p className="text-slate-600 mt-1">
                  Automated research for your BrainLift document
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {currentDocument && (
                <div className="text-right">
                  <div className="text-sm text-slate-500">Document</div>
                  <div className="font-medium text-slate-900">{currentDocument.title}</div>
                </div>
              )}
              <button
                onClick={handleCreateNew}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium"
              >
                New BrainLift
              </button>
            </div>
          </div>
        </header>

        <main>
          <ResearchProgress />
        </main>
      </div>
    </div>
  );
}

/**
 * Review page placeholder (will be implemented in Feature 5)
 */
function ReviewPage() {
  const { createNewDocument } = useDocumentStore();
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleCreateNew = () => {
    createNewDocument();
    navigate('/purpose');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleGoHome}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Home
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Review Phase</h1>
                <p className="text-slate-600">This feature will be implemented in the next phase.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleCreateNew}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium"
              >
                New BrainLift
              </button>
            </div>
          </div>
        </header>

        <main className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-slate-600">Review and editing functionality will be available here soon.</p>
          </div>
        </main>
      </div>
    </div>
  );
}

/**
 * Main App component with routing
 */
function App() {
  const { currentDocument, loadUserDocumentsFromFirebase } = useDocumentStore();
  const { isAuthenticated, isInitializing } = useAuthStore();
  const [forceReady, setForceReady] = useState(false);

  console.log('🚀 App component rendering, auth state:', {
    isAuthenticated,
    isInitializing,
    forceReady,
    currentDocument: currentDocument ? 'Has document' : 'No document'
  });

  // Initialize Firebase authentication when app starts
  useEffect(() => {
    initializeAuth();
  }, []);

  // Load user documents from Firebase once authenticated
  useEffect(() => {
    if (isAuthenticated && !isInitializing) {
      loadUserDocumentsFromFirebase();
    }
  }, [isAuthenticated, isInitializing, loadUserDocumentsFromFirebase]);

  // TEMPORARY FIX: Force app to load after 5 seconds if still stuck initializing
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isInitializing) {
        setForceReady(true);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [isInitializing]);

  // Show loading spinner while Firebase is initializing (with timeout fallback)
  if (isInitializing && !forceReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Initializing Firebase...</p>
          <p className="text-xs text-slate-400 mt-2">Will auto-load in 5 seconds...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Home route */}
          <Route path="/" element={<HomePage />} />
          
          {/* Purpose Definition route */}
          <Route path="/purpose" element={<PurposeDefinition />} />
          
          {/* Research route (placeholder) */}
          <Route path="/research" element={<ResearchPage />} />
          
          {/* Review route (placeholder) */}
          <Route path="/review" element={<ReviewPage />} />
          
          {/* Default redirect based on document state */}
          <Route path="*" element={
            currentDocument ? (
              currentDocument.status === 'purpose-definition' ? (
                <Navigate to="/purpose" replace />
              ) : currentDocument.status === 'research-active' ? (
                <Navigate to="/research" replace />
              ) : currentDocument.status === 'research-complete' || currentDocument.status === 'in-review' ? (
                <Navigate to="/review" replace />
              ) : (
                <Navigate to="/" replace />
              )
            ) : (
              <Navigate to="/" replace />
            )
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 