/**
 * Tavily Search API Client
 * Handles web search functionality for research workflows
 * Implements rate limiting, result filtering, and quality scoring
 */

export interface TavilySearchParams {
  query: string;
  search_depth?: 'basic' | 'advanced';
  include_domains?: string[];
  exclude_domains?: string[];
  max_results?: number;
  include_raw_content?: boolean;
  include_images?: boolean;
}

export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  raw_content?: string;
  score: number;
  published_date?: string;
  author?: string;
  images?: string[];
}

export interface TavilyResponse {
  query: string;
  follow_up_questions: string[];
  answer: string;
  images: string[];
  results: TavilyResult[];
  response_time: number;
}

export interface SearchOptions {
  depth?: 'basic' | 'advanced';
  includeDomains?: string[];
  excludeDomains?: string[];
  maxResults?: number;
  sourceTypes?: string[];
}

/**
 * Rate limiter to prevent API limit violations
 */
class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per second

  constructor(maxTokens: number = 100, refillRate: number = 1) {
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  async waitForToken(): Promise<void> {
    this.refillTokens();

    if (this.tokens >= 1) {
      this.tokens--;
      return;
    }

    // Wait for next token
    const waitTime = (1 / this.refillRate) * 1000;
    await new Promise(resolve => setTimeout(resolve, waitTime));
    return this.waitForToken();
  }

  private refillTokens(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

/**
 * Tavily API client for web search functionality
 */
export class TavilyClient {
  private apiKey: string;
  private baseUrl = 'https://api.tavily.com';
  private requestCount = 0;
  private dailyLimit = 1000;
  private rateLimiter: RateLimiter;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.rateLimiter = new RateLimiter(100, 1); // 1 request per second
  }

  /**
   * Search for expert information in specific domains
   */
  async searchForExperts(queries: string[], domain: string): Promise<TavilyResult[]> {
    const results: TavilyResult[] = [];

    for (const query of queries.slice(0, 5)) { // Limit to 5 queries
      if (this.requestCount >= this.dailyLimit) {
        throw new Error('Daily API limit reached');
      }

      const searchParams: TavilySearchParams = {
        query: `${query} ${domain}`,
        search_depth: 'advanced',
        include_domains: this.getExpertDomains(domain),
        exclude_domains: ['wikipedia.org', 'reddit.com', 'quora.com'],
        max_results: 5,
        include_raw_content: true
      };

      try {
        const result = await this.makeRequest(searchParams);
        results.push(...result.results);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
      } catch (error) {
        console.error(`Expert search failed for query "${query}":`, error);
      }
    }

    return this.rankAndFilterResults(results, 'expert');
  }

  /**
   * Search for contrarian viewpoints and SpikyPOVs
   */
  async searchForSpikyPOVs(queries: string[]): Promise<TavilyResult[]> {
    const results: TavilyResult[] = [];

    for (const query of queries.slice(0, 5)) { // Limit to 5 queries
      if (this.requestCount >= this.dailyLimit) {
        throw new Error('Daily API limit reached');
      }

      const searchParams: TavilySearchParams = {
        query,
        search_depth: 'advanced',
        include_domains: this.getContrarianDomains(),
        max_results: 5,
        include_raw_content: true
      };

      try {
        const result = await this.makeRequest(searchParams);
        results.push(...result.results);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
      } catch (error) {
        console.error(`SpikyPOV search failed for query "${query}":`, error);
      }
    }

    return this.rankAndFilterResults(results, 'contrarian');
  }

  /**
   * Search for knowledge tree information
   */
  async searchForKnowledgeTree(queries: string[]): Promise<TavilyResult[]> {
    const results: TavilyResult[] = [];

    for (const query of queries.slice(0, 5)) { // Limit to 5 queries
      if (this.requestCount >= this.dailyLimit) {
        throw new Error('Daily API limit reached');
      }

      const searchParams: TavilySearchParams = {
        query,
        search_depth: 'advanced',
        max_results: 5,
        include_raw_content: true
      };

      try {
        const result = await this.makeRequest(searchParams);
        results.push(...result.results);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
      } catch (error) {
        console.error(`Knowledge tree search failed for query "${query}":`, error);
      }
    }

    return this.rankAndFilterResults(results, 'knowledge');
  }

  /**
   * Make API request to Tavily
   */
  private async makeRequest(params: TavilySearchParams): Promise<TavilyResponse> {
    await this.rateLimiter.waitForToken();

    const response = await fetch(`${this.baseUrl}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        api_key: this.apiKey,
        ...params
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Tavily API error: ${response.status} - ${errorText}`);
    }

    this.requestCount++;
    return await response.json();
  }

  /**
   * Get expert-focused domains for search filtering
   */
  private getExpertDomains(domain: string): string[] {
    const academicDomains = [
      'edu', 'ac.uk', 'researchgate.net', 'scholar.google.com',
      'arxiv.org', 'ieee.org', 'acm.org', 'nature.com', 'science.org'
    ];

    const industryDomains = [
      'mckinsey.com', 'bcg.com', 'deloitte.com', 'pwc.com',
      'hbr.org', 'mit.edu', 'stanford.edu', 'harvard.edu'
    ];

    return [...academicDomains, ...industryDomains];
  }

  /**
   * Get domains known for contrarian viewpoints
   */
  private getContrarianDomains(): string[] {
    return [
      'marginalrevolution.com', 'overcomingbias.com', 'lesswrong.com',
      'slatestarcodex.com', 'astralcodexten.substack.com', 'nakedcapitalism.com'
    ];
  }

  /**
   * Rank and filter results based on quality and relevance
   */
  private rankAndFilterResults(results: TavilyResult[], type: string): TavilyResult[] {
    return results
      .filter(result => this.isHighQuality(result, type))
      .sort((a, b) => this.calculateRelevanceScore(b, type) - this.calculateRelevanceScore(a, type))
      .slice(0, 5); // Top 5 results
  }

  /**
   * Check if result meets quality standards
   */
  private isHighQuality(result: TavilyResult, type: string): boolean {
    // Basic quality checks
    if (!result.content || result.content.length < 100) return false;
    if (!result.title || result.title.length < 10) return false;
    if (result.score < 0.3) return false;

    // Type-specific quality checks
    if (type === 'expert') {
      return this.isAcademicOrProfessionalSource(result.url) ||
             this.containsExpertIndicators(result.content);
    }

    if (type === 'contrarian') {
      return this.containsContrarianIndicators(result.content);
    }

    return true;
  }

  /**
   * Calculate relevance score for ranking
   */
  private calculateRelevanceScore(result: TavilyResult, type: string): number {
    let score = result.score || 0;

    // Boost academic sources for experts
    if (type === 'expert' && this.isAcademicSource(result.url)) {
      score += 0.2;
    }

    // Boost recent sources
    if (this.isRecentSource(result.published_date)) {
      score += 0.1;
    }

    // Boost longer, more detailed content
    if (result.content && result.content.length > 500) {
      score += 0.1;
    }

    return score;
  }

  /**
   * Check if source is academic
   */
  private isAcademicSource(url: string): boolean {
    const academicDomains = ['.edu', '.ac.', 'researchgate', 'scholar.google', 'arxiv', 'ieee', 'acm'];
    return academicDomains.some(domain => url.includes(domain));
  }

  /**
   * Check if source is academic or professional
   */
  private isAcademicOrProfessionalSource(url: string): boolean {
    const professionalDomains = [
      '.edu', '.ac.', 'researchgate', 'scholar.google', 'arxiv', 'ieee', 'acm',
      'mckinsey', 'bcg', 'deloitte', 'pwc', 'hbr.org'
    ];
    return professionalDomains.some(domain => url.includes(domain));
  }

  /**
   * Check if source is recent (within 2 years)
   */
  private isRecentSource(publishedDate?: string): boolean {
    if (!publishedDate) return false;
    const date = new Date(publishedDate);
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    return date >= twoYearsAgo;
  }

  /**
   * Check for expert indicators in content
   */
  private containsExpertIndicators(content: string): boolean {
    const expertKeywords = [
      'professor', 'phd', 'research', 'published', 'author',
      'expert', 'specialist', 'leading', 'authority', 'scholar'
    ];
    const lowerContent = content.toLowerCase();
    return expertKeywords.some(keyword => lowerContent.includes(keyword));
  }

  /**
   * Check for contrarian indicators in content
   */
  private containsContrarianIndicators(content: string): boolean {
    const contrarianKeywords = [
      'contrary', 'however', 'but', 'actually', 'surprising',
      'unexpected', 'myth', 'wrong', 'debunk', 'challenge'
    ];
    const lowerContent = content.toLowerCase();
    return contrarianKeywords.some(keyword => lowerContent.includes(keyword));
  }

  /**
   * Get current request count (for monitoring)
   */
  getRequestCount(): number {
    return this.requestCount;
  }

  /**
   * Reset request count (for testing or daily reset)
   */
  resetRequestCount(): void {
    this.requestCount = 0;
  }
} 