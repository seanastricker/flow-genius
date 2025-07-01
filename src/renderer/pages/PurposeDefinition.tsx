/**
 * Purpose Definition page for BrainLift document creation
 * Integrates chat interface with purpose progress tracking
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentStore } from '../stores/document-store';
import { ChatInterface } from '../components/features/ChatInterface/ChatInterface';

/**
 * Main Purpose Definition page component
 */
export function PurposeDefinition() {
  const [showStartResearch, setShowStartResearch] = useState(false);
  const navigate = useNavigate();
  const { 
    currentDocument, 
    setDocumentStatus, 
    createNewDocument, 
    resetCurrentDocument,
    startResearchWorkflow
  } = useDocumentStore();

  // Use more specific selectors to ensure React re-renders when purpose changes
  const purposeProgress = useDocumentStore((state) => state.currentDocument?.purpose);
  const documentStatus = useDocumentStore((state) => state.currentDocument?.status);
  const isComplete = purposeProgress?.isComplete ?? false;

  // Navigate to research page when status changes to 'research-active'
  useEffect(() => {
    if (documentStatus === 'research-active') {
      console.log('Document status changed to research-active, navigating to /research');
      navigate('/research');
    }
  }, [documentStatus, navigate]);

  /**
   * Handle when Purpose is complete and ready for research
   */
  const handlePurposeComplete = () => {
    setShowStartResearch(true);
  };

  /**
   * Handle starting the research phase
   */
  const handleStartResearch = async () => {
    try {
      console.log('Starting research workflow...');
      const success = await startResearchWorkflow();
      
      if (success) {
        // Navigation will be handled automatically by App.tsx routing
        console.log('Research workflow started successfully');
      } else {
        console.error('Failed to start research workflow');
        // Show error to user (error is already set in store)
      }
    } catch (error) {
      console.error('Error starting research workflow:', error);
    }
  };

  /**
   * Navigate back to home page
   */
  const handleBackToHome = () => {
    resetCurrentDocument();
    navigate('/');
  };

  /**
   * Start a new document and stay on purpose definition page
   */
  const handleNewDocument = () => {
    createNewDocument();
    setShowStartResearch(false);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Navigation Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBackToHome}
                className="flex items-center space-x-1 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Home</span>
              </button>
              
              <button
                onClick={handleNewDocument}
                className="flex items-center space-x-1 px-3 py-2 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-md transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>New Document</span>
              </button>
            </div>
            
            {/* Title and Description */}
            <div className="border-l border-slate-200 pl-4">
              <h1 className="text-2xl font-bold text-slate-900">
                Define Your Purpose
              </h1>
              <p className="text-slate-600 mt-1">
                Let's clarify what you're trying to achieve with this BrainLift
              </p>
            </div>
          </div>
          
          {/* Progress Indicator */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                isComplete ? 'bg-green-500' : 'bg-primary-600'
              }`}></div>
              <span className="text-sm font-medium text-slate-700">
                Purpose Definition
              </span>
            </div>
            <div className="flex items-center space-x-2 opacity-50">
              <div className="w-3 h-3 rounded-full bg-slate-300"></div>
              <span className="text-sm text-slate-500">Research</span>
            </div>
            <div className="flex items-center space-x-2 opacity-50">
              <div className="w-3 h-3 rounded-full bg-slate-300"></div>
              <span className="text-sm text-slate-500">Review</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Chat Interface - Takes up most of the space */}
        <div className="flex-1">
          <ChatInterface onPurposeComplete={handlePurposeComplete} />
        </div>

        {/* Purpose Summary Sidebar */}
        <div className="w-80 bg-white border-l border-slate-200 p-6 overflow-y-auto">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Purpose Summary
          </h3>
          
          {/* Core Problem Section */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-slate-700 mb-2">
              Core Problem
            </h4>
            <div className="space-y-2">
              <div className="text-xs text-slate-500">Challenge:</div>
              <div className={`text-sm p-2 rounded border ${
                purposeProgress?.coreProblem.challenge 
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                {purposeProgress?.coreProblem.challenge || 'Not yet defined'}
              </div>
              
              <div className="text-xs text-slate-500">Importance:</div>
              <div className={`text-sm p-2 rounded border ${
                purposeProgress?.coreProblem.importance 
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                {purposeProgress?.coreProblem.importance || 'Not yet defined'}
              </div>
              
              <div className="text-xs text-slate-500">Current Impact:</div>
              <div className={`text-sm p-2 rounded border ${
                purposeProgress?.coreProblem.currentImpact 
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                {purposeProgress?.coreProblem.currentImpact || 'Not yet defined'}
              </div>
            </div>
          </div>

          {/* Target Outcome Section */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-slate-700 mb-2">
              Target Outcome
            </h4>
            <div className="space-y-2">
              <div className="text-xs text-slate-500">Success Definition:</div>
              <div className={`text-sm p-2 rounded border ${
                purposeProgress?.targetOutcome.successDefinition 
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                {purposeProgress?.targetOutcome.successDefinition || 'Not yet defined'}
              </div>
              
              <div className="text-xs text-slate-500">Measurable Results:</div>
              <div className={`text-sm p-2 rounded border ${
                purposeProgress?.targetOutcome.measurableResults 
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                {purposeProgress?.targetOutcome.measurableResults || 'Not yet defined'}
              </div>
              
              <div className="text-xs text-slate-500">Beneficiaries:</div>
              <div className={`text-sm p-2 rounded border ${
                purposeProgress?.targetOutcome.beneficiaries 
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                {purposeProgress?.targetOutcome.beneficiaries || 'Not yet defined'}
              </div>
            </div>
          </div>

          {/* Boundaries Section */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-slate-700 mb-2">
              Clear Boundaries
            </h4>
            <div className="space-y-2">
              <div className="text-xs text-slate-500">Included:</div>
              <div className={`text-sm p-2 rounded border ${
                purposeProgress?.boundaries.included 
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                {purposeProgress?.boundaries.included || 'Not yet defined'}
              </div>
              
              <div className="text-xs text-slate-500">Excluded:</div>
              <div className={`text-sm p-2 rounded border ${
                purposeProgress?.boundaries.excluded 
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                {purposeProgress?.boundaries.excluded || 'Not yet defined'}
              </div>
              
              <div className="text-xs text-slate-500">Adjacent Problems:</div>
              <div className={`text-sm p-2 rounded border ${
                purposeProgress?.boundaries.adjacentProblems 
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                {purposeProgress?.boundaries.adjacentProblems || 'Not yet defined'}
              </div>
            </div>
          </div>

          {/* Completion Status */}
          <div className="border-t border-slate-200 pt-4">
            {isComplete ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-green-700">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Purpose Complete!</span>
                </div>
                
                {showStartResearch && (
                  <button
                    onClick={handleStartResearch}
                    className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                  >
                    Start Research Phase
                  </button>
                )}
              </div>
            ) : (
              <div className="text-sm text-slate-500">
                Continue the conversation to complete your Purpose definition.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 