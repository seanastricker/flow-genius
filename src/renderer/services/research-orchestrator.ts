/**
 * Research Orchestration Service
 * 
 * Manages the actual research workflows using real API integrations.
 * Coordinates between UI, worker threads, and data stores to execute
 * parallel research for Experts, SpikyPOVs, and Knowledge Tree sections.
 */

import { TavilyClient } from './api/tavily-client';
import { OpenAIClient } from './api/openai-client';
import { useDocumentStore } from '../stores/document-store';

export interface ResearchJob {
  id: string;
  type: 'experts' | 'spikyPOVs' | 'knowledgeTree';
  documentId: string;
  purpose: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  startTime?: Date;
  completedTime?: Date;
  errorMessage?: string;
  result?: ResearchResult;
}

export interface ResearchResult {
  sources: ResearchSource[];
  generatedContent: string;
  analysis: string;
  metadata: {
    searchTime: number;
    analysisTime: number;
    totalApiCalls: number;
    credibilityScore: number;
  };
}

export interface ResearchSource {
  id: string;
  url: string;
  title: string;
  author?: string;
  publishDate?: string;
  sourceType: 'academic' | 'industry' | 'news' | 'blog' | 'other';
  credibilityScore: number;
  relevanceScore: number;
  keyQuotes: string[];
  summary: string;
  tavilyMetadata?: any;
}

/**
 * Main Research Orchestration Service
 */
export class ResearchOrchestrator {
  private tavilyClient: TavilyClient | null = null;
  private openaiClient: OpenAIClient;
  private activeJobs = new Map<string, ResearchJob>();
  private jobQueue: ResearchJob[] = [];
  private maxConcurrentJobs = 3;

  constructor() {
    this.openaiClient = new OpenAIClient();
    this.initializeClients();
  }

  /**
   * Initialize API clients from environment
   */
  private initializeClients(): void {
    // Initialize Tavily client
    this.tavilyClient = TavilyClient.fromEnvironment();
    
    // OpenAI client should already be initialized from environment
    if (!this.openaiClient.isReady()) {
      console.warn('OpenAI client not ready. Research may not work properly.');
    }
  }

  /**
   * Start research for all sections of a document
   */
  async startResearch(documentId: string, purpose: string): Promise<void> {
    console.log(`🔬 Starting research for document: ${documentId}`);
    
    if (!this.tavilyClient || !this.openaiClient.isReady()) {
      throw new Error('API clients not properly initialized. Please check your API keys.');
    }

    // Create jobs for each research type
    const jobs: ResearchJob[] = [
      {
        id: `experts_${documentId}_${Date.now()}`,
        type: 'experts',
        documentId,
        purpose,
        status: 'pending',
        progress: 0
      },
      {
        id: `spikyPOVs_${documentId}_${Date.now()}`,
        type: 'spikyPOVs',
        documentId,
        purpose,
        status: 'pending',
        progress: 0
      },
      {
        id: `knowledgeTree_${documentId}_${Date.now()}`,
        type: 'knowledgeTree',
        documentId,
        purpose,
        status: 'pending',
        progress: 0
      }
    ];

    // Queue all jobs
    jobs.forEach(job => {
      this.jobQueue.push(job);
      this.activeJobs.set(job.id, job);
    });

    // Document store is already updated with research-active status
    console.log(`📊 Queued ${jobs.length} research jobs for document: ${documentId}`);

    // Start processing jobs
    await this.processJobQueue();
  }

  /**
   * Process the job queue with concurrency control
   */
  private async processJobQueue(): Promise<void> {
    const promises: Promise<void>[] = [];

    while (this.jobQueue.length > 0 && promises.length < this.maxConcurrentJobs) {
      const job = this.jobQueue.shift();
      if (job) {
        promises.push(this.executeJob(job));
      }
    }

    if (promises.length > 0) {
      await Promise.allSettled(promises);
      
      // Continue processing if there are more jobs
      if (this.jobQueue.length > 0) {
        await this.processJobQueue();
      }
    }
  }

  /**
   * Execute a single research job
   */
  private async executeJob(job: ResearchJob): Promise<void> {
    console.log(`🚀 Starting ${job.type} research job: ${job.id}`);
    
    try {
      // Update job status
      job.status = 'running';
      job.startTime = new Date();
      this.updateJobProgress(job, 10, `Starting ${job.type} research...`);

      // Generate search queries
      const queries = this.generateQueries(job.purpose, job.type);
      this.updateJobProgress(job, 20, 'Generated search queries...');

      // Search for sources
      const sources = await this.searchForSources(job.type, queries, job.purpose);
      this.updateJobProgress(job, 60, `Found ${sources.length} sources...`);

      // Generate content
      const content = await this.generateContent(job.type, sources, job.purpose);
      this.updateJobProgress(job, 90, 'Generating final content...');

      // Create result
      const result: ResearchResult = {
        sources,
        generatedContent: content,
        analysis: this.createAnalysisSummary(sources),
        metadata: {
          searchTime: Date.now() - (job.startTime?.getTime() || Date.now()),
          analysisTime: 0, // Would be measured separately in real implementation
          totalApiCalls: this.tavilyClient?.getRequestCount() || 0,
          credibilityScore: this.calculateOverallCredibility(sources)
        }
      };

      // Complete job
      job.status = 'completed';
      job.completedTime = new Date();
      job.result = result;
      job.progress = 100;

      console.log(`✅ Completed ${job.type} research job: ${job.id}`);
      
      // Update document store with results
      await this.updateDocumentWithResults(job);

    } catch (error) {
      console.error(`❌ Failed ${job.type} research job: ${job.id}`, error);
      
      job.status = 'error';
      job.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      job.completedTime = new Date();

      // Update stores with error
      this.updateJobProgress(job, job.progress, `Error: ${job.errorMessage}`);
    }

    // Clean up
    this.activeJobs.delete(job.id);
    
    // Check if all jobs are complete
    if (this.activeJobs.size === 0) {
      await this.onAllJobsComplete(job.documentId);
    }
  }

  /**
   * Generate search queries for a specific research type
   */
  private generateQueries(purpose: string, type: ResearchJob['type']): string[] {
    return TavilyClient.generateQueries(purpose, type);
  }

  /**
   * Search for sources using Tavily API
   */
  private async searchForSources(
    type: ResearchJob['type'], 
    queries: string[], 
    purpose: string
  ): Promise<ResearchSource[]> {
    if (!this.tavilyClient) {
      throw new Error('Tavily client not initialized');
    }

    let tavilyResults: any[] = [];

    switch (type) {
      case 'experts':
        tavilyResults = await this.tavilyClient.searchForExperts(queries, this.extractDomain(purpose));
        break;
      case 'spikyPOVs':
        tavilyResults = await this.tavilyClient.searchForSpikyPOVs(queries);
        break;
      case 'knowledgeTree':
        tavilyResults = await this.tavilyClient.searchForKnowledgeTree(queries);
        break;
    }

    // Convert Tavily results to ResearchSource format
    const sources: ResearchSource[] = [];
    
    for (const result of tavilyResults.slice(0, 5)) { // Limit to 5 sources per section
      try {
        const source: ResearchSource = {
          id: this.generateSourceId(),
          url: result.url,
          title: result.title,
          author: result.author,
          publishDate: result.published_date,
          sourceType: this.determineSourceType(result.url),
          credibilityScore: this.calculateCredibilityScore(result),
          relevanceScore: this.calculateRelevanceScore(result, purpose),
          keyQuotes: this.extractKeyQuotes(result.content),
          summary: await this.generateSourceSummary(result, purpose),
          tavilyMetadata: result
        };

        sources.push(source);
      } catch (error) {
        console.error(`Failed to process source: ${result.url}`, error);
      }
    }

    return sources;
  }

  /**
   * Generate content using OpenAI
   */
  private async generateContent(
    type: ResearchJob['type'],
    sources: ResearchSource[],
    purpose: string
  ): Promise<string> {
    switch (type) {
      case 'experts':
        return await this.openaiClient.generateExpertContent(sources, purpose);
      case 'spikyPOVs':
        return await this.openaiClient.generateSpikyPOVContent(sources, purpose);
      case 'knowledgeTree':
        return await this.openaiClient.generateKnowledgeTreeContent(sources, purpose);
      default:
        throw new Error(`Unknown content type: ${type}`);
    }
  }

  /**
   * Update job progress and notify stores
   */
  private updateJobProgress(job: ResearchJob, progress: number, status: string): void {
    job.progress = progress;
    
    // Update document store with progress
    const documentStore = useDocumentStore.getState();
    const currentDocument = documentStore.currentDocument;
    
    if (currentDocument && currentDocument.id === job.documentId) {
      const updatedProgress = { ...currentDocument.researchProgress };
      
      // Update the specific section progress
      switch (job.type) {
        case 'experts':
          updatedProgress.experts = {
            ...updatedProgress.experts,
            progress,
            status: job.status
          };
          break;
        case 'spikyPOVs':
          updatedProgress.spikyPOVs = {
            ...updatedProgress.spikyPOVs,
            progress,
            status: job.status
          };
          break;
        case 'knowledgeTree':
          updatedProgress.knowledgeTree = {
            ...updatedProgress.knowledgeTree,
            progress,
            status: job.status
          };
          break;
      }
      
      // Calculate overall progress
      const sections = [updatedProgress.experts, updatedProgress.spikyPOVs, updatedProgress.knowledgeTree];
      updatedProgress.overallProgress = sections.reduce((sum, section) => sum + section.progress, 0) / 3;
      
      documentStore.updateResearchProgress(updatedProgress);
    }
  }

  /**
   * Update document store with research results
   */
  private async updateDocumentWithResults(job: ResearchJob): Promise<void> {
    if (!job.result) return;

    const documentStore = useDocumentStore.getState();
    const currentDocument = documentStore.currentDocument;
    
    if (!currentDocument || currentDocument.id !== job.documentId) {
      console.error('Document not found or mismatch:', job.documentId);
      return;
    }

    // Update the appropriate section based on job type
    switch (job.type) {
      case 'experts':
        documentStore.updateDocument({
          experts: [{
            id: job.id,
            expert: {
              name: 'Research-Based Experts',
              title: 'Multiple Expert Sources',
              credentials: 'Various',
              focusArea: this.extractDomain(job.purpose),
              relevance: 'Identified through comprehensive research',
              publicProfiles: job.result.sources.map(s => s.url)
            },
            sources: job.result.sources,
            generatedContent: job.result.generatedContent,
            lastUpdated: new Date()
          }]
        });
        break;

      case 'spikyPOVs':
        documentStore.updateDocument({
          spikyPOVs: [{
            id: job.id,
            consensusView: 'Conventional wisdom in this domain',
            contrarianInsight: 'Evidence-based contrarian perspective',
            evidence: job.result.sources.map(s => s.summary),
            practicalImplications: 'Implications for the stated purpose',
            sources: job.result.sources,
            generatedContent: job.result.generatedContent,
            lastUpdated: new Date()
          }]
        });
        break;

      case 'knowledgeTree':
        documentStore.updateDocument({
          knowledgeTree: [{
            id: job.id,
            currentState: {
              systems: 'Current systems and tools',
              tools: 'Available tools and technologies',
              strengths: 'Identified strengths',
              weaknesses: 'Known limitations',
              metrics: 'Key performance indicators'
            },
            relatedAreas: {
              adjacentFields: ['Related field 1', 'Related field 2'],
              backgroundConcepts: ['Concept 1', 'Concept 2'],
              dependencies: ['Dependency 1', 'Dependency 2']
            },
            sources: job.result.sources,
            generatedContent: job.result.generatedContent,
            lastUpdated: new Date()
          }]
        });
        break;
    }
  }

  /**
   * Handle completion of all research jobs
   */
  private async onAllJobsComplete(documentId: string): Promise<void> {
    console.log(`🎉 All research jobs completed for document: ${documentId}`);
    
    const documentStore = useDocumentStore.getState();
    
    // Complete the research workflow
    documentStore.completeResearchWorkflow();
    
    // Update document status
    documentStore.setDocumentStatus('research-complete');

    // Show notification to user
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Research Complete!', {
        body: 'Your BrainLift research has finished. Click to review the results.',
        icon: '/icon.png'
      });
    }
  }

  // Utility methods (similar to worker implementation)
  
  private extractDomain(purpose: string): string {
    const technicalTerms = purpose.toLowerCase()
      .split(' ')
      .filter(word => word.length > 4 && !this.isCommonWord(word))
      .slice(0, 3);
    
    return technicalTerms.join(' ') || 'general';
  }

  private isCommonWord(word: string): boolean {
    const stopWords = ['the', 'and', 'for', 'with', 'that', 'this', 'have', 'will', 'from', 'they', 'been', 'their', 'said', 'each', 'which', 'what', 'were', 'more', 'very', 'know', 'just', 'first', 'also', 'after', 'back', 'other', 'many', 'than', 'then', 'them', 'these', 'some', 'would', 'make', 'like', 'into', 'time', 'has', 'two', 'way', 'could', 'been', 'call', 'who', 'its', 'now', 'find', 'long', 'down', 'day', 'did', 'get', 'come', 'made', 'may', 'part'];
    return stopWords.includes(word.toLowerCase());
  }

  private determineSourceType(url: string): ResearchSource['sourceType'] {
    if (url.includes('.edu') || url.includes('.ac.') || url.includes('researchgate') || url.includes('scholar.google') || url.includes('arxiv') || url.includes('pubmed')) {
      return 'academic';
    }
    
    if (url.includes('mckinsey') || url.includes('bcg') || url.includes('deloitte') || url.includes('pwc') || url.includes('hbr.org')) {
      return 'industry';
    }
    
    if (url.includes('news') || url.includes('reuters') || url.includes('bloomberg') || url.includes('wsj') || url.includes('nytimes')) {
      return 'news';
    }
    
    if (url.includes('blog') || url.includes('medium.com') || url.includes('substack.com')) {
      return 'blog';
    }
    
    return 'other';
  }

  private calculateCredibilityScore(result: any): number {
    let score = 5; // Base score
    
    if (result.url.includes('.edu') || result.url.includes('researchgate') || result.url.includes('scholar.google')) {
      score += 3;
    }
    
    if (result.url.includes('mckinsey') || result.url.includes('bcg') || result.url.includes('hbr.org')) {
      score += 2;
    }
    
    if (result.published_date && this.isRecent(result.published_date)) {
      score += 1;
    }
    
    if (result.content && result.content.length > 1000) {
      score += 1;
    }
    
    if (result.score > 0.8) {
      score += 2;
    } else if (result.score > 0.6) {
      score += 1;
    }
    
    return Math.min(10, Math.max(1, score));
  }

  private calculateRelevanceScore(result: any, purpose: string): number {
    const purposeKeywords = purpose.toLowerCase().split(' ').filter(word => word.length > 3);
    const contentLower = result.content.toLowerCase();
    const titleLower = result.title.toLowerCase();
    
    let score = 5; // Base score
    
    const titleMatches = purposeKeywords.filter(keyword => titleLower.includes(keyword)).length;
    const contentMatches = purposeKeywords.filter(keyword => contentLower.includes(keyword)).length;
    
    score += (titleMatches * 2) + (contentMatches * 0.5);
    score += (result.score * 3);
    
    return Math.min(10, Math.max(1, score));
  }

  private extractKeyQuotes(content: string): string[] {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const keyIndicators = ['research shows', 'study found', 'according to', 'data reveals', 'evidence suggests', 'experts believe', 'findings indicate'];
    
    const keyQuotes = sentences.filter(sentence => {
      const lowerSentence = sentence.toLowerCase();
      return keyIndicators.some(indicator => lowerSentence.includes(indicator));
    }).slice(0, 3);
    
    if (keyQuotes.length === 0) {
      return sentences.filter(s => s.length > 50 && s.length < 200).slice(0, 3).map(s => s.trim());
    }
    
    return keyQuotes.map(quote => quote.trim());
  }

  private async generateSourceSummary(result: any, purpose: string): Promise<string> {
    try {
      return await this.openaiClient.generateSourceSummary(result, purpose);
    } catch (error) {
      console.error('Failed to generate source summary:', error);
      return result.content.slice(0, 200) + '...';
    }
  }

  private createAnalysisSummary(sources: ResearchSource[]): string {
    const totalSources = sources.length;
    const avgCredibility = sources.reduce((sum, s) => sum + s.credibilityScore, 0) / totalSources;
    const avgRelevance = sources.reduce((sum, s) => sum + s.relevanceScore, 0) / totalSources;
    
    const sourceTypes = sources.reduce((acc, source) => {
      acc[source.sourceType] = (acc[source.sourceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return `Analysis based on ${totalSources} sources with average credibility score of ${avgCredibility.toFixed(1)}/10 and relevance score of ${avgRelevance.toFixed(1)}/10. Source distribution: ${Object.entries(sourceTypes).map(([type, count]) => `${type}: ${count}`).join(', ')}.`;
  }

  private calculateOverallCredibility(sources: ResearchSource[]): number {
    if (sources.length === 0) return 0;
    return sources.reduce((sum, source) => sum + source.credibilityScore, 0) / sources.length;
  }

  private isRecent(publishedDate: string): boolean {
    if (!publishedDate) return false;
    
    try {
      const pubDate = new Date(publishedDate);
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
      
      return pubDate > threeYearsAgo;
    } catch {
      return false;
    }
  }

  private generateSourceId(): string {
    return `source_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current status of all research jobs
   */
  getJobStatus(documentId: string): ResearchJob[] {
    return Array.from(this.activeJobs.values()).filter(job => job.documentId === documentId);
  }

  /**
   * Cancel all research for a document
   */
  cancelResearch(documentId: string): void {
    const jobsToCancel = Array.from(this.activeJobs.values()).filter(job => job.documentId === documentId);
    
    jobsToCancel.forEach(job => {
      job.status = 'error';
      job.errorMessage = 'Cancelled by user';
      this.activeJobs.delete(job.id);
    });

    // Remove from queue
    this.jobQueue = this.jobQueue.filter(job => job.documentId !== documentId);

    console.log(`🛑 Cancelled ${jobsToCancel.length} research jobs for document: ${documentId}`);
  }
}

// Export singleton instance
export const researchOrchestrator = new ResearchOrchestrator(); 