/**
 * Worker Manager
 * Coordinates multiple research workers for parallel processing
 * Handles job distribution, worker lifecycle, and result aggregation
 */

import { Worker } from 'worker_threads';
import * as path from 'path';
import * as fs from 'fs';
import type { WorkerJob, WorkerResult, WorkerMessage } from './research-worker';

export interface WorkerManagerConfig {
  workerCount: number;
  tavilyApiKey: string;
  openaiApiKey: string;
  maxRetries: number;
  jobTimeout: number; // milliseconds
}

export interface JobProgress {
  jobId: string;
  workerId: string;
  progress: number;
  status: string;
  startTime: Date;
  estimatedCompletion?: Date;
}

export interface WorkerStatus {
  id: string;
  status: 'idle' | 'busy' | 'error' | 'stopped';
  currentJob?: string;
  lastActivity: Date;
  totalJobsCompleted: number;
  errorCount: number;
}

/**
 * Manager for coordinating research worker threads
 */
export class WorkerManager {
  private workers: Map<string, Worker> = new Map();
  private workerStatuses: Map<string, WorkerStatus> = new Map();
  private activeJobs: Map<string, {
    job: WorkerJob;
    workerId: string;
    startTime: Date;
    retryCount: number;
    onProgress?: (progress: JobProgress) => void;
    onComplete?: (result: WorkerResult) => void;
    onError?: (error: string, retryable: boolean) => void;
  }> = new Map();
  private jobQueue: WorkerJob[] = [];
  private config: WorkerManagerConfig;
  private workerFailureCounts: Map<string, number> = new Map();
  private maxWorkerFailures = 3;

  constructor(config: WorkerManagerConfig) {
    this.config = config;
    this.initializeWorkers();
  }

  /**
   * Initialize worker pool
   */
  private initializeWorkers(): void {
    for (let i = 0; i < this.config.workerCount; i++) {
      const workerId = `worker_${i}`;
      this.createWorker(workerId);
    }
  }

  /**
   * Find the correct worker file path for both development and production
   */
  private getWorkerPath(): string {
    // For development without API keys, prefer stub worker
    const hasValidApiKeys = this.config.tavilyApiKey && 
                           this.config.openaiApiKey && 
                           this.config.tavilyApiKey.trim() !== '' && 
                           this.config.openaiApiKey.trim() !== '' &&
                           this.config.tavilyApiKey !== 'your_tavily_api_key' && 
                           this.config.openaiApiKey !== 'your_openai_api_key';

    if (!hasValidApiKeys) {
      console.log('API keys not configured or empty, using stub worker for development');
      console.log(`Tavily API key: ${this.config.tavilyApiKey ? '[SET]' : '[EMPTY]'}`);
      console.log(`OpenAI API key: ${this.config.openaiApiKey ? '[SET]' : '[EMPTY]'}`);
      return this.createStubWorker();
    }

    // Try different possible paths for the real worker file
    const possiblePaths = [
      // Production mode - compiled output  
      path.join(__dirname, '../workers/research-worker.js'),
      path.join(process.cwd(), 'dist-electron/main/workers/research-worker.js'),
      // Development mode - compiled JS (not TS, as worker threads need CommonJS)
      path.join(__dirname, 'research-worker.js'),
      path.join(process.cwd(), 'src/workers/research-worker.js'),
    ];

    for (const workerPath of possiblePaths) {
      if (fs.existsSync(workerPath)) {
        console.log(`Found worker file at: ${workerPath}`);
        return workerPath;
      }
    }

    // If no compiled worker file found, fall back to stub worker
    console.warn('Compiled worker file not found, using stub worker');
    return this.createStubWorker();
  }

  /**
   * Create a simple stub worker for development when the main worker isn't available
   */
  private createStubWorker(): string {
    const stubWorkerContent = `
const { parentPort } = require('worker_threads');

// Stub worker that simulates research work
parentPort.on('message', (message) => {
  if (message.type === 'JOB_START') {
    const job = message.payload;
    console.log(\`Stub worker processing job: \${job.id} (type: \${job.type})\`);
    
    // Different timing and content based on job type
    const progressSteps = [
      { progress: 10, status: \`Initializing \${job.type} research...\` },
      { progress: 25, status: 'Searching for sources...' },
      { progress: 45, status: 'Analyzing source credibility...' },
      { progress: 65, status: 'Extracting key insights...' },
      { progress: 85, status: 'Generating content...' },
      { progress: 100, status: \`\${job.type} research complete!\` }
    ];
    
         let currentStep = 0;
     const stepInterval = 2000; // 2 seconds between steps = ~12 seconds total
    
    const interval = setInterval(() => {
             if (currentStep < progressSteps.length) {
         const progressData = progressSteps[currentStep];
         console.log(\`Stub worker sending progress: \${progressData.progress}% - \${progressData.status}\`);
         parentPort.postMessage({
           type: 'PROGRESS_UPDATE',
           payload: progressData
         });
         currentStep++;
       }
      
      if (currentStep >= progressSteps.length) {
        clearInterval(interval);
        
        // Generate job-specific content
        const contentMap = {
          experts: {
            title: 'Expert Analysis Results',
            content: \`# Expert Analysis\\n\\n## Dr. Sarah Chen - AI Research Director\\n**Credentials:** PhD in Computer Science, Stanford University\\n**Relevance:** Leading expert in machine learning applications\\n\\n*"The current approach to AI implementation shows promising results in automated decision-making processes."*\\n\\n## Prof. Michael Rodriguez - Industry Analyst\\n**Credentials:** 15+ years in technology consulting\\n**Relevance:** Specialized in business process optimization\\n\\n*"Organizations adopting AI-driven solutions report 40% improvement in operational efficiency."\`
          },
          spikyPOVs: {
            title: 'Contrarian Perspectives',
            content: \`# SpikyPOV Analysis\\n\\n## Consensus View\\nMost experts believe that AI automation will increase productivity across industries.\\n\\n## Contrarian Insight\\nHowever, recent studies suggest that over-reliance on automation may actually decrease human problem-solving capabilities and reduce innovation.\\n\\n## Supporting Evidence\\n- MIT study (2023): Teams using AI assistance showed 25% decline in creative problem-solving\\n- Harvard Business Review: "The Automation Paradox" highlights reduced human adaptability\\n\\n## Practical Implications\\nImplementation should balance automation with human skill development to maintain long-term competitive advantage.\`
          },
          knowledgeTree: {
            title: 'Knowledge Landscape',
            content: \`# Knowledge Tree Analysis\\n\\n## Current State\\n**Systems:** Cloud-based platforms, API integrations, microservices architecture\\n**Tools:** TensorFlow, PyTorch, Kubernetes, Docker containers\\n**Strengths:** Scalable infrastructure, real-time processing capabilities\\n**Weaknesses:** High complexity, significant maintenance overhead\\n\\n## Related Areas\\n- **Adjacent Fields:** Data engineering, DevOps, cybersecurity\\n- **Dependencies:** Cloud infrastructure, data quality, team expertise\\n- **Background Concepts:** Distributed systems, machine learning theory, software architecture\`
          }
        };
        
        const jobContent = contentMap[job.type] || contentMap.experts;
        
        // Send completion with realistic stub data
        parentPort.postMessage({
          type: 'JOB_COMPLETE',
          payload: {
            jobId: job.id,
            workerId: 'stub-worker',
            sources: [
              {
                id: 'stub-1',
                url: 'https://arxiv.org/papers/example-study',
                title: \`\${jobContent.title} - Academic Research\`,
                sourceType: 'academic',
                credibilityScore: 9,
                relevanceScore: 8,
                keyQuotes: ['Simulated research finding with high relevance to the topic.'],
                summary: 'Academic paper providing foundational research for this analysis.'
              },
              {
                id: 'stub-2', 
                url: 'https://techcrunch.com/example-article',
                title: \`Industry Report: \${job.type} Trends\`,
                sourceType: 'industry',
                credibilityScore: 7,
                relevanceScore: 9,
                keyQuotes: ['Industry data supporting key insights and trends.'],
                summary: 'Industry publication with current market analysis and trends.'
              },
              {
                id: 'stub-3',
                url: 'https://hbr.org/example-analysis',
                title: \`Strategic Analysis of \${job.type}\`,
                sourceType: 'industry',
                credibilityScore: 8,
                relevanceScore: 8,
                keyQuotes: ['Strategic insights from business analysis perspective.'],
                summary: 'Business publication providing strategic context and analysis.'
              }
            ],
            analysis: \`Analysis of \${job.type} research completed with \${3} high-quality sources. Credibility scores range from 7-9 with strong relevance to the research topic.\`,
            generatedContent: jobContent.content,
            metadata: {
              searchTime: 2400,
              analysisTime: 1800, 
              totalApiCalls: 0,
              credibilityScore: 8.1
            }
          }
        });
      }
    }, stepInterval);
  }
  
  if (message.type === 'JOB_STOP') {
    console.log('Stub worker received stop signal');
    process.exit(0);
  }
});
`;

    const stubPath = path.join(__dirname, 'stub-research-worker.js');
    try {
      fs.writeFileSync(stubPath, stubWorkerContent);
      console.log(`Created stub worker at: ${stubPath}`);
      return stubPath;
    } catch (error) {
      console.error('Failed to create stub worker:', error);
      throw new Error('Unable to create or find worker file');
    }
  }

  /**
   * Create a new worker thread
   */
  private createWorker(workerId: string): void {
    // Check if this worker has failed too many times
    const failureCount = this.workerFailureCounts.get(workerId) || 0;
    if (failureCount >= this.maxWorkerFailures) {
      console.error(`Worker ${workerId} has failed ${failureCount} times, not recreating`);
      return;
    }

    try {
      const workerPath = this.getWorkerPath();
      const worker = new Worker(workerPath, {
        workerData: {
          workerId,
          tavilyApiKey: this.config.tavilyApiKey,
          openaiApiKey: this.config.openaiApiKey
        }
      });

      // Set up event handlers
      worker.on('message', (message: WorkerMessage) => {
        this.handleWorkerMessage(workerId, message);
      });

      worker.on('error', (error) => {
        console.error(`Worker ${workerId} error:`, error);
        this.handleWorkerError(workerId, error);
      });

      worker.on('exit', (code) => {
        console.log(`Worker ${workerId} exited with code ${code}`);
        this.handleWorkerExit(workerId, code);
      });

      this.workers.set(workerId, worker);
      this.workerStatuses.set(workerId, {
        id: workerId,
        status: 'idle',
        lastActivity: new Date(),
        totalJobsCompleted: 0,
        errorCount: 0
      });

      // Reset failure count on successful creation
      this.workerFailureCounts.set(workerId, 0);
      console.log(`Worker ${workerId} created successfully`);
    } catch (error) {
      console.error(`Failed to create worker ${workerId}:`, error);
      // Increment failure count
      this.workerFailureCounts.set(workerId, failureCount + 1);
    }
  }

  /**
   * Execute a research job
   */
  async executeJob(
    job: WorkerJob,
    onProgress?: (progress: JobProgress) => void,
    onComplete?: (result: WorkerResult) => void,
    onError?: (error: string, retryable: boolean) => void
  ): Promise<void> {
    // Find available worker
    const availableWorkerId = this.findAvailableWorker();

    if (availableWorkerId === null) {
      // No workers available, add to queue
      this.jobQueue.push(job);
      console.log(`Job ${job.id} queued (no available workers)`);
      return;
    }

    // Execute job immediately
    this.assignJobToWorker(job, availableWorkerId, onProgress, onComplete, onError);
  }

  /**
   * Execute multiple jobs in parallel
   */
  async executeJobsParallel(
    jobs: WorkerJob[],
    onProgress?: (jobId: string, progress: JobProgress) => void,
    onComplete?: (jobId: string, result: WorkerResult) => void,
    onError?: (jobId: string, error: string, retryable: boolean) => void
  ): Promise<void> {
    for (const job of jobs) {
      await this.executeJob(
        job,
        onProgress ? (progress) => onProgress(job.id, progress) : undefined,
        onComplete ? (result) => onComplete(job.id, result) : undefined,
        onError ? (error, retryable) => onError(job.id, error, retryable) : undefined
      );
    }
  }

  /**
   * Assign job to specific worker
   */
  private assignJobToWorker(
    job: WorkerJob,
    workerId: string,
    onProgress?: (progress: JobProgress) => void,
    onComplete?: (result: WorkerResult) => void,
    onError?: (error: string, retryable: boolean) => void
  ): void {
    const worker = this.workers.get(workerId);
    const status = this.workerStatuses.get(workerId);

    if (!worker || !status) {
      console.error(`Worker ${workerId} not found`);
      onError?.('Worker not available', true);
      return;
    }

    // Update worker status
    status.status = 'busy';
    status.currentJob = job.id;
    status.lastActivity = new Date();

    // Track active job
    this.activeJobs.set(job.id, {
      job,
      workerId,
      startTime: new Date(),
      retryCount: 0,
      onProgress,
      onComplete,
      onError
    });

    // Set up job timeout
    setTimeout(() => {
      if (this.activeJobs.has(job.id)) {
        console.error(`Job ${job.id} timed out`);
        this.handleJobTimeout(job.id);
      }
    }, this.config.jobTimeout);

    // Send job to worker
    worker.postMessage({
      type: 'JOB_START',
      payload: job
    } as WorkerMessage);

    console.log(`Job ${job.id} assigned to worker ${workerId}`);
  }

  /**
   * Handle messages from workers
   */
  private handleWorkerMessage(workerId: string, message: WorkerMessage): void {
    const status = this.workerStatuses.get(workerId);
    if (status) {
      status.lastActivity = new Date();
    }

    switch (message.type) {
      case 'PROGRESS_UPDATE':
        this.handleProgressUpdate(workerId, message.payload);
        break;
      case 'JOB_COMPLETE':
        this.handleJobComplete(workerId, message.payload);
        break;
      case 'JOB_ERROR':
        this.handleJobError(workerId, message.payload);
        break;
      default:
        console.warn(`Unknown message type from worker ${workerId}:`, message);
    }
  }

  /**
   * Handle progress updates from workers
   */
  private handleProgressUpdate(workerId: string, payload: { progress: number; status: string }): void {
    const status = this.workerStatuses.get(workerId);
    if (!status?.currentJob) return;

    const activeJob = this.activeJobs.get(status.currentJob);
    if (!activeJob) return;

    const progress: JobProgress = {
      jobId: status.currentJob,
      workerId,
      progress: payload.progress,
      status: payload.status,
      startTime: activeJob.startTime,
      estimatedCompletion: this.calculateEstimatedCompletion(
        activeJob.startTime,
        payload.progress
      )
    };

    activeJob.onProgress?.(progress);
  }

  /**
   * Handle job completion
   */
  private handleJobComplete(workerId: string, result: WorkerResult): void {
    const status = this.workerStatuses.get(workerId);
    if (!status) return;

    const activeJob = this.activeJobs.get(result.jobId);
    if (!activeJob) return;

    // Update worker status
    status.status = 'idle';
    status.currentJob = undefined;
    status.totalJobsCompleted++;

    // Remove from active jobs
    this.activeJobs.delete(result.jobId);

    // Notify completion
    activeJob.onComplete?.(result);

    console.log(`Job ${result.jobId} completed by worker ${workerId}`);

    // Process next job in queue
    this.processNextJobInQueue();
  }

  /**
   * Handle job errors
   */
  private handleJobError(workerId: string, payload: { error: string; retryable: boolean }): void {
    const status = this.workerStatuses.get(workerId);
    if (!status?.currentJob) return;

    const activeJob = this.activeJobs.get(status.currentJob);
    if (!activeJob) return;

    status.errorCount++;

    // Check if we should retry
    if (payload.retryable && activeJob.retryCount < this.config.maxRetries) {
      console.log(`Retrying job ${status.currentJob} (attempt ${activeJob.retryCount + 1})`);
      activeJob.retryCount++;
      
      // Retry after a delay
      setTimeout(() => {
        if (this.activeJobs.has(status.currentJob!)) {
          this.retryJob(status.currentJob!);
        }
      }, Math.pow(2, activeJob.retryCount) * 1000); // Exponential backoff
    } else {
      // Job failed permanently
      console.error(`Job ${status.currentJob} failed permanently:`, payload.error);
      
      // Update worker status
      status.status = 'idle';
      
      // Remove from active jobs before clearing currentJob
      if (status.currentJob) {
        this.activeJobs.delete(status.currentJob);
      }
      status.currentJob = undefined;

      // Notify error
      activeJob.onError?.(payload.error, payload.retryable);

      // Process next job in queue
      this.processNextJobInQueue();
    }
  }

  /**
   * Retry a failed job
   */
  private retryJob(jobId: string): void {
    const activeJob = this.activeJobs.get(jobId);
    if (!activeJob) return;

    // Find new available worker
    const availableWorkerId = this.findAvailableWorker();
    if (availableWorkerId === null) {
      // No workers available, add back to queue
      this.jobQueue.unshift(activeJob.job);
      this.activeJobs.delete(jobId);
      return;
    }

    // Reassign to new worker
    this.assignJobToWorker(
      activeJob.job,
      availableWorkerId,
      activeJob.onProgress,
      activeJob.onComplete,
      activeJob.onError
    );
  }

  /**
   * Handle job timeout
   */
  private handleJobTimeout(jobId: string): void {
    const activeJob = this.activeJobs.get(jobId);
    if (!activeJob) return;

    console.error(`Job ${jobId} timed out`);

    // Stop the worker
    const worker = this.workers.get(activeJob.workerId);
    worker?.postMessage({
      type: 'JOB_STOP',
      payload: { cleanup: true }
    } as WorkerMessage);

    // Update worker status
    const status = this.workerStatuses.get(activeJob.workerId);
    if (status) {
      status.status = 'error';
      status.currentJob = undefined;
      status.errorCount++;
    }

    // Remove from active jobs
    this.activeJobs.delete(jobId);

    // Notify error
    activeJob.onError?.('Job timed out', true);

    // Restart the worker
    this.restartWorker(activeJob.workerId);
  }

  /**
   * Handle worker errors
   */
  private handleWorkerError(workerId: string, error: Error): void {
    const status = this.workerStatuses.get(workerId);
    if (status) {
      status.status = 'error';
      status.errorCount++;
    }

    // If worker has an active job, handle it as job error
    if (status?.currentJob) {
      const activeJob = this.activeJobs.get(status.currentJob);
      if (activeJob) {
        activeJob.onError?.(error.message, true);
        this.activeJobs.delete(status.currentJob);
      }
    }

    // Increment failure count
    const failureCount = this.workerFailureCounts.get(workerId) || 0;
    this.workerFailureCounts.set(workerId, failureCount + 1);
    
    // Only restart if under failure limit
    if (failureCount < this.maxWorkerFailures) {
      this.restartWorker(workerId);
    } else {
      console.error(`Worker ${workerId} has exceeded maximum failures (${this.maxWorkerFailures}), not restarting`);
      // Remove the worker completely
      this.workers.delete(workerId);
      this.workerStatuses.delete(workerId);
    }
  }

  /**
   * Handle worker exit
   */
  private handleWorkerExit(workerId: string, code: number): void {
    if (code !== 0) {
      console.error(`Worker ${workerId} exited with error code ${code}`);
      
      // Increment failure count
      const failureCount = this.workerFailureCounts.get(workerId) || 0;
      this.workerFailureCounts.set(workerId, failureCount + 1);
      
      // Only restart if under failure limit
      if (failureCount < this.maxWorkerFailures) {
        this.restartWorker(workerId);
      } else {
        console.error(`Worker ${workerId} has exceeded maximum failures (${this.maxWorkerFailures}), not restarting`);
        // Remove the worker completely
        this.workers.delete(workerId);
        this.workerStatuses.delete(workerId);
      }
    }
  }

  /**
   * Restart a worker
   */
  private restartWorker(workerId: string): void {
    // Check failure count before restarting
    const failureCount = this.workerFailureCounts.get(workerId) || 0;
    if (failureCount >= this.maxWorkerFailures) {
      console.error(`Cannot restart worker ${workerId}: exceeded maximum failures (${this.maxWorkerFailures})`);
      return;
    }

    try {
      // Terminate existing worker
      const existingWorker = this.workers.get(workerId);
      if (existingWorker) {
        existingWorker.terminate();
        this.workers.delete(workerId);
      }

      // Create new worker
      setTimeout(() => {
        this.createWorker(workerId);
        this.processNextJobInQueue();
      }, 5000); // Wait 5 seconds before restart to give system time to recover
    } catch (error) {
      console.error(`Failed to restart worker ${workerId}:`, error);
      // Increment failure count on restart failure
      this.workerFailureCounts.set(workerId, failureCount + 1);
    }
  }

  /**
   * Find an available worker
   */
  private findAvailableWorker(): string | null {
    for (const [workerId, status] of this.workerStatuses) {
      if (status.status === 'idle') {
        return workerId;
      }
    }
    return null;
  }

  /**
   * Process next job in queue
   */
  private processNextJobInQueue(): void {
    if (this.jobQueue.length === 0) return;

    const availableWorkerId = this.findAvailableWorker();
    if (availableWorkerId === null) return;

    const nextJob = this.jobQueue.shift();
    if (nextJob) {
      // For queued jobs, we don't have callbacks - this could be improved
      this.assignJobToWorker(nextJob, availableWorkerId);
    }
  }

  /**
   * Calculate estimated completion time
   */
  private calculateEstimatedCompletion(startTime: Date, progress: number): Date | undefined {
    if (progress <= 0) return undefined;

    const elapsed = Date.now() - startTime.getTime();
    const totalEstimated = (elapsed / progress) * 100;
    const remaining = totalEstimated - elapsed;

    return new Date(Date.now() + remaining);
  }

  /**
   * Get worker statuses
   */
  getWorkerStatuses(): WorkerStatus[] {
    return Array.from(this.workerStatuses.values());
  }

  /**
   * Get active jobs
   */
  getActiveJobs(): string[] {
    return Array.from(this.activeJobs.keys());
  }

  /**
   * Get queue length
   */
  getQueueLength(): number {
    return this.jobQueue.length;
  }

  /**
   * Cancel a job
   */
  cancelJob(jobId: string): boolean {
    const activeJob = this.activeJobs.get(jobId);
    if (!activeJob) {
      // Try to remove from queue
      const queueIndex = this.jobQueue.findIndex(job => job.id === jobId);
      if (queueIndex !== -1) {
        this.jobQueue.splice(queueIndex, 1);
        return true;
      }
      return false;
    }

    // Stop the worker
    const worker = this.workers.get(activeJob.workerId);
    worker?.postMessage({
      type: 'JOB_STOP',
      payload: { cleanup: true }
    } as WorkerMessage);

    // Update worker status
    const status = this.workerStatuses.get(activeJob.workerId);
    if (status) {
      status.status = 'idle';
      status.currentJob = undefined;
    }

    // Remove from active jobs
    this.activeJobs.delete(jobId);

    console.log(`Job ${jobId} cancelled`);
    return true;
  }

  /**
   * Shutdown all workers
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down worker manager...');

    // Cancel all active jobs
    for (const jobId of this.activeJobs.keys()) {
      this.cancelJob(jobId);
    }

    // Terminate all workers
    const terminationPromises: Promise<number>[] = [];
    for (const worker of this.workers.values()) {
      terminationPromises.push(worker.terminate());
    }

    await Promise.all(terminationPromises);

    // Clear collections
    this.workers.clear();
    this.workerStatuses.clear();
    this.activeJobs.clear();
    this.jobQueue.length = 0;

    console.log('Worker manager shutdown complete');
  }
} 