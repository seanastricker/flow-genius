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
        throw new Error(`Unknown content type: ${job.type}`);
    }
  }

  /**
   * Generate expert content from sources
   */
  private async generateExpertContent(sources: ResearchSource[], purpose: string): Promise<string> {
    if (sources.length === 0) {
      return `No expert sources found for the purpose: ${purpose}. Please try broadening your search criteria or checking your internet connection.`;
    }

    try {
      return await this.openaiClient.generateExpertContent(sources, purpose);
    } catch (error) {
      console.error('Failed to generate expert content:', error);
      return this.generateFallbackExpertContent(sources, purpose);
    }
  }

  /**
   * Generate SpikyPOV content from sources
   */
  private async generateSpikyPOVContent(sources: ResearchSource[], purpose: string): Promise<string> {
    if (sources.length === 0) {
      return `No contrarian sources found for the purpose: ${purpose}. Consider exploring alternative viewpoints or research from different domains.`;
    }

    try {
      return await this.openaiClient.generateSpikyPOVContent(sources, purpose);
    } catch (error) {
      console.error('Failed to generate SpikyPOV content:', error);
      return this.generateFallbackSpikyPOVContent(sources, purpose);
    }
  }

  /**
   * Generate Knowledge Tree content from sources
   */
  private async generateKnowledgeTreeContent(sources: ResearchSource[], purpose: string): Promise<string> {
    if (sources.length === 0) {
      return `No knowledge tree sources found for the purpose: ${purpose}. Please ensure your purpose statement contains sufficient technical detail.`;
    }

    try {
      return await this.openaiClient.generateKnowledgeTreeContent(sources, purpose);
    } catch (error) {
      console.error('Failed to generate knowledge tree content:', error);
      return this.generateFallbackKnowledgeTreeContent(sources, purpose);
    }
  }

  /**
   * Fallback expert content when OpenAI fails
   */
  private generateFallbackExpertContent(sources: ResearchSource[], purpose: string): string {
    const expertSources = sources.filter(s => s.sourceType === 'academic' || s.credibilityScore > 7);
    
    return `## Expert Analysis

Based on ${sources.length} research sources related to: ${purpose}

### Key Experts and Insights:

${expertSources.map((source, index) => `
**${index + 1}. ${source.title}**
- Source: ${source.url}
- Credibility Score: ${source.credibilityScore}/10
- Key Insights: ${source.keyQuotes.slice(0, 2).join(' | ')}
- Summary: ${source.summary}
`).join('\n')}

### Analysis Summary:
The research reveals multiple expert perspectives on this topic. Further analysis would benefit from additional OpenAI processing to synthesize these insights into actionable recommendations.

*Note: This is a fallback summary generated when AI content generation was unavailable.*`;
  }

  /**
   * Fallback SpikyPOV content when OpenAI fails
   */
  private generateFallbackSpikyPOVContent(sources: ResearchSource[], purpose: string): string {
    return `## SpikyPOV Analysis

Based on ${sources.length} research sources challenging conventional wisdom about: ${purpose}

### Contrarian Perspectives Found:

${sources.map((source, index) => `
**${index + 1}. ${source.title}**
- Source: ${source.url}
- Key Contrarian Points: ${source.keyQuotes.slice(0, 2).join(' | ')}
- Summary: ${source.summary}
`).join('\n')}

### Potential Counter-Consensus Views:
The sources suggest several areas where conventional thinking may be challenged. Detailed analysis would require AI processing to identify specific contrarian insights and supporting evidence.

*Note: This is a fallback summary generated when AI content generation was unavailable.*`;
  }

  /**
   * Fallback Knowledge Tree content when OpenAI fails
   */
  private generateFallbackKnowledgeTreeContent(sources: ResearchSource[], purpose: string): string {
    return `## Knowledge Tree Analysis

Based on ${sources.length} research sources mapping the knowledge landscape for: ${purpose}

### Current State Information:

${sources.map((source, index) => `
**${index + 1}. ${source.title}**
- Source: ${source.url}
- Relevance Score: ${source.relevanceScore}/10
- Key Information: ${source.keyQuotes.slice(0, 2).join(' | ')}
- Summary: ${source.summary}
`).join('\n')}

### Knowledge Areas Identified:
The research provides foundational information about existing systems, tools, and methodologies. Comprehensive analysis would benefit from AI processing to map dependencies and identify knowledge gaps.

*Note: This is a fallback summary generated when AI content generation was unavailable.*`;
  }

  /**
   * Extract domain from purpose statement
   */
  private extractDomain(purpose: string): string {
    // Simple domain extraction - could be enhanced with NLP
    const technicalTerms = purpose.toLowerCase()
      .split(' ')
      .filter(word => word.length > 4 && !this.isCommonWord(word))
      .slice(0, 3);
    
    return technicalTerms.join(' ') || 'general';
  }

  /**
   * Check if word is a common stop word
   */
  private isCommonWord(word: string): boolean {
    const stopWords = ['the', 'and', 'for', 'with', 'that', 'this', 'have', 'will', 'from', 'they', 'been', 'their', 'said', 'each', 'which', 'what', 'were', 'more', 'very', 'know', 'just', 'first', 'also', 'after', 'back', 'other', 'many', 'than', 'then', 'them', 'these', 'some', 'would', 'make', 'like', 'into', 'time', 'has', 'two', 'way', 'could', 'been', 'call', 'who', 'its', 'now', 'find', 'long', 'down', 'day', 'did', 'get', 'come', 'made', 'may', 'part'];
    return stopWords.includes(word.toLowerCase());
  }

  /**
   * Determine source type from URL
   */
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

  /**
   * Calculate credibility score based on source characteristics
   */
  private calculateCredibilityScore(result: TavilyResult): number {
    let score = 5; // Base score
    
    // Boost for academic sources
    if (this.extractDomainFromUrl(result.url).includes('.edu') || result.url.includes('researchgate') || result.url.includes('scholar.google')) {
      score += 3;
    }
    
    // Boost for professional sources
    if (result.url.includes('mckinsey') || result.url.includes('bcg') || result.url.includes('hbr.org')) {
      score += 2;
    }
    
    // Boost for recent content
    if (this.isRecent(result.published_date || '')) {
      score += 1;
    }
    
    // Boost for longer, more detailed content
    if (result.content && result.content.length > 1000) {
      score += 1;
    }
    
    // Boost based on Tavily's own score
    if (result.score > 0.8) {
      score += 2;
    } else if (result.score > 0.6) {
      score += 1;
    }
    
    return Math.min(10, Math.max(1, score));
  }

  /**
   * Calculate relevance score based on content alignment with purpose
   */
  private calculateRelevanceScore(result: TavilyResult, purpose: string): number {
    const purposeKeywords = purpose.toLowerCase().split(' ').filter(word => word.length > 3);
    const contentLower = result.content.toLowerCase();
    const titleLower = result.title.toLowerCase();
    
    let score = 5; // Base score
    
    // Check keyword overlap
    const titleMatches = purposeKeywords.filter(keyword => titleLower.includes(keyword)).length;
    const contentMatches = purposeKeywords.filter(keyword => contentLower.includes(keyword)).length;
    
    score += (titleMatches * 2) + (contentMatches * 0.5);
    
    // Use Tavily's relevance score
    score += (result.score * 3);
    
    return Math.min(10, Math.max(1, score));
  }

  /**
   * Extract key quotes from content
   */
  private extractKeyQuotes(content: string): string[] {
    // Simple quote extraction - look for sentences with strong indicators
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const keyIndicators = ['research shows', 'study found', 'according to', 'data reveals', 'evidence suggests', 'experts believe', 'findings indicate'];
    
    const keyQuotes = sentences.filter(sentence => {
      const lowerSentence = sentence.toLowerCase();
      return keyIndicators.some(indicator => lowerSentence.includes(indicator));
    }).slice(0, 3);
    
    // If no indicator-based quotes, take first few substantial sentences
    if (keyQuotes.length === 0) {
      return sentences.filter(s => s.length > 50 && s.length < 200).slice(0, 3).map(s => s.trim());
    }
    
    return keyQuotes.map(quote => quote.trim());
  }

  /**
   * Generate source summary using OpenAI
   */
  private async generateSourceSummary(result: TavilyResult, purpose: string): Promise<string> {
    try {
      return await this.openaiClient.generateSourceSummary(result, purpose);
    } catch (error) {
      console.error('Failed to generate source summary:', error);
      // Fallback to simple summary
      return result.content.slice(0, 200) + '...';
    }
  }

  /**
   * Create analysis summary from all sources
   */
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

  /**
   * Calculate overall credibility score
   */
  private calculateOverallCredibility(sources: ResearchSource[]): number {
    if (sources.length === 0) return 0;
    return sources.reduce((sum, source) => sum + source.credibilityScore, 0) / sources.length;
  }

  /**
   * Extract domain from URL
   */
  private extractDomainFromUrl(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return domain;
    } catch {
      return url;
    }
  }

  /**
   * Check if publication date is recent (within 2 years)
   */
  private isRecent(publishDate: string): boolean {
    if (!publishDate) return false;
    
    try {
      const pubDate = new Date(publishDate);
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      return pubDate > twoYearsAgo;
    } catch {
      return false;
    }
  }

  /**
   * Generate unique source ID
   */
  private generateSourceId(): string {
    return `source_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const retryableErrors = ['network', 'timeout', 'rate limit', '429', '503', '502'];
    const errorMessage = error.message.toLowerCase();
    return retryableErrors.some(retryable => errorMessage.includes(retryable));
  }

  /**
   * Stop current job and cleanup
   */
  private async stopJob(cleanup: boolean): Promise<void> {
    if (cleanup) {
      // Reset API clients if needed
      this.tavilyClient.resetRequestCount();
      this.openaiClient.resetUsageStats();
    }
    
    this.sendProgress(0, 'Job stopped');
  }

  /**
   * Send progress update to main thread
   */
  private sendProgress(progress: number, status: string): void {
    parentPort?.postMessage({
      type: 'PROGRESS_UPDATE',
      payload: { progress, status }
    });
  }

  /**
   * Send partial results to main thread
   */
  private sendPartialResult(sources: ResearchSource[]): void {
    parentPort?.postMessage({
      type: 'RESULT_PARTIAL',
      payload: { sources }
    });
  }

  /**
   * Send final result to main thread
   */
  private sendResult(result: WorkerResult): void {
    parentPort?.postMessage({
      type: 'JOB_COMPLETE',
      payload: result
    });
  }

  /**
   * Send error to main thread
   */
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