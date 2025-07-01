/**
 * Research Worker Thread
 * Handles background research processing for BrainLift documents
 * Processes experts, SpikyPOVs, and knowledge tree research
 */

import { parentPort, workerData } from 'worker_threads';
import { TavilyClient, type TavilyResult } from '../renderer/services/api/tavily-client';
import { OpenAIClient } from '../renderer/services/api/openai-client';

// Worker interfaces matching implementation guide
export interface WorkerJob {
  id: string;
  type: 'experts' | 'spikyPOVs' | 'knowledgeTree';
  queries: string[];
  purpose: string;
  sectionRequirements: SectionRequirements;
}

export interface SectionRequirements {
  targetSourceCount: number;          // 3-5 sources per section
  sourceTypes: string[];              // ['academic', 'industry', 'news']
  analysisDepth: 'summary' | 'detailed';
  outputFormat: string;               // Specific formatting requirements
}

export interface WorkerResult {
  jobId: string;
  workerId: string;
  sources: ResearchSource[];
  analysis: string;
  generatedContent: string;
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
  credibilityScore: number;    // 1-10 rating
  relevanceScore: number;      // 1-10 rating
  keyQuotes: string[];
  summary: string;
  tavilyMetadata?: any;        // Original Tavily response data
}

// Message types for worker communication
export type WorkerMessage = 
  | { type: 'JOB_START'; payload: WorkerJob }
  | { type: 'PROGRESS_UPDATE'; payload: { progress: number; status: string } }
  | { type: 'RESULT_PARTIAL'; payload: { sources: ResearchSource[] } }
  | { type: 'JOB_COMPLETE'; payload: WorkerResult }
  | { type: 'JOB_ERROR'; payload: { error: string; retryable: boolean } }
  | { type: 'JOB_STOP'; payload: { cleanup: boolean } };

/**
 * Research Worker Class
 * Handles the actual research processing in a separate thread
 */
class ResearchWorker {
  private tavilyClient: TavilyClient;
  private openaiClient: OpenAIClient;
  private workerId: string;

  constructor() {
    // Get API keys from worker data
    const { tavilyApiKey, openaiApiKey, workerId } = workerData;
    
    if (!tavilyApiKey || !openaiApiKey) {
      throw new Error('Missing required API keys in worker data');
    }

    this.tavilyClient = new TavilyClient(tavilyApiKey);
    this.openaiClient = new OpenAIClient();
    this.openaiClient.setApiKey(openaiApiKey);
    this.workerId = workerId;

    this.setupMessageHandler();
  }

  /**
   * Set up message handler for communication with main thread
   */
  private setupMessageHandler(): void {
    parentPort?.on('message', async (message: WorkerMessage) => {
      try {
        switch (message.type) {
          case 'JOB_START':
            await this.processJob(message.payload);
            break;
          case 'JOB_STOP':
            await this.stopJob(message.payload.cleanup);
            break;
          default:
            console.error(`Unknown message type: ${(message as any).type}`);
        }
      } catch (error) {
        this.sendError(error as Error, true);
      }
    });
  }

  /**
   * Process a research job
   */
  private async processJob(job: WorkerJob): Promise<void> {
    const startTime = Date.now();
    
    this.sendProgress(10, `Starting ${job.type} research...`);

    try {
      // Step 1: Search for sources
      this.sendProgress(25, 'Searching for sources...');
      const sources = await this.searchForSources(job);

      // Step 2: Analyze and filter sources
      this.sendProgress(50, 'Analyzing sources...');
      const analyzedSources = await this.analyzeSources(sources, job);

      // Step 3: Generate content
      this.sendProgress(75, 'Generating content...');
      const generatedContent = await this.generateContent(analyzedSources, job);

      // Step 4: Complete job
      this.sendProgress(100, 'Research complete!');
      
      const searchTime = Date.now() - startTime;
      const result: WorkerResult = {
        jobId: job.id,
        workerId: this.workerId,
        sources: analyzedSources,
        analysis: this.createAnalysisSummary(analyzedSources),
        generatedContent,
        metadata: {
          searchTime,
          analysisTime: Date.now() - startTime - searchTime,
          totalApiCalls: this.tavilyClient.getRequestCount(),
          credibilityScore: this.calculateOverallCredibility(analyzedSources)
        }
      };

      this.sendResult(result);
    } catch (error) {
      this.sendError(error as Error, this.isRetryableError(error as Error));
    }
  }

  /**
   * Search for sources based on job type
   */
  private async searchForSources(job: WorkerJob): Promise<TavilyResult[]> {
    switch (job.type) {
      case 'experts':
        return await this.tavilyClient.searchForExperts(job.queries, this.extractDomain(job.purpose));
      case 'spikyPOVs':
        return await this.tavilyClient.searchForSpikyPOVs(job.queries);
      case 'knowledgeTree':
        return await this.tavilyClient.searchForKnowledgeTree(job.queries);
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
  }

  /**
   * Analyze and convert Tavily results to research sources
   */
  private async analyzeSources(tavilyResults: TavilyResult[], job: WorkerJob): Promise<ResearchSource[]> {
    const sources: ResearchSource[] = [];

    for (const result of tavilyResults.slice(0, job.sectionRequirements.targetSourceCount)) {
      try {
        const source: ResearchSource = {
          id: this.generateSourceId(),
          url: result.url,
          title: result.title,
          author: result.author,
          publishDate: result.published_date,
          sourceType: this.determineSourceType(result.url),
          credibilityScore: this.calculateCredibilityScore(result),
          relevanceScore: this.calculateRelevanceScore(result, job.purpose),
          keyQuotes: this.extractKeyQuotes(result.content),
          summary: await this.generateSourceSummary(result, job.purpose),
          tavilyMetadata: result
        };

        sources.push(source);
      } catch (error) {
        console.error(`Failed to analyze source: ${result.url}`, error);
      }
    }

    return sources;
  }

  /**
   * Generate content based on analyzed sources
   */
  private async generateContent(sources: ResearchSource[], job: WorkerJob): Promise<string> {
    switch (job.type) {
      case 'experts':
        return await this.generateExpertContent(sources, job.purpose);
      case 'spikyPOVs':
        return await this.generateSpikyPOVContent(sources, job.purpose);
      case 'knowledgeTree':
        return await this.generateKnowledgeTreeContent(sources, job.purpose);
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
  }

  /**
   * Generate expert section content
   */
  private async generateExpertContent(sources: ResearchSource[], purpose: string): Promise<string> {
    const prompt = `
Create an Expert section for a BrainLift document using these sources.

Purpose: ${purpose}

Sources: ${sources.map(s => `
- ${s.title} (${s.url})
  Author: ${s.author || 'Unknown'}
  Summary: ${s.summary}
  Key Quotes: ${s.keyQuotes.join('; ')}
`).join('\n')}

For each expert identified, provide:
1. Name and credentials
2. Their specific expertise area
3. Why they're relevant to this purpose
4. Key insights or notable work
5. How to contact or find their work

Focus on credible experts with relevant experience and documented expertise.
Format as structured sections for each expert.
`;

    return await this.openaiClient.generateContent(prompt, {
      temperature: 0.3,
      maxTokens: 1500
    });
  }

  /**
   * Generate SpikyPOV section content
   */
  private async generateSpikyPOVContent(sources: ResearchSource[], purpose: string): Promise<string> {
    const prompt = `
Create a SpikyPOV section for a BrainLift document using these sources.

Purpose: ${purpose}

Sources: ${sources.map(s => `
- ${s.title} (${s.url})
  Summary: ${s.summary}
  Key Quotes: ${s.keyQuotes.join('; ')}
`).join('\n')}

Format:
1. Consensus View: [What most people believe about this topic]
2. Contrarian Insight: [The counter-consensus view with evidence]
3. Supporting Evidence: [Specific data, studies, examples from sources]
4. Practical Implications: [What this means for the purpose]

Focus on evidence-backed contrarian viewpoints, not mere opinions.
Use multiple perspectives and cite specific evidence from the sources.
`;

    return await this.openaiClient.generateContent(prompt, {
      temperature: 0.4,
      maxTokens: 1500
    });
  }

  /**
   * Generate Knowledge Tree section content
   */
  private async generateKnowledgeTreeContent(sources: ResearchSource[], purpose: string): Promise<string> {
    const prompt = `
Create a Knowledge Tree section for a BrainLift document using these sources.

Purpose: ${purpose}

Sources: ${sources.map(s => `
- ${s.title} (${s.url})
  Summary: ${s.summary}
  Key Quotes: ${s.keyQuotes.join('; ')}
`).join('\n')}

Analyze and organize:
1. Current State: What systems, tools, and approaches currently exist
2. Strengths and Weaknesses: What works well and what doesn't
3. Adjacent Fields: Related areas and disciplines
4. Background Concepts: Foundational knowledge needed
5. Dependencies: What this area depends on or influences

Structure as a comprehensive knowledge map with clear connections and relationships.
`;

    return await this.openaiClient.generateContent(prompt, {
      temperature: 0.3,
      maxTokens: 1500
    });
  }

  /**
   * Utility methods
   */
  private extractDomain(purpose: string): string {
    // Simple domain extraction from purpose - could be improved with NLP
    const domains = ['technology', 'business', 'science', 'healthcare', 'education'];
    const lowerPurpose = purpose.toLowerCase();
    
    for (const domain of domains) {
      if (lowerPurpose.includes(domain)) {
        return domain;
      }
    }
    
    return 'general';
  }

  private determineSourceType(url: string): ResearchSource['sourceType'] {
    if (url.includes('.edu') || url.includes('.ac.') || url.includes('arxiv') || url.includes('ieee')) {
      return 'academic';
    }
    if (url.includes('blog') || url.includes('medium') || url.includes('substack')) {
      return 'blog';
    }
    if (url.includes('news') || url.includes('cnn') || url.includes('bbc') || url.includes('reuters')) {
      return 'news';
    }
    if (url.includes('mckinsey') || url.includes('bcg') || url.includes('deloitte')) {
      return 'industry';
    }
    return 'other';
  }

  private calculateCredibilityScore(result: TavilyResult): number {
    let score = 5; // Base score

    // Boost for academic sources
    if (result.url.includes('.edu') || result.url.includes('arxiv')) score += 2;
    
    // Boost for recent content
    if (result.published_date && this.isRecent(result.published_date)) score += 1;
    
    // Boost for detailed content
    if (result.content.length > 1000) score += 1;
    
    // Boost for high Tavily score
    if (result.score > 0.8) score += 1;

    return Math.min(10, Math.max(1, score));
  }

  private calculateRelevanceScore(result: TavilyResult, purpose: string): number {
    // Simple keyword matching - could be improved with semantic similarity
    const purposeWords = purpose.toLowerCase().split(' ');
    const contentWords = result.content.toLowerCase().split(' ');
    
    const matches = purposeWords.filter(word => 
      word.length > 3 && contentWords.includes(word)
    ).length;
    
    const relevanceRatio = matches / purposeWords.length;
    return Math.min(10, Math.max(1, Math.round(relevanceRatio * 10)));
  }

  private extractKeyQuotes(content: string): string[] {
    // Simple quote extraction - look for sentences with quotation marks or strong statements
    const sentences = content.split(/[.!?]+/);
    const quotes: string[] = [];

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.length > 20 && (
        trimmed.includes('"') || 
        trimmed.includes("'") ||
        trimmed.toLowerCase().includes('found that') ||
        trimmed.toLowerCase().includes('research shows') ||
        trimmed.toLowerCase().includes('study reveals')
      )) {
        quotes.push(trimmed);
      }
    }

    return quotes.slice(0, 3); // Top 3 quotes
  }

  private async generateSourceSummary(result: TavilyResult, purpose: string): Promise<string> {
    const prompt = `
Summarize this source in 2-3 sentences, focusing on how it relates to: ${purpose}

Source: ${result.title}
Content: ${result.content.substring(0, 1000)}...

Provide a concise, relevant summary.
`;

    return await this.openaiClient.generateContent(prompt, {
      temperature: 0.2,
      maxTokens: 200
    });
  }

  private createAnalysisSummary(sources: ResearchSource[]): string {
    const avgCredibility = sources.reduce((sum, s) => sum + s.credibilityScore, 0) / sources.length;
    const avgRelevance = sources.reduce((sum, s) => sum + s.relevanceScore, 0) / sources.length;
    const sourceTypes = [...new Set(sources.map(s => s.sourceType))];

    return `Analysis Summary:
- ${sources.length} sources analyzed
- Average credibility: ${avgCredibility.toFixed(1)}/10
- Average relevance: ${avgRelevance.toFixed(1)}/10
- Source types: ${sourceTypes.join(', ')}
- Key domains covered: ${sources.map(s => this.extractDomainFromUrl(s.url)).filter(Boolean).slice(0, 3).join(', ')}`;
  }

  private calculateOverallCredibility(sources: ResearchSource[]): number {
    return sources.reduce((sum, s) => sum + s.credibilityScore, 0) / sources.length;
  }

  private extractDomainFromUrl(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }

  private isRecent(publishDate: string): boolean {
    const date = new Date(publishDate);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return date >= oneYearAgo;
  }

  private generateSourceId(): string {
    return `source_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isRetryableError(error: Error): boolean {
    const retryableErrors = ['network', 'timeout', 'rate limit', '429', '500', '502', '503'];
    const errorMessage = error.message.toLowerCase();
    return retryableErrors.some(keyword => errorMessage.includes(keyword));
  }

  private async stopJob(cleanup: boolean): Promise<void> {
    if (cleanup) {
      // Perform any necessary cleanup
      console.log(`Worker ${this.workerId} stopping with cleanup`);
    }
    process.exit(0);
  }

  /**
   * Communication methods
   */
  private sendProgress(progress: number, status: string): void {
    parentPort?.postMessage({
      type: 'PROGRESS_UPDATE',
      payload: { progress, status }
    });
  }

  private sendResult(result: WorkerResult): void {
    parentPort?.postMessage({
      type: 'JOB_COMPLETE',
      payload: result
    });
  }

  private sendError(error: Error, retryable: boolean): void {
    parentPort?.postMessage({
      type: 'JOB_ERROR',
      payload: { 
        error: error.message,
        retryable
      }
    });
  }
}

// Initialize worker when this file is run as a worker thread
if (require.main === module) {
  try {
    new ResearchWorker();
    console.log(`Research worker ${workerData?.workerId || 'unknown'} initialized`);
  } catch (error) {
    console.error('Failed to initialize research worker:', error);
    process.exit(1);
  }
}

export { ResearchWorker }; 