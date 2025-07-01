/**
 * OpenAI API client for Purpose refinement and content generation
 * Handles rate limiting, error handling, and conversation management
 */
import OpenAI from 'openai';

export interface GenerationOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface PurposeRefinementResponse {
  message: string;
  suggestions?: {
    coreProblem?: {
      challenge?: string;
      importance?: string;
      currentImpact?: string;
    };
    targetOutcome?: {
      successDefinition?: string;
      measurableResults?: string;
      beneficiaries?: string;
    };
    boundaries?: {
      included?: string;
      excluded?: string;
      adjacentProblems?: string;
    };
  };
  isComplete?: boolean;
}

export class OpenAIClient {
  private client: OpenAI | null = null;
  private requestCount = 0;
  private rpmLimit = 10000;
  private lastRequestTime = 0;
  private apiKey: string | null = null;

  constructor() {
    // API key will be set when user provides it
    this.initializeFromEnvironment();
  }

  /**
   * Initialize client from environment variables if available
   */
  private initializeFromEnvironment(): void {
    // In development, try to load from environment
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (apiKey && apiKey !== 'sk-your-openai-api-key-here') {
      console.log('✅ OpenAI API key loaded from environment');
      this.setApiKey(apiKey);
    } else {
      console.log('❌ No valid OpenAI API key found in environment');
    }
  }

  /**
   * Set API key and initialize client
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    this.client = new OpenAI({ 
      apiKey,
      dangerouslyAllowBrowser: true // For desktop Electron app
    });
  }

  /**
   * Check if client is ready to make API calls
   */
  isReady(): boolean {
    return this.client !== null && this.apiKey !== null;
  }

  /**
   * Enforce rate limiting to respect API limits
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = 60000 / this.rpmLimit; // milliseconds per request
    
    if (timeSinceLastRequest < minInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, minInterval - timeSinceLastRequest)
      );
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Handle Purpose refinement conversation
   */
  async refinePurpose(
    userMessage: string,
    currentPurpose?: any,
    chatHistory?: Array<{ role: string; content: string }>
  ): Promise<PurposeRefinementResponse> {
    if (!this.isReady()) {
      throw new Error('OpenAI client not initialized. Please set API key.');
    }

    await this.enforceRateLimit();

    const systemPrompt = `You are an expert facilitator helping users define a clear Purpose for their BrainLift document. A BrainLift Purpose has three key sections:

1. Core Problem: The specific challenge they're trying to solve
2. Target Outcome: What success looks like with measurable results
3. Clear Boundaries: What's included/excluded and adjacent problems

Your role is to:
- Ask clarifying questions to help them think deeper
- Guide them through each section methodically
- Provide specific, actionable suggestions
- Help them refine vague statements into concrete, specific descriptions
- Recognize when their Purpose is complete and well-defined

Be conversational, supportive, and focused on helping them articulate their thinking clearly.

IMPORTANT: Always respond in JSON format with the following structure:
{
  "message": "Your conversational response here",
  "suggestions": {
    "coreProblem": {
      "challenge": "specific challenge text (optional)",
      "importance": "why this matters text (optional)",
      "currentImpact": "current impact description (optional)"
    },
    "targetOutcome": {
      "successDefinition": "what success looks like (optional)",
      "measurableResults": "specific measurable outcomes (optional)",
      "beneficiaries": "who benefits from this (optional)"
    },
    "boundaries": {
      "included": "what is included in scope (optional)",
      "excluded": "what is excluded from scope (optional)",
      "adjacentProblems": "related but separate problems (optional)"
    }
  },
  "isComplete": false
}

Current Purpose state: ${currentPurpose ? JSON.stringify(currentPurpose, null, 2) : 'Not yet defined'}`;

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt }
    ];

    // Add chat history if available
    if (chatHistory && chatHistory.length > 0) {
      messages.push(...chatHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })));
    }

    // Add current user message
    messages.push({ role: 'user', content: userMessage });

    try {
      const response = await this.client!.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages,
        temperature: 0.3,
        max_tokens: 800,
        response_format: { type: 'json_object' }
      });

      this.requestCount++;
      
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content received');
      }

      return JSON.parse(content) as PurposeRefinementResponse;
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        if (error.status === 429) {
          // Rate limit hit, implement exponential backoff
          await this.handleRateLimit(error);
          return this.refinePurpose(userMessage, currentPurpose, chatHistory);
        }
        
        throw new Error(`OpenAI API Error: ${error.message}`);
      }
      
      throw error;
    }
  }

  /**
   * Generate content for specific sections (for future research features)
   */
  async generateContent(
    prompt: string, 
    options: GenerationOptions = {}
  ): Promise<string> {
    if (!this.isReady()) {
      throw new Error('OpenAI client not initialized. Please set API key.');
    }

    await this.enforceRateLimit();

    try {
      const response = await this.client!.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens ?? 1500,
        response_format: options.jsonMode ? { type: 'json_object' } : undefined
      });

      this.requestCount++;
      return response.choices[0]?.message?.content || '';
    } catch (error) {
      if (error instanceof OpenAI.APIError && error.status === 429) {
        await this.handleRateLimit(error);
        return this.generateContent(prompt, options);
      }
      throw error;
    }
  }

  /**
   * Generate expert analysis content from sources
   */
  async generateExpertContent(sources: any[], purpose: string): Promise<string> {
    if (!this.isReady()) {
      throw new Error('OpenAI client not initialized. Please set API key.');
    }

    const prompt = `Create expert analysis content for a BrainLift document based on these research sources.

Purpose: ${purpose}

Sources:
${sources.map((source, index) => `
${index + 1}. ${source.title}
   URL: ${source.url}
   Author: ${source.author || 'Unknown'}
   Summary: ${source.summary}
   Key Quotes: ${source.keyQuotes.join(' | ')}
   Credibility Score: ${source.credibilityScore}/10
`).join('\n')}

Please generate a comprehensive expert analysis that:
1. Synthesizes insights from these sources
2. Identifies the most credible experts and their key contributions
3. Explains how their expertise relates to the specific purpose
4. Highlights any consensus or disagreements among experts
5. Provides actionable insights for the purpose

Format the response as well-structured content with clear sections and expert attributions.`;

    return this.generateContent(prompt, { temperature: 0.3, maxTokens: 2000 });
  }

  /**
   * Generate SpikyPOV content from sources
   */
  async generateSpikyPOVContent(sources: any[], purpose: string): Promise<string> {
    if (!this.isReady()) {
      throw new Error('OpenAI client not initialized. Please set API key.');
    }

    const prompt = `Create SpikyPOV analysis for a BrainLift document based on these research sources.

Purpose: ${purpose}

Sources:
${sources.map((source, index) => `
${index + 1}. ${source.title}
   URL: ${source.url}
   Summary: ${source.summary}
   Key Quotes: ${source.keyQuotes.join(' | ')}
`).join('\n')}

Please create a SpikyPOV analysis that includes:

1. **Consensus View**: What most people in this field believe or assume to be true
2. **Contrarian Insight**: A well-researched counter-perspective that challenges conventional wisdom
3. **Supporting Evidence**: Specific data, studies, or examples from the sources that support the contrarian view
4. **Practical Implications**: What this means for the specific purpose and how it could change the approach

Focus on evidence-backed contrarian viewpoints, not mere opinions. The SpikyPOV should be genuinely challenging but supported by credible sources.

Format as clear sections with proper citations.`;

    return this.generateContent(prompt, { temperature: 0.4, maxTokens: 2000 });
  }

  /**
   * Generate Knowledge Tree content from sources
   */
  async generateKnowledgeTreeContent(sources: any[], purpose: string): Promise<string> {
    if (!this.isReady()) {
      throw new Error('OpenAI client not initialized. Please set API key.');
    }

    const prompt = `Create Knowledge Tree analysis for a BrainLift Document based on these research sources.

Purpose: ${purpose}

Sources:
${sources.map((source, index) => `
${index + 1}. ${source.title}
   URL: ${source.url}
   Summary: ${source.summary}
   Key Quotes: ${source.keyQuotes.join(' | ')}
`).join('\n')}

Please create a comprehensive Knowledge Tree analysis that includes:

1. **Current State Analysis**:
   - Existing systems and tools in this domain
   - Current approaches and methodologies
   - Key metrics and success indicators
   - Strengths and limitations of current solutions

2. **Adjacent Fields & Dependencies**:
   - Related domains that intersect with this purpose
   - Background knowledge and foundational concepts
   - Dependencies and prerequisites
   - Cross-domain connections and opportunities

3. **Knowledge Gaps & Opportunities**:
   - Areas where knowledge is incomplete or outdated
   - Emerging trends and future directions
   - Potential innovations and breakthroughs
   - Integration opportunities across fields

Format as well-structured content with clear sections and source citations.`;

    return this.generateContent(prompt, { temperature: 0.3, maxTokens: 2000 });
  }

  /**
   * Extract expert information from a source
   */
  async extractExpertInfo(source: any, purpose: string): Promise<any> {
    if (!this.isReady()) {
      throw new Error('OpenAI client not initialized. Please set API key.');
    }

    const prompt = `Analyze this source to extract expert information for a BrainLift document.

Purpose Context: ${purpose}

Source Content: ${source.content}
Source URL: ${source.url}
Source Title: ${source.title}

Extract and return a JSON object with:
{
  "expertName": "Name of the expert if identifiable",
  "credentials": "Academic or professional credentials",
  "expertise": "Specific area of expertise",
  "relevance": "Why this expert is relevant to the purpose (1-2 sentences)",
  "keyInsights": ["List of 2-3 key insights from this expert"],
  "credibilityIndicators": ["Factors that indicate this expert's credibility"]
}

If no clear expert is identified, return null for expertName but still provide insights about the content's expertise value.`;

    try {
      const response = await this.generateContent(prompt, { 
        temperature: 0.2, 
        maxTokens: 800,
        jsonMode: true 
      });
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to extract expert info:', error);
      return null;
    }
  }

  /**
   * Generate source summary
   */
  async generateSourceSummary(source: any, purpose: string): Promise<string> {
    if (!this.isReady()) {
      throw new Error('OpenAI client not initialized. Please set API key.');
    }

    const prompt = `Summarize this source in the context of the given purpose.

Purpose: ${purpose}

Source: ${source.title}
Content: ${source.content}

Create a concise 2-3 sentence summary that:
1. Explains the main point of the source
2. Highlights its relevance to the purpose
3. Notes any particularly valuable insights or data

Keep it clear and focused on what matters for the purpose.`;

    return this.generateContent(prompt, { temperature: 0.3, maxTokens: 300 });
  }

  /**
   * Handle rate limiting with exponential backoff
   */
  private async handleRateLimit(error: any): Promise<void> {
    const retryAfter = error.headers?.['retry-after'];
    const waitTime = retryAfter 
      ? parseInt(retryAfter) * 1000 
      : Math.min(60000, Math.pow(2, this.requestCount % 6) * 1000);
    
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  /**
   * Get current usage statistics
   */
  getUsageStats(): { requestCount: number; rateLimitRemaining: number } {
    return {
      requestCount: this.requestCount,
      rateLimitRemaining: Math.max(0, this.rpmLimit - this.requestCount)
    };
  }

  /**
   * Reset usage statistics (call this periodically)
   */
  resetUsageStats(): void {
    this.requestCount = 0;
  }
}

// Export singleton instance
export const openAIClient = new OpenAIClient(); 