/**
 * Research Service for Main Process
 * Manages worker threads and handles research workflow execution
 * Communicates with renderer process via IPC
 */

// Polyfill for crypto.getRandomValues() to fix LangGraph uuid dependency issues
// This must be done before any LangGraph imports
import { randomBytes } from 'crypto';

if (typeof global !== 'undefined' && !global.crypto) {
  global.crypto = {
    getRandomValues: (array: Uint8Array) => {
      const bytes = randomBytes(array.length);
      array.set(bytes);
      return array;
    }
  } as any;
}

import { ipcMain, BrowserWindow } from 'electron';
import { LangGraphWorkflowManager, type LangGraphWorkflowConfig } from '../workers/langraph-workflow-manager';
import type { WorkerJob, WorkerResult } from '../workers/research-worker';

interface ResearchServiceConfig {
  tavilyApiKey: string;
  openaiApiKey: string;
  workerCount?: number;
  maxRetries?: number;
  jobTimeout?: number;
}

/**
 * Research service that manages worker threads in the main process
 */
export class ResearchService {
  private workflowManager: LangGraphWorkflowManager | null = null;
  private mainWindow: BrowserWindow | null = null;
  private isInitialized = false;

  constructor() {
    this.setupIpcHandlers();
  }

  /**
   * Set the main window reference for sending updates
   */
  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  /**
   * Initialize the LangGraph workflow manager with API keys
   */
  async initialize(config: ResearchServiceConfig): Promise<boolean> {
    try {
      if (this.workflowManager) {
        await this.workflowManager.shutdown();
      }

      const workflowConfig: LangGraphWorkflowConfig = {
        tavilyApiKey: config.tavilyApiKey,
        openaiApiKey: config.openaiApiKey,
        maxRetries: config.maxRetries || 3,
        jobTimeout: config.jobTimeout || 300000 // 5 minutes
      };

      this.workflowManager = new LangGraphWorkflowManager(workflowConfig);
      this.isInitialized = true;
      
      console.log('LangGraph research service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize LangGraph research service:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Execute a research workflow using LangGraph
   */
  async executeJob(job: WorkerJob): Promise<boolean> {
    if (!this.workflowManager || !this.isInitialized) {
      console.error('LangGraph research service not initialized');
      return false;
    }

    try {
      // Convert job to purpose for LangGraph workflow
      const purpose = job.queries[0] || job.purpose;
      
      await this.workflowManager.executeWorkflow(
        purpose,
        job.id,
        // Progress callback
        (progress: any) => {
          this.sendToRenderer('research-progress', {
            jobId: job.id,
            type: job.type,
            progress: progress.progress,
            status: progress.status,
            estimatedCompletion: progress.estimatedCompletion
          });
        },
        // Complete callback
        (result: WorkerResult) => {
          this.sendToRenderer('research-complete', {
            jobId: job.id,
            type: job.type,
            result
          });
        },
        // Error callback
        (error: string, retryable: boolean) => {
          this.sendToRenderer('research-error', {
            jobId: job.id,
            type: job.type,
            error,
            retryable
          });
        }
      );

      return true;
    } catch (error) {
      console.error(`Failed to execute LangGraph workflow ${job.id}:`, error);
      return false;
    }
  }

  /**
   * Execute multiple workflows in parallel using LangGraph
   */
  async executeJobsParallel(jobs: WorkerJob[]): Promise<boolean> {
    if (!this.workflowManager || !this.isInitialized) {
      console.error('LangGraph research service not initialized');
      return false;
    }

    try {
      await this.workflowManager.executeJobsParallel(
        jobs,
        // Progress callback
        (jobId: string, progress: any) => {
          const job = jobs.find(j => j.id === jobId);
          this.sendToRenderer('research-progress', {
            jobId,
            type: job?.type || 'unknown',
            progress: progress.progress,
            status: progress.status,
            estimatedCompletion: progress.estimatedCompletion
          });
        },
        // Complete callback
        (jobId: string, result: WorkerResult) => {
          const job = jobs.find(j => j.id === jobId);
          this.sendToRenderer('research-complete', {
            jobId,
            type: job?.type || 'unknown',
            result
          });
        },
        // Error callback
        (jobId: string, error: string, retryable: boolean) => {
          const job = jobs.find(j => j.id === jobId);
          this.sendToRenderer('research-error', {
            jobId,
            type: job?.type || 'unknown',
            error,
            retryable
          });
        }
      );

      return true;
    } catch (error) {
      console.error('Failed to execute parallel LangGraph workflows:', error);
      return false;
    }
  }

  /**
   * Get current workflow status
   */
  getWorkflowStatus() {
    if (!this.workflowManager) {
      return {
        initialized: false,
        workflows: [],
        activeWorkflows: []
      };
    }

    return {
      initialized: this.isInitialized,
      workflows: [], // this.workflowManager.getWorkflowStatuses(), // Commented out due to implementation issues
      activeWorkflows: this.workflowManager.getActiveWorkflows()
    };
  }

  /**
   * Cancel a specific workflow
   */
  cancelJob(jobId: string): boolean {
    if (!this.workflowManager) return false;
    return this.workflowManager.cancelWorkflow(jobId);
  }

  /**
   * Shutdown the LangGraph research service
   */
  async shutdown(): Promise<void> {
    if (this.workflowManager) {
      await this.workflowManager.shutdown();
      this.workflowManager = null;
    }
    this.isInitialized = false;
    console.log('LangGraph research service shutdown complete');
  }

  /**
   * Send message to renderer process
   */
  private sendToRenderer(channel: string, data: any): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  /**
   * Setup IPC handlers for communication with renderer
   */
  private setupIpcHandlers(): void {
    // Initialize research service
    ipcMain.handle('research-initialize', async (event, config: ResearchServiceConfig) => {
      return await this.initialize(config);
    });

    // Execute single job
    ipcMain.handle('research-execute-job', async (event, job: WorkerJob) => {
      return await this.executeJob(job);
    });

    // Execute multiple jobs in parallel
    ipcMain.handle('research-execute-jobs-parallel', async (event, jobs: WorkerJob[]) => {
      return await this.executeJobsParallel(jobs);
    });

    // Get workflow status
    ipcMain.handle('research-get-status', async (event) => {
      return this.getWorkflowStatus();
    });

    // Cancel job
    ipcMain.handle('research-cancel-job', async (event, jobId: string) => {
      return this.cancelJob(jobId);
    });

    // Shutdown service
    ipcMain.handle('research-shutdown', async (event) => {
      await this.shutdown();
      return true;
    });
  }
}

// Export singleton instance
export const researchService = new ResearchService(); 