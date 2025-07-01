/**
 * LangGraph Workflow Manager
 * Orchestrates research workflows using LangGraph StateGraph
 * Replaces the traditional worker thread approach with intelligent AI workflow management
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

import { executeResearchWorkflow, type ResearchState, type LangGraphConfig } from './langraph-interface';
import type { WorkerJob, WorkerResult } from './research-worker';

export interface LangGraphWorkflowConfig {
  tavilyApiKey: string;
  openaiApiKey: string;
  maxRetries: number;
  jobTimeout: number; // milliseconds
}

export interface WorkflowProgress {
  sessionId: string;
  currentPhase: string;
  progress: number;
  status: string;
  startTime: Date;
  estimatedCompletion?: Date;
}

export interface WorkflowStatus {
  sessionId: string;
  status: 'idle' | 'running' | 'complete' | 'error';
  currentPhase?: string;
  lastActivity: Date;
  totalStepsCompleted: number;
  errorCount: number;
}

/**
 * Manager for orchestrating research workflows using LangGraph StateGraph
 */
export class LangGraphWorkflowManager {
  private activeWorkflows: Map<string, {
    startTime: Date;
    retryCount: number;
    currentPhase: string;
    completedSteps: string[];
    onProgress?: (progress: WorkflowProgress) => void;
    onComplete?: (result: WorkerResult) => void;
    onError?: (error: string, retryable: boolean) => void;
  }> = new Map();
  
  private config: LangGraphWorkflowConfig;
  private workflowFailureCounts: Map<string, number> = new Map();
  private maxWorkflowFailures = 3;

  constructor(config: LangGraphWorkflowConfig) {
    this.config = config;
  }

  /**
   * Execute a research workflow using LangGraph StateGraph
   */
  async executeWorkflow(
    purpose: string,
    sessionId: string,
    onProgress?: (progress: WorkflowProgress) => void,
    onComplete?: (result: WorkerResult) => void,
    onError?: (error: string, retryable: boolean) => void
  ): Promise<void> {
    console.log(`Starting LangGraph workflow for session: ${sessionId}`);
    
    let progressInterval: NodeJS.Timeout | null = null;
    
    try {
      // Store workflow reference
      this.activeWorkflows.set(sessionId, {
        startTime: new Date(),
        retryCount: 0,
        currentPhase: 'analysis',
        completedSteps: [],
        onProgress,
        onComplete,
        onError
      });

      // Create LangGraph config
      const langGraphConfig: LangGraphConfig = {
        openaiApiKey: this.config.openaiApiKey,
        tavilyApiKey: this.config.tavilyApiKey,
        maxConcurrentResearch: 3,
        timeoutMinutes: 10
      };

      // Set up progress monitoring (would need custom implementation in real scenario)
      // For now, we'll simulate progress updates
      progressInterval = setInterval(() => {
        if (onProgress) {
          const workflowData = this.activeWorkflows.get(sessionId);
          if (workflowData) {
            const progress: WorkflowProgress = {
              sessionId,
              currentPhase: 'research',
              progress: 50,
              status: 'Processing research workflow...',
              startTime: workflowData.startTime
            };
            onProgress(progress);
          }
        }
      }, 2000);

      // Execute the workflow - create proper ResearchState input
      const researchInput = {
        coreProblem: purpose,
        targetOutcome: 'Generate comprehensive research analysis',
        boundaries: 'Focus on expert opinions, contrarian views, and knowledge landscape'
      };
      
      const result = await executeResearchWorkflow(researchInput, langGraphConfig);
      
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      
      // Handle completion
      if (onComplete) {
        const workflowResult: WorkerResult = {
          jobId: sessionId,
          workerId: 'langraph-workflow',
          sources: this.extractSources(result),
          analysis: this.extractAnalysis(result),
          generatedContent: this.extractGeneratedContent(result),
          metadata: {
            searchTime: Date.now() - (this.activeWorkflows.get(sessionId)?.startTime.getTime() || Date.now()),
            analysisTime: 0,
            totalApiCalls: 0,
            credibilityScore: 8.5
          }
        };
        onComplete(workflowResult);
      }

      // Clean up
      this.activeWorkflows.delete(sessionId);
      
    } catch (error) {
      console.error(`LangGraph workflow failed for session ${sessionId}:`, error);
      
      // Clear the progress interval to prevent continued execution
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      
      const workflowData = this.activeWorkflows.get(sessionId);
      if (workflowData && onError) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const retryable = workflowData.retryCount < this.config.maxRetries;
        
        if (retryable) {
          workflowData.retryCount++;
          this.workflowFailureCounts.set(sessionId, (this.workflowFailureCounts.get(sessionId) || 0) + 1);
        }
        
        onError(errorMessage, retryable);
      }
      
      // Clean up failed workflow
      this.activeWorkflows.delete(sessionId);
    }
  }

  /**
   * Execute multiple research jobs in parallel using LangGraph workflows
   */
  async executeJobsParallel(
    jobs: WorkerJob[],
    onProgress?: (jobId: string, progress: WorkflowProgress) => void,
    onComplete?: (jobId: string, result: WorkerResult) => void,
    onError?: (jobId: string, error: string, retryable: boolean) => void
  ): Promise<void> {
    const workflows = jobs.map(job => 
      this.executeWorkflow(
        job.queries[0] || job.purpose, // Use first query or purpose
        job.id,
        onProgress ? (progress) => onProgress(job.id, progress) : undefined,
        onComplete ? (result) => onComplete(job.id, result) : undefined,
        onError ? (error, retryable) => onError(job.id, error, retryable) : undefined
      )
    );

    await Promise.allSettled(workflows);
  }

  /**
   * Get status of all active workflows
   */
  getWorkflowStatuses(): WorkflowStatus[] {
    return Array.from(this.activeWorkflows.entries()).map(([sessionId, data]) => ({
      sessionId,
      status: 'running',
      currentPhase: data.currentPhase,
      lastActivity: new Date(), // Would track actual last activity in real implementation
      totalStepsCompleted: data.completedSteps.length,
      errorCount: this.workflowFailureCounts.get(sessionId) || 0
    }));
  }

  /**
   * Get list of active workflow session IDs
   */
  getActiveWorkflows(): string[] {
    return Array.from(this.activeWorkflows.keys());
  }

  /**
   * Cancel a running workflow
   */
  cancelWorkflow(sessionId: string): boolean {
    const workflowData = this.activeWorkflows.get(sessionId);
    if (workflowData) {
      // In a real implementation, we'd call workflow.cancel() or similar
      this.activeWorkflows.delete(sessionId);
      console.log(`Workflow ${sessionId} cancelled`);
      return true;
    }
    return false;
  }

  /**
   * Shutdown all active workflows
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down LangGraph workflow manager...');
    
    // Cancel all active workflows
    for (const sessionId of Array.from(this.activeWorkflows.keys())) {
      this.cancelWorkflow(sessionId);
    }
    
    this.activeWorkflows.clear();
    this.workflowFailureCounts.clear();
    
    console.log('LangGraph workflow manager shutdown complete');
  }

  /**
   * Extract sources from workflow result
   */
  private extractSources(result: any): any[] {
    const sources: any[] = [];
    
    // Extract from expert results
    if (result.expertResults) {
      result.expertResults.forEach((expertResult: any) => {
        if (expertResult.sources) {
          sources.push(...expertResult.sources);
        }
      });
    }
    
    // Extract from spiky results
    if (result.spikyResults) {
      result.spikyResults.forEach((spikyResult: any) => {
        if (spikyResult.sources) {
          sources.push(...spikyResult.sources);
        }
      });
    }
    
    // Extract from knowledge results
    if (result.knowledgeResults) {
      result.knowledgeResults.forEach((knowledgeResult: any) => {
        if (knowledgeResult.sources) {
          sources.push(...knowledgeResult.sources);
        }
      });
    }
    
    return sources;
  }

  /**
   * Extract analysis from workflow result
   */
  private extractAnalysis(result: any): string {
    const analyses: string[] = [];
    
    if (result.expertResults) {
      result.expertResults.forEach((expertResult: any) => {
        if (expertResult.analysis) {
          analyses.push(`**Expert Analysis:** ${expertResult.analysis}`);
        }
      });
    }
    
    if (result.spikyResults) {
      result.spikyResults.forEach((spikyResult: any) => {
        if (spikyResult.analysis) {
          analyses.push(`**Contrarian Perspective:** ${spikyResult.analysis}`);
        }
      });
    }
    
    if (result.knowledgeResults) {
      result.knowledgeResults.forEach((knowledgeResult: any) => {
        if (knowledgeResult.analysis) {
          analyses.push(`**Knowledge Tree:** ${knowledgeResult.analysis}`);
        }
      });
    }
    
    return analyses.join('\n\n');
  }

  /**
   * Extract generated content from workflow result
   */
  private extractGeneratedContent(result: any): string {
    const content: string[] = [];
    
    if (result.expertResults) {
      result.expertResults.forEach((expertResult: any) => {
        if (expertResult.generatedContent) {
          content.push(expertResult.generatedContent);
        }
      });
    }
    
    if (result.spikyResults) {
      result.spikyResults.forEach((spikyResult: any) => {
        if (spikyResult.generatedContent) {
          content.push(spikyResult.generatedContent);
        }
      });
    }
    
    if (result.knowledgeResults) {
      result.knowledgeResults.forEach((knowledgeResult: any) => {
        if (knowledgeResult.generatedContent) {
          content.push(knowledgeResult.generatedContent);
        }
      });
    }
    
    return content.join('\n\n---\n\n');
  }

  /**
   * Get human-readable status for a workflow phase
   */
  private getPhaseStatus(phase: string): string {
    const phaseStatusMap: Record<string, string> = {
      analysis: 'Analyzing research purpose and scope...',
      planning: 'Planning research strategy...',
      research: 'Executing research across multiple domains...',
      synthesis: 'Synthesizing research findings...',
      complete: 'Research workflow complete!'
    };
    
    return phaseStatusMap[phase] || `Processing ${phase}...`;
  }

  /**
   * Calculate estimated completion time based on progress
   */
  private calculateEstimatedCompletion(startTime: Date, progress: number): Date | undefined {
    if (progress <= 0) return undefined;
    
    const elapsed = Date.now() - startTime.getTime();
    const estimatedTotal = (elapsed / progress) * 100;
    const remaining = estimatedTotal - elapsed;
    
    return new Date(Date.now() + remaining);
  }
} 