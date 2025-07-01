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
        max_tokens: options.maxTokens ?? 1000,
        response_format: options.jsonMode ? { type: 'json_object' } : undefined
      });

      this.requestCount++;
      return response.choices[0]?.message?.content || '';
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        if (error.status === 429) {
          await this.handleRateLimit(error);
          return this.generateContent(prompt, options);
        }
        
        throw new Error(`OpenAI API Error: ${error.message}`);
      }
      
      throw error;
    }
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