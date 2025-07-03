/**
 * Research Progress Component
 * Displays research workflow status and allows starting/monitoring research
 * Shows progress for Experts, SpikyPOVs, and Knowledge Tree sections
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentStore } from '../../../stores/document-store';
import { useResearchStore } from '../../../stores/research-store';
import type { ResearchProgress } from '../../../stores/document-store';

interface ProgressBarProps {
  progress: number;
  status: 'pending' | 'running' | 'completed' | 'error';
  label: string;
  className?: string;
}

/**
 * Progress bar component for individual research sections
 */
function ProgressBar({ progress, status, label, className = '' }: ProgressBarProps): JSX.Element {
  const getStatusColor = () => {
    switch (status) {
      case 'pending': return 'bg-gray-200';
      case 'running': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'pending': return '⏳';
      case 'running': return '🔄';
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <span className="text-2xl" aria-label={`Status: ${status}`}>
        {getStatusIcon()}
      </span>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-900">{label}</span>
          <span className="text-sm text-gray-500">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getStatusColor()}`}
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${label} progress: ${progress}%`}
          />
        </div>
      </div>
    </div>
  );
}

interface ResearchSectionProps {
  title: string;
  description: string;
  progress: number;
  status: 'pending' | 'running' | 'completed' | 'error';
  startTime?: Date;
  completedTime?: Date;
  errorMessage?: string;
}

/**
 * Individual research section display
 */
function ResearchSection({ 
  title, 
  description, 
  progress, 
  status, 
  startTime, 
  completedTime,
  errorMessage 
}: ResearchSectionProps): JSX.Element {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getEstimatedCompletion = () => {
    if (!startTime || status === 'completed' || status === 'error') return null;
    
    const elapsed = Date.now() - startTime.getTime();
    const rate = progress / elapsed;
    const remaining = (100 - progress) / rate;
    const estimated = new Date(Date.now() + remaining);
    
    return estimated;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
        <div className="text-right text-xs text-gray-500">
          {startTime && (
            <div>Started: {formatTime(startTime)}</div>
          )}
          {completedTime && (
            <div>Completed: {formatTime(completedTime)}</div>
          )}
          {!completedTime && status === 'running' && getEstimatedCompletion() && (
            <div>ETA: {formatTime(getEstimatedCompletion()!)}</div>
          )}
        </div>
      </div>
      
      <ProgressBar
        progress={progress}
        status={status}
        label={`${title} Research`}
        className="mb-3"
      />
      
      {errorMessage && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Main research progress component
 */
export function ResearchProgress(): JSX.Element {
  const navigate = useNavigate();
  const {
    currentDocument,
    startResearchWorkflow,
    error: documentError,
    clearError
  } = useDocumentStore();

  const {
    currentSession,
    notifications,
    removeNotification,
    error: researchError
  } = useResearchStore();

  const [isStarting, setIsStarting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Get research progress from current document
  const researchProgress = currentDocument?.researchProgress;
  const canStartResearch = currentDocument?.purpose.isComplete && 
                          currentDocument?.status === 'purpose-definition';
  const isResearchActive = currentDocument?.status === 'research-active';
  const isResearchComplete = currentDocument?.status === 'research-complete';
  
  // Check if research has been completed and content exists (any status with research content)
  const hasResearchContent = (currentDocument?.experts && currentDocument.experts.length > 0) ||
                             (currentDocument?.spikyPOVs && currentDocument.spikyPOVs.length > 0) ||
                             (currentDocument?.knowledgeTree && currentDocument.knowledgeTree.length > 0);
  
  const hasCompletedResearch = isResearchComplete || 
    (currentDocument?.status === 'in-review' && hasResearchContent) ||
    (currentDocument?.status === 'completed' && hasResearchContent);

  /**
   * Handle navigation to review page
   */
  function handleReviewResults(): void {
    if (hasCompletedResearch) {
      navigate('/review');
    }
  }

  /**
   * Auto-navigate to review page when research completes
   */
  useEffect(() => {
    if (isResearchComplete) {
      // Add a small delay to allow completion message to show
      const timer = setTimeout(() => {
        navigate('/review');
      }, 2000); // 2 second delay

      return () => clearTimeout(timer);
    }
  }, [isResearchComplete, navigate]);

  /**
   * Handle starting research workflow
   */
  async function handleStartResearch(): Promise<void> {
    if (!canStartResearch) return;

    setIsStarting(true);
    clearError();

    try {
      const success = await startResearchWorkflow();
      if (!success) {
        console.error('Failed to start research workflow');
      }
    } catch (error) {
      console.error('Error starting research:', error);
    } finally {
      setIsStarting(false);
    }
  }

  /**
   * Handle cancelling active research
   */
  async function handleCancelResearch(): Promise<void> {
    if (!isResearchActive) return;

    setIsCancelling(true);

    try {
      // Reset document status to purpose-definition to allow re-initiation
      await useDocumentStore.getState().setDocumentStatus('purpose-definition');
      
      // Could add actual research cancellation logic here if needed
      console.log('Research cancelled - status reset to purpose-definition');
    } catch (error) {
      console.error('Error cancelling research:', error);
    } finally {
      setIsCancelling(false);
    }
  }

  /**
   * Handle re-initiating research (restart from scratch)
   */
  async function handleRestartResearch(): Promise<void> {
    setIsCancelling(true);

    try {
      // Reset document status and clear previous research progress
      await useDocumentStore.getState().setDocumentStatus('purpose-definition');
      
      // Clear existing research data
      if (currentDocument) {
        useDocumentStore.getState().updateDocument({
          experts: [],
          spikyPOVs: [],
          knowledgeTree: [],
          researchProgress: {
            experts: { status: 'pending', progress: 0 },
            spikyPOVs: { status: 'pending', progress: 0 },
            knowledgeTree: { status: 'pending', progress: 0 },
            overallProgress: 0
          }
        });
      }
      
      console.log('Research restarted - ready for new research');
    } catch (error) {
      console.error('Error restarting research:', error);
    } finally {
      setIsCancelling(false);
    }
  }

  /**
   * Calculate overall progress
   */
  function calculateOverallProgress(): number {
    if (!researchProgress) return 0;
    return researchProgress.overallProgress || 0;
  }

  /**
   * Get overall status
   */
  function getOverallStatus(): 'pending' | 'running' | 'completed' | 'error' {
    if (!researchProgress) return 'pending';
    
    const sections = [researchProgress.experts, researchProgress.spikyPOVs, researchProgress.knowledgeTree];
    
    if (sections.some(s => s.status === 'error')) return 'error';
    if (sections.every(s => s.status === 'completed')) return 'completed';
    if (sections.some(s => s.status === 'running')) return 'running';
    
    return 'pending';
  }

  // Auto-clear notifications after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      notifications.forEach(notification => {
        if (notification.type !== 'error') {
          removeNotification(notification.id);
        }
      });
    }, 5000);

    return () => clearTimeout(timer);
  }, [notifications, removeNotification]);

  if (!currentDocument) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center">
          <div className="text-4xl mb-4">📄</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Document Selected</h3>
          <p className="text-gray-600">Create or select a BrainLift document to start research</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Research Progress</h2>
            <p className="text-gray-600 mt-1">{currentDocument.title}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Status</div>
            <div className="text-lg font-semibold capitalize text-gray-900">
              {currentDocument.status.replace('-', ' ')}
            </div>
          </div>
        </div>

        {/* Overall Progress */}
        <ProgressBar
          progress={calculateOverallProgress()}
          status={getOverallStatus()}
          label="Overall Research Progress"
          className="mb-6"
        />

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {canStartResearch && (
            <button
              onClick={handleStartResearch}
              disabled={isStarting}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium
                         hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors duration-200"
            >
              {isStarting ? (
                <>
                  <span className="inline-block animate-spin mr-2">🔄</span>
                  Starting Research...
                </>
              ) : (
                'Start Research'
              )}
            </button>
          )}

          {isResearchActive && (
            <>
              <button
                onClick={handleCancelResearch}
                disabled={isCancelling}
                className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium
                           hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors duration-200"
              >
                {isCancelling ? (
                  <>
                    <span className="inline-block animate-spin mr-2">🔄</span>
                    Cancelling...
                  </>
                ) : (
                  'Cancel Research'
                )}
              </button>
            </>
          )}

          {hasCompletedResearch && (
            <>
              <button
                onClick={handleReviewResults}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium
                           hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500
                           transition-colors duration-200"
              >
                Review Results
              </button>
              <button
                onClick={handleRestartResearch}
                disabled={isCancelling}
                className="bg-orange-600 text-white px-6 py-2 rounded-lg font-medium
                           hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors duration-200"
              >
                {isCancelling ? (
                  <>
                    <span className="inline-block animate-spin mr-2">🔄</span>
                    Restarting...
                  </>
                ) : (
                  'Restart Research'
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error Display */}
      {(documentError || researchError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-red-500 text-xl">❌</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Research Error</h3>
              <p className="text-sm text-red-700 mt-1">
                {documentError || researchError}
              </p>
              <button
                onClick={clearError}
                className="text-red-700 underline text-sm mt-2 hover:text-red-800"
              >
                Clear Error
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border ${
                notification.type === 'error' ? 'bg-red-50 border-red-200' :
                notification.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                notification.type === 'success' ? 'bg-green-50 border-green-200' :
                'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-sm">{notification.title}</h4>
                  <p className="text-sm mt-1">{notification.message}</p>
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="text-gray-400 hover:text-gray-600 ml-4"
                >
                  ✕
                </button>
              </div>
              {notification.action && (
                <button
                  onClick={notification.action.onClick}
                  className="mt-2 text-sm font-medium underline hover:no-underline"
                >
                  {notification.action.label}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Research Sections */}
      {researchProgress && (isResearchActive || hasCompletedResearch) && (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
          <ResearchSection
            title="Expert Research"
            description="Finding domain experts and thought leaders"
            progress={researchProgress.experts.progress}
            status={researchProgress.experts.status}
            startTime={researchProgress.experts.startTime}
            completedTime={researchProgress.experts.completedTime}
            errorMessage={researchProgress.experts.errorMessage}
          />
          
          <ResearchSection
            title="SpikyPOV Research"
            description="Discovering contrarian viewpoints and evidence"
            progress={researchProgress.spikyPOVs.progress}
            status={researchProgress.spikyPOVs.status}
            startTime={researchProgress.spikyPOVs.startTime}
            completedTime={researchProgress.spikyPOVs.completedTime}
            errorMessage={researchProgress.spikyPOVs.errorMessage}
          />
          
          <ResearchSection
            title="Knowledge Tree Research"
            description="Mapping related fields and dependencies"
            progress={researchProgress.knowledgeTree.progress}
            status={researchProgress.knowledgeTree.status}
            startTime={researchProgress.knowledgeTree.startTime}
            completedTime={researchProgress.knowledgeTree.completedTime}
            errorMessage={researchProgress.knowledgeTree.errorMessage}
          />
        </div>
      )}

      {/* Help Text */}
      {!canStartResearch && currentDocument.status === 'purpose-definition' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-blue-500 text-xl">💡</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Complete Your Purpose</h3>
              <p className="text-sm text-blue-700 mt-1">
                Finish defining your Purpose section to start automated research. 
                Make sure all three subsections (Core Problem, Target Outcome, and Boundaries) are complete.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 