/**
 * Research Store
 * Manages research workflow state and coordinates with worker manager
 * Handles progress tracking, result aggregation, and error handling
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  ResearchProgress, 
  ExpertSection, 
  SpikyPOVSection, 
  KnowledgeTreeSection,
  PurposeSection 
} from './document-store';
import type { 
  WorkerJob, 
  WorkerResult, 
  SectionRequirements 
} from '../../workers/research-worker';

// Local type definitions for IPC communication
interface WorkerManagerConfig {
  workerCount: number;
  tavilyApiKey: string;
  openaiApiKey: string;
  maxRetries: number;
  jobTimeout: number;
}

interface JobProgress {
  jobId: string;
  workerId: string;
  progress: number;
  status: string;
  startTime: Date;
  estimatedCompletion?: Date;
}

interface WorkerStatus {
  id: string;
  status: 'idle' | 'busy' | 'error' | 'stopped';
  currentJob?: string;
  lastActivity: Date;
  totalJobsCompleted: number;
  errorCount: number;
}

export interface ResearchConfig {
  targetSourceCount: number;
  analysisDepth: 'summary' | 'detailed';
  maxRetries: number;
  jobTimeout: number;
  workerCount: number;
}

export interface ResearchJob {
  id: string;
  type: 'experts' | 'spikyPOVs' | 'knowledgeTree';
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  startTime?: Date;
  completedTime?: Date;
  errorMessage?: string;
  result?: WorkerResult;
}

export interface ResearchSession {
  id: string;
  documentId: string;
  purpose: PurposeSection;
  config: ResearchConfig;
  jobs: ResearchJob[];
  overallProgress: number;
  status: 'idle' | 'running' | 'completed' | 'error';
  startTime?: Date;
  completedTime?: Date;
  results: {
    experts: ExpertSection[];
    spikyPOVs: SpikyPOVSection[];
    knowledgeTree: KnowledgeTreeSection[];
  };
}

export interface ResearchStore {
  // Current research session
  currentSession: ResearchSession | null;
  sessionHistory: ResearchSession[];
  
  // Worker management state
  workerManager: any; // Will be set at runtime
  workerStatuses: WorkerStatus[];
  isWorkerManagerReady: boolean;
  
  // UI state
  isResearchActive: boolean;
  error: string | null;
  notifications: ResearchNotification[];
  
  // Configuration
  config: ResearchConfig;
  
  // Actions
  initializeWorkerManager: (apiKeys: { tavily: string; openai: string }) => Promise<boolean>;
  startResearchSession: (documentId: string, purpose: PurposeSection) => Promise<boolean>;
  pauseResearchSession: () => void;
  resumeResearchSession: () => void;
  cancelResearchSession: () => void;
  retryFailedJobs: () => Promise<void>;
  
  // Progress tracking
  updateJobProgress: (jobId: string, progress: JobProgress) => void;
  completeJob: (jobId: string, result: WorkerResult) => void;
  failJob: (jobId: string, error: string, retryable: boolean) => void;
  
  // Results management
  getResearchResults: () => ResearchSession['results'] | null;
  updateResearchResults: (results: Partial<ResearchSession['results']>) => void;
  syncProgressToDocumentStore: (session: ResearchSession) => void;
  
  // Configuration
  updateConfig: (config: Partial<ResearchConfig>) => void;
  resetConfig: () => void;
  
  // Notifications
  addNotification: (notification: Omit<ResearchNotification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
        // Cleanup
      clearError: () => void;
      resetStore: () => void;
      cleanup: () => void;
}

export interface ResearchNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Default research configuration
 */
function getDefaultConfig(): ResearchConfig {
  return {
    targetSourceCount: 4,
    analysisDepth: 'detailed',
    maxRetries: 3,
    jobTimeout: 300000, // 5 minutes
    workerCount: 3
  };
}

/**
 * Generate research queries based on purpose
 */
function generateResearchQueries(purpose: PurposeSection, type: 'experts' | 'spikyPOVs' | 'knowledgeTree'): string[] {
  const challenge = purpose.coreProblem.challenge;
  const domain = extractDomainFromPurpose(purpose);
  const keywords = extractKeywords(purpose);

  switch (type) {
    case 'experts':
      return [
        `leading experts ${domain} ${keywords.slice(0, 2).join(' ')}`,
        `top researchers ${challenge}`,
        `thought leaders ${domain}`,
        `professors ${keywords[0]} research`,
        `industry experts ${challenge}`
      ];
      
    case 'spikyPOVs':
      return [
        `conventional wisdom wrong ${challenge}`,
        `contrarian view ${keywords[0]}`,
        `debunked myths ${domain}`,
        `surprising research ${challenge}`,
        `counterintuitive findings ${keywords.slice(0, 2).join(' ')}`
      ];
      
    case 'knowledgeTree':
      return [
        `current state ${domain} tools systems`,
        `background knowledge ${challenge}`,
        `dependencies ${keywords[0]}`,
        `adjacent fields ${domain}`,
        `related concepts ${challenge}`
      ];
      
    default:
      return [];
  }
}

/**
 * Extract domain from purpose
 */
function extractDomainFromPurpose(purpose: PurposeSection): string {
  const text = `${purpose.coreProblem.challenge} ${purpose.targetOutcome.successDefinition}`.toLowerCase();
  const domains = ['technology', 'business', 'science', 'healthcare', 'education', 'finance', 'marketing'];
  
  for (const domain of domains) {
    if (text.includes(domain)) {
      return domain;
    }
  }
  
  return 'general';
}

/**
 * Extract keywords from purpose
 */
function extractKeywords(purpose: PurposeSection): string[] {
  const text = `${purpose.coreProblem.challenge} ${purpose.targetOutcome.successDefinition}`;
  const words = text.toLowerCase().split(/\s+/);
  
  // Filter out common words and return significant terms
  const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
  return words
    .filter(word => word.length > 3 && !stopWords.includes(word))
    .slice(0, 5);
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create the research store
 */
export const useResearchStore = create<ResearchStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentSession: null,
      sessionHistory: [],
      workerManager: null,
      workerStatuses: [],
      isWorkerManagerReady: false,
      isResearchActive: false,
      error: null,
      notifications: [],
      config: getDefaultConfig(),

      // Initialize research service
      initializeWorkerManager: async (apiKeys: { tavily: string; openai: string }) => {
        try {
          const config = get().config;
          
          const researchConfig = {
            tavilyApiKey: apiKeys.tavily,
            openaiApiKey: apiKeys.openai,
            workerCount: config.workerCount,
            maxRetries: config.maxRetries,
            jobTimeout: config.jobTimeout
          };

          // Setup event listeners for research updates
          window.electronAPI.research.onProgress((data: any) => {
            get().updateJobProgress(data.jobId, {
              jobId: data.jobId,
              workerId: data.type,
              progress: data.progress,
              status: data.status,
              startTime: new Date(),
              estimatedCompletion: data.estimatedCompletion
            });
          });

          window.electronAPI.research.onComplete((data: any) => {
            get().completeJob(data.jobId, data.result);
          });

          window.electronAPI.research.onError((data: any) => {
            get().failJob(data.jobId, data.error, data.retryable);
          });

          const success = await window.electronAPI.research.initialize(researchConfig);
          
          if (success) {
            set({ 
              workerManager: { initialized: true }, // Placeholder object
              isWorkerManagerReady: true,
              error: null
            });

            get().addNotification({
              type: 'success',
              title: 'Research Engine Ready',
              message: `Initialized ${config.workerCount} research workers`
            });

            return true;
          } else {
            throw new Error('Research service initialization failed');
          }
        } catch (error) {
          console.error('Failed to initialize worker manager:', error);
          set({ 
            error: `Failed to initialize research engine: ${(error as Error).message}`,
            isWorkerManagerReady: false 
          });
          return false;
        }
      },

      // Start research session
      startResearchSession: async (documentId: string, purpose: PurposeSection) => {
        const { workerManager, config, isWorkerManagerReady } = get();
        
        if (!isWorkerManagerReady || !workerManager) {
          set({ error: 'Research engine not ready. Please initialize first.' });
          return false;
        }

        try {
          const sessionId = generateId();
          const jobs: ResearchJob[] = [
            {
              id: generateId(),
              type: 'experts',
              status: 'pending',
              progress: 0
            },
            {
              id: generateId(),
              type: 'spikyPOVs',
              status: 'pending',
              progress: 0
            },
            {
              id: generateId(),
              type: 'knowledgeTree',
              status: 'pending',
              progress: 0
            }
          ];

          const session: ResearchSession = {
            id: sessionId,
            documentId,
            purpose,
            config,
            jobs,
            overallProgress: 0,
            status: 'running',
            startTime: new Date(),
            results: {
              experts: [],
              spikyPOVs: [],
              knowledgeTree: []
            }
          };

          set({ 
            currentSession: session,
            isResearchActive: true,
            error: null
          });

          // Start all jobs in parallel
          const workerJobs: WorkerJob[] = jobs.map(job => ({
            id: job.id,
            type: job.type,
            queries: generateResearchQueries(purpose, job.type),
            purpose: `${purpose.coreProblem.challenge} - ${purpose.targetOutcome.successDefinition}`,
            sectionRequirements: {
              targetSourceCount: config.targetSourceCount,
              sourceTypes: ['academic', 'industry', 'news', 'blog'],
              analysisDepth: config.analysisDepth,
              outputFormat: 'markdown'
            }
          }));

          await window.electronAPI.research.executeJobsParallel(workerJobs);

          get().addNotification({
            type: 'info',
            title: 'Research Started',
            message: `Started parallel research for ${jobs.length} sections`
          });

          return true;
        } catch (error) {
          console.error('Failed to start research session:', error);
          set({ 
            error: `Failed to start research: ${(error as Error).message}`,
            isResearchActive: false
          });
          return false;
        }
      },

      // Pause research session
      pauseResearchSession: () => {
        const { currentSession } = get();
        if (!currentSession) return;

        // Cancel all running jobs
        const runningJobs = currentSession.jobs.filter(job => job.status === 'running');
        for (const job of runningJobs) {
          window.electronAPI.research.cancelJob(job.id);
        }

        set({
          isResearchActive: false,
          currentSession: {
            ...currentSession,
            status: 'idle'
          }
        });

        get().addNotification({
          type: 'info',
          title: 'Research Paused',
          message: 'Research session has been paused'
        });
      },

      // Resume research session
      resumeResearchSession: () => {
        const { currentSession } = get();
        if (!currentSession) return;

        // Restart failed or pending jobs
        const jobsToRestart = currentSession.jobs.filter(
          job => job.status === 'pending' || job.status === 'error'
        );

        if (jobsToRestart.length > 0) {
          set({
            isResearchActive: true,
            currentSession: {
              ...currentSession,
              status: 'running'
            }
          });

          get().addNotification({
            type: 'info',
            title: 'Research Resumed',
            message: `Restarting ${jobsToRestart.length} jobs`
          });
        }
      },

      // Cancel research session
      cancelResearchSession: () => {
        const { currentSession, workerManager } = get();
        if (!currentSession) return;

        // Cancel all jobs
        for (const job of currentSession.jobs) {
          if (job.status === 'running') {
            window.electronAPI.research.cancelJob(job.id);
          }
        }

        set({
          currentSession: null,
          isResearchActive: false
        });

        get().addNotification({
          type: 'warning',
          title: 'Research Cancelled',
          message: 'Research session has been cancelled'
        });
      },

      // Retry failed jobs
      retryFailedJobs: async () => {
        const { currentSession, workerManager } = get();
        if (!currentSession || !workerManager) return;

        const failedJobs = currentSession.jobs.filter(job => job.status === 'error');
        if (failedJobs.length === 0) return;

        // Reset failed jobs to pending
        const updatedJobs = currentSession.jobs.map(job => 
          job.status === 'error' 
            ? { ...job, status: 'pending' as const, progress: 0, errorMessage: undefined }
            : job
        );

        set({
          currentSession: {
            ...currentSession,
            jobs: updatedJobs,
            status: 'running'
          },
          isResearchActive: true
        });

        get().addNotification({
          type: 'info',
          title: 'Retrying Failed Jobs',
          message: `Retrying ${failedJobs.length} failed jobs`
        });
      },

      // Update job progress
      updateJobProgress: (jobId: string, progress: JobProgress) => {
        const { currentSession } = get();
        if (!currentSession) return;

        console.log(`Research progress update: ${progress.progress}% for job ${jobId} (${progress.status})`);

        const updatedJobs = currentSession.jobs.map(job =>
          job.id === jobId
            ? { 
                ...job, 
                status: 'running' as const,
                progress: progress.progress,
                errorMessage: undefined
              }
            : job
        );

        const overallProgress = updatedJobs.reduce((sum, job) => sum + job.progress, 0) / updatedJobs.length;

        const updatedSession = {
          ...currentSession,
          jobs: updatedJobs,
          overallProgress
        };

        set({ currentSession: updatedSession });

        // Sync progress to document store
        get().syncProgressToDocumentStore(updatedSession);
      },

      // Sync research progress to document store
      syncProgressToDocumentStore: async (session: ResearchSession) => {
        try {
          // Import document store dynamically to avoid circular imports
          const { useDocumentStore } = await import('./document-store');
          const documentStore = useDocumentStore.getState();

          // Helper function to filter out undefined values
          const filterUndefined = (obj: any) => {
            const filtered: any = {};
            for (const [key, value] of Object.entries(obj)) {
              if (value !== undefined) {
                filtered[key] = value;
              }
            }
            return filtered;
          };

          // Convert research session progress to document store format
          const expertsJob = session.jobs.find(j => j.type === 'experts');
          const spikyPOVsJob = session.jobs.find(j => j.type === 'spikyPOVs');
          const knowledgeTreeJob = session.jobs.find(j => j.type === 'knowledgeTree');

          const researchProgress = {
            experts: filterUndefined({
              status: expertsJob?.status || 'pending',
              progress: expertsJob?.progress || 0,
              startTime: expertsJob?.startTime,
              completedTime: expertsJob?.completedTime,
              errorMessage: expertsJob?.errorMessage
            }),
            spikyPOVs: filterUndefined({
              status: spikyPOVsJob?.status || 'pending',
              progress: spikyPOVsJob?.progress || 0,
              startTime: spikyPOVsJob?.startTime,
              completedTime: spikyPOVsJob?.completedTime,
              errorMessage: spikyPOVsJob?.errorMessage
            }),
            knowledgeTree: filterUndefined({
              status: knowledgeTreeJob?.status || 'pending',
              progress: knowledgeTreeJob?.progress || 0,
              startTime: knowledgeTreeJob?.startTime,
              completedTime: knowledgeTreeJob?.completedTime,
              errorMessage: knowledgeTreeJob?.errorMessage
            }),
            overallProgress: session.overallProgress
          };

          // Update document store research progress
          documentStore.updateResearchProgress(researchProgress);

          console.log('Synced research progress to document store:', researchProgress);
        } catch (error) {
          console.error('Failed to sync progress to document store:', error);
        }
      },

      // Complete job
      completeJob: (jobId: string, result: WorkerResult) => {
        const { currentSession } = get();
        if (!currentSession) return;

        const updatedJobs = currentSession.jobs.map(job =>
          job.id === jobId
            ? { 
                ...job, 
                status: 'completed' as const,
                progress: 100,
                completedTime: new Date(),
                result
              }
            : job
        );

        const overallProgress = updatedJobs.reduce((sum, job) => sum + job.progress, 0) / updatedJobs.length;
        const allCompleted = updatedJobs.every(job => job.status === 'completed');

        // Update results based on job type
        const updatedResults = { ...currentSession.results };
        const job = updatedJobs.find(j => j.id === jobId);
        
        if (job?.type === 'experts' && result) {
          // Convert result to ExpertSection format
          updatedResults.experts = result.sources.map(source => ({
            id: source.id,
            expert: {
              name: source.author || 'Unknown Expert',
              title: source.title,
              credentials: '',
              focusArea: source.sourceType,
              relevance: `Credibility: ${source.credibilityScore}/10`,
              publicProfiles: [source.url]
            },
            sources: [source],
            generatedContent: result.generatedContent,
            lastUpdated: new Date()
          }));
        } else if (job?.type === 'spikyPOVs' && result) {
          updatedResults.spikyPOVs = [{
            id: generateId(),
            consensusView: 'Generated from research sources',
            contrarianInsight: 'Evidence-based contrarian perspective',
            evidence: result.sources.map(s => s.summary),
            practicalImplications: 'See generated content for implications',
            sources: result.sources,
            generatedContent: result.generatedContent,
            lastUpdated: new Date()
          }];
        } else if (job?.type === 'knowledgeTree' && result) {
          updatedResults.knowledgeTree = [{
            id: generateId(),
            currentState: {
              systems: 'Generated from research',
              tools: 'See sources for current tools',
              strengths: 'Identified strengths',
              weaknesses: 'Identified weaknesses',
              metrics: 'Performance metrics'
            },
            relatedAreas: {
              adjacentFields: [],
              backgroundConcepts: [],
              dependencies: []
            },
            sources: result.sources,
            generatedContent: result.generatedContent,
            lastUpdated: new Date()
          }];
        }

        const updatedSession: ResearchSession = {
          ...currentSession,
          jobs: updatedJobs,
          overallProgress,
          status: allCompleted ? 'completed' as const : 'running' as const,
          completedTime: allCompleted ? new Date() : undefined,
          results: updatedResults
        };

        set({
          currentSession: updatedSession,
          isResearchActive: !allCompleted
        });

        if (allCompleted) {
          // Sync final results to document store
          get().syncProgressToDocumentStore(updatedSession);
          
          // Import document store to update results and complete workflow
          import('./document-store').then(({ useDocumentStore }) => {
            const documentStore = useDocumentStore.getState();
            documentStore.updateResearchResults(updatedResults.experts, updatedResults.spikyPOVs, updatedResults.knowledgeTree);
            documentStore.completeResearchWorkflow();
          });

          get().addNotification({
            type: 'success',
            title: 'Research Complete!',
            message: 'All research sections have been completed successfully'
          });
        } else {
          // Sync progress update to document store
          get().syncProgressToDocumentStore(updatedSession);
        }
      },

      // Fail job
      failJob: (jobId: string, error: string, retryable: boolean) => {
        const { currentSession } = get();
        if (!currentSession) return;

        const updatedJobs = currentSession.jobs.map(job =>
          job.id === jobId
            ? { 
                ...job, 
                status: 'error' as const,
                errorMessage: error
              }
            : job
        );

        set({
          currentSession: {
            ...currentSession,
            jobs: updatedJobs
          }
        });

        get().addNotification({
          type: 'error',
          title: 'Research Job Failed',
          message: `${error}${retryable ? ' (retryable)' : ''}`,
          action: retryable ? {
            label: 'Retry',
            onClick: () => get().retryFailedJobs()
          } : undefined
        });
      },

      // Get research results
      getResearchResults: () => {
        const { currentSession } = get();
        return currentSession?.results || null;
      },

      // Update research results
      updateResearchResults: (results: Partial<ResearchSession['results']>) => {
        const { currentSession } = get();
        if (!currentSession) return;

        set({
          currentSession: {
            ...currentSession,
            results: {
              ...currentSession.results,
              ...results
            }
          }
        });
      },

      // Update configuration
      updateConfig: (newConfig: Partial<ResearchConfig>) => {
        set({
          config: {
            ...get().config,
            ...newConfig
          }
        });
      },

      // Reset configuration
      resetConfig: () => {
        set({ config: getDefaultConfig() });
      },

      // Add notification
      addNotification: (notification: Omit<ResearchNotification, 'id' | 'timestamp'>) => {
        const newNotification: ResearchNotification = {
          ...notification,
          id: generateId(),
          timestamp: new Date()
        };

        set({
          notifications: [...get().notifications, newNotification]
        });

        // Auto-remove non-error notifications after 5 seconds
        if (notification.type !== 'error') {
          setTimeout(() => {
            get().removeNotification(newNotification.id);
          }, 5000);
        }
      },

      // Remove notification
      removeNotification: (id: string) => {
        set({
          notifications: get().notifications.filter(n => n.id !== id)
        });
      },

      // Clear notifications
      clearNotifications: () => {
        set({ notifications: [] });
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Reset store
      resetStore: () => {
        set({
          currentSession: null,
          sessionHistory: [],
          workerManager: null,
          workerStatuses: [],
          isWorkerManagerReady: false,
          isResearchActive: false,
          error: null,
          notifications: [],
          config: getDefaultConfig()
        });
      },

      // Cleanup event listeners and shutdown research service
      cleanup: () => {
        // Remove all research event listeners
        window.electronAPI.research.removeProgressListeners();
        window.electronAPI.research.removeCompleteListeners();
        window.electronAPI.research.removeErrorListeners();
        
        // Shutdown research service
        window.electronAPI.research.shutdown();
        
        // Reset store state
        get().resetStore();
      }
    }),
    {
      name: 'research-storage',
      // Only persist configuration and session history
      partialize: (state) => ({
        config: state.config,
        sessionHistory: state.sessionHistory
      })
    }
  )
); 