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
        query: params.query,
        search_depth: params.search_depth || 'basic',
        include_domains: params.include_domains || [],
        exclude_domains: params.exclude_domains || [],
        max_results: params.max_results || 5,
        include_raw_content: params.include_raw_content || false,
        include_images: params.include_images || false
      })
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    this.requestCount++;
    
    return data;
  }

  /**
   * Get expert domains for filtering search results
   */
  private getExpertDomains(domain: string): string[] {
    const academicDomains = [
      'edu', 'ac.uk', 'researchgate.net', 'scholar.google.com',
      'arxiv.org', 'ieee.org', 'acm.org', 'springer.com', 'nature.com',
      'sciencedirect.com', 'jstor.org', 'pubmed.ncbi.nlm.nih.gov'
    ];
    
    const industryDomains = [
      'mckinsey.com', 'bcg.com', 'deloitte.com', 'pwc.com',
      'hbr.org', 'mit.edu', 'stanford.edu', 'harvard.edu',
      'wharton.upenn.edu', 'kellogg.northwestern.edu'
    ];

    return [...academicDomains, ...industryDomains];
  }

  /**
   * Get contrarian domains that might contain counter-consensus views
   */
  private getContrarianDomains(): string[] {
    return [
      'marginalrevolution.com', 'overcomingbias.com', 'lesswrong.com',
      'slatestarcodex.com', 'astralcodexten.substack.com', 
      'econlog.econlib.org', 'theatlantic.com', 'newyorker.com',
      'medium.com', 'substack.com', 'blog.', '.blog'
    ];
  }

  /**
   * Rank and filter results based on type and quality
   */
  private rankAndFilterResults(results: TavilyResult[], type: string): TavilyResult[] {
    return results
      .filter(result => this.isHighQuality(result, type))
      .sort((a, b) => this.calculateRelevanceScore(b, type) - this.calculateRelevanceScore(a, type))
      .slice(0, 5); // Top 5 results
  }

  /**
   * Check if a result meets quality standards
   */
  private isHighQuality(result: TavilyResult, type: string): boolean {
    // Basic quality checks
    if (!result.content || result.content.length < 100) return false;
    if (!result.title || result.title.length < 10) return false;
    if (result.score < 0.3) return false;

    // Type-specific quality checks
    switch (type) {
      case 'expert':
        return this.isAcademicOrProfessionalSource(result.url) || 
               this.containsExpertIndicators(result.content);
      
      case 'contrarian':
        return this.containsContrarianIndicators(result.content);
      
      case 'knowledge':
        return result.content.length > 200; // More detailed content for knowledge
      
      default:
        return true;
    }
  }

  /**
   * Calculate relevance score for ranking
   */
  private calculateRelevanceScore(result: TavilyResult, type: string): number {
    let score = result.score || 0;
    
    // Boost academic sources for experts
    if (type === 'expert' && this.isAcademicSource(result.url)) {
      score += 0.3;
    }
    
    // Boost professional sources for experts
    if (type === 'expert' && this.isAcademicOrProfessionalSource(result.url)) {
      score += 0.2;
    }
    
    // Boost recent sources
    if (this.isRecentSource(result.published_date)) {
      score += 0.1;
    }
    
    // Boost content with expert indicators
    if (type === 'expert' && this.containsExpertIndicators(result.content)) {
      score += 0.15;
    }
    
    // Boost content with contrarian indicators
    if (type === 'contrarian' && this.containsContrarianIndicators(result.content)) {
      score += 0.2;
    }
    
    return Math.min(1.0, score); // Cap at 1.0
  }

  /**
   * Check if URL is from academic source
   */
  private isAcademicSource(url: string): boolean {
    const academicIndicators = ['.edu', '.ac.', 'researchgate', 'scholar.google', 
                               'arxiv.org', 'pubmed', 'jstor', 'springer'];
    return academicIndicators.some(indicator => url.includes(indicator));
  }

  /**
   * Check if URL is from academic or professional source
   */
  private isAcademicOrProfessionalSource(url: string): boolean {
    const professionalIndicators = [
      '.edu', '.ac.', 'researchgate', 'scholar.google', 'arxiv.org',
      'mckinsey.com', 'bcg.com', 'deloitte.com', 'pwc.com', 'hbr.org',
      'mit.edu', 'stanford.edu', 'harvard.edu', 'ieee.org', 'acm.org'
    ];
    return professionalIndicators.some(indicator => url.includes(indicator));
  }

  /**
   * Check if source is recent (within last 3 years)
   */
  private isRecentSource(publishedDate?: string): boolean {
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

  /**
   * Check if content contains expert indicators
   */
  private containsExpertIndicators(content: string): boolean {
    const indicators = [
      'professor', 'dr.', 'phd', 'researcher', 'scientist', 'expert',
      'director', 'founder', 'ceo', 'author', 'published', 'study',
      'research', 'university', 'institute', 'laboratory', 'fellow'
    ];
    
    const lowerContent = content.toLowerCase();
    return indicators.some(indicator => lowerContent.includes(indicator));
  }

  /**
   * Check if content contains contrarian indicators
   */
  private containsContrarianIndicators(content: string): boolean {
    const indicators = [
      'contrary to', 'however', 'but', 'despite', 'challenge', 'myth',
      'misconception', 'wrong', 'debunk', 'actually', 'surprising',
      'counterintuitive', 'opposite', 'against conventional',
      'traditional thinking', 'commonly believed', 'most people think'
    ];
    
    const lowerContent = content.toLowerCase();
    return indicators.some(indicator => lowerContent.includes(indicator));
  }

  /**
   * Get current request count
   */
  getRequestCount(): number {
    return this.requestCount;
  }

  /**
   * Reset request count (useful for testing)
   */
  resetRequestCount(): void {
    this.requestCount = 0;
  }

  /**
   * Initialize from environment variable
   */
  static fromEnvironment(): TavilyClient | null {
    const apiKey = import.meta.env.VITE_TAVILY_API_KEY;
    
    if (apiKey && apiKey !== 'your-tavily-api-key-here') {
      console.log('✅ Tavily API key loaded from environment');
      return new TavilyClient(apiKey);
    }
    
    console.log('❌ No valid Tavily API key found in environment');
    return null;
  }

  /**
   * Generate research queries based on purpose and type
   */
  static generateQueries(purpose: string, type: 'experts' | 'spikyPOVs' | 'knowledgeTree'): string[] {
    const domain = this.extractDomainFromPurpose(purpose);
    
    switch (type) {
      case 'experts':
        return [
          `leading experts ${domain}`,
          `top researchers ${domain}`,
          `thought leaders ${domain}`,
          `${domain} professor university`,
          `${domain} director founder CEO`
        ];
        
      case 'spikyPOVs':
        return [
          `${domain} conventional wisdom wrong`,
          `${domain} contrarian view evidence`,
          `${domain} debunked myths`,
          `${domain} surprising research findings`,
          `${domain} counterintuitive studies`
        ];
        
      case 'knowledgeTree':
        return [
          `${domain} current state tools systems`,
          `${domain} background knowledge`,
          `${domain} dependencies related fields`,
          `${domain} adjacent areas connections`,
          `${domain} existing solutions analysis`
        ];
        
      default:
        return [purpose];
    }
  }

  /**
   * Extract domain from purpose text
   */
  private static extractDomainFromPurpose(purpose: string): string {
    // Simple extraction - could be enhanced with NLP
    const words = purpose.toLowerCase().split(' ');
    const technicalTerms = words.filter(word => 
      word.length > 4 && 
      !['the', 'and', 'for', 'with', 'that', 'this', 'have', 'will', 'from', 'they', 'been', 'have', 'their', 'said', 'each', 'which', 'what', 'were', 'been', 'more', 'very', 'what', 'know', 'just', 'first', 'also', 'after', 'back', 'other', 'many', 'than', 'then', 'them', 'these', 'some', 'her', 'would', 'make', 'like', 'into', 'him', 'has', 'two', 'more', 'go', 'no', 'way', 'could', 'my', 'than', 'first', 'been', 'call', 'who', 'its', 'now', 'find', 'long', 'down', 'day', 'did', 'get', 'come', 'made', 'may', 'part'].includes(word)
    );
    
    return technicalTerms.slice(0, 3).join(' ') || purpose.slice(0, 50);
  }
} 