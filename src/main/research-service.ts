/**
 * Research Service for Main Process
 * Manages worker threads and handles research workflow execution
 * Communicates with renderer process via IPC
 */

import { ipcMain, BrowserWindow } from 'electron';
import { WorkerManager, type WorkerManagerConfig } from '../workers/worker-manager';
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
  private workerManager: WorkerManager | null = null;
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
   * Initialize the worker manager with API keys
   */
  async initialize(config: ResearchServiceConfig): Promise<boolean> {
    try {
      if (this.workerManager) {
        await this.workerManager.shutdown();
      }

      const workerConfig: WorkerManagerConfig = {
        workerCount: config.workerCount || 3,
        tavilyApiKey: config.tavilyApiKey,
        openaiApiKey: config.openaiApiKey,
        maxRetries: config.maxRetries || 3,
        jobTimeout: config.jobTimeout || 300000 // 5 minutes
      };

      this.workerManager = new WorkerManager(workerConfig);
      this.isInitialized = true;
      
      console.log('Research service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize research service:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Execute a research job
   */
  async executeJob(job: WorkerJob): Promise<boolean> {
    if (!this.workerManager || !this.isInitialized) {
      console.error('Research service not initialized');
      return false;
    }

    try {
      await this.workerManager.executeJob(
        job,
        // Progress callback
        (progress) => {
          this.sendToRenderer('research-progress', {
            jobId: job.id,
            type: job.type,
            progress: progress.progress,
            status: progress.status,
            estimatedCompletion: progress.estimatedCompletion
          });
        },
        // Complete callback
        (result) => {
          this.sendToRenderer('research-complete', {
            jobId: job.id,
            type: job.type,
            result
          });
        },
        // Error callback
        (error, retryable) => {
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
      console.error(`Failed to execute job ${job.id}:`, error);
      return false;
    }
  }

  /**
   * Execute multiple jobs in parallel
   */
  async executeJobsParallel(jobs: WorkerJob[]): Promise<boolean> {
    if (!this.workerManager || !this.isInitialized) {
      console.error('Research service not initialized');
      return false;
    }

    try {
      await this.workerManager.executeJobsParallel(
        jobs,
        // Progress callback
        (jobId, progress) => {
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
        (jobId, result) => {
          const job = jobs.find(j => j.id === jobId);
          this.sendToRenderer('research-complete', {
            jobId,
            type: job?.type || 'unknown',
            result
          });
        },
        // Error callback
        (jobId, error, retryable) => {
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
      console.error('Failed to execute parallel jobs:', error);
      return false;
    }
  }

  /**
   * Get current worker status
   */
  getWorkerStatus() {
    if (!this.workerManager) {
      return {
        initialized: false,
        workers: [],
        activeJobs: [],
        queueLength: 0
      };
    }

    return {
      initialized: this.isInitialized,
      workers: this.workerManager.getWorkerStatuses(),
      activeJobs: this.workerManager.getActiveJobs(),
      queueLength: this.workerManager.getQueueLength()
    };
  }

  /**
   * Cancel a specific job
   */
  cancelJob(jobId: string): boolean {
    if (!this.workerManager) return false;
    return this.workerManager.cancelJob(jobId);
  }

  /**
   * Shutdown the research service
   */
  async shutdown(): Promise<void> {
    if (this.workerManager) {
      await this.workerManager.shutdown();
      this.workerManager = null;
    }
    this.isInitialized = false;
    console.log('Research service shutdown complete');
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

    // Get worker status
    ipcMain.handle('research-get-status', async (event) => {
      return this.getWorkerStatus();
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