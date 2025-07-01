# BrainLift Generator - Implementation Guide

## Overview

This document provides concrete implementation specifications for the BrainLift Generator, including data schemas, workflow definitions, API integration patterns, and development setup instructions. This guide bridges the gap between architectural design and actual code implementation.

## Firebase Schema & Data Structure

### Document Structure
```typescript
// Firebase Firestore Collections
interface BrainLiftDocument {
  id: string;                          // Auto-generated document ID
  title: string;                       // User-defined or auto-generated title
  status: DocumentStatus;              // Current document state
  createdAt: Timestamp;               // Creation timestamp
  updatedAt: Timestamp;               // Last modification timestamp
  userId: string;                     // User identifier (anonymous auth)
  
  // Core Content
  purpose: PurposeSection;
  experts: ExpertSection[];
  spikyPOVs: SpikyPOVSection[];
  knowledgeTree: KnowledgeTreeSection[];
  
  // Metadata
  researchProgress: ResearchProgress;
  chatHistory: ChatMessage[];
  projectName?: string;               // Set during save process
  filePath?: string;                  // Final saved file location
}

type DocumentStatus = 
  | 'purpose-definition'              // User defining purpose
  | 'research-active'                 // Background research running
  | 'research-complete'               // Research done, ready for review
  | 'in-review'                       // User reviewing/editing
  | 'completed'                       // Saved to project directory

interface PurposeSection {
  coreProblem: {
    challenge: string;
    importance: string;
    currentImpact: string;
  };
  targetOutcome: {
    successDefinition: string;
    measurableResults: string;
    beneficiaries: string;
  };
  boundaries: {
    included: string;
    excluded: string;
    adjacentProblems: string;
  };
  isComplete: boolean;
}

interface ExpertSection {
  id: string;
  expert: {
    name: string;
    title: string;
    credentials: string;
    focusArea: string;
    relevance: string;
    publicProfiles: string[];
  };
  sources: ResearchSource[];
  generatedContent: string;
  lastUpdated: Timestamp;
}

interface SpikyPOVSection {
  id: string;
  consensusView: string;
  contrarianInsight: string;
  evidence: string[];
  practicalImplications: string;
  sources: ResearchSource[];
  generatedContent: string;
  lastUpdated: Timestamp;
}

interface KnowledgeTreeSection {
  id: string;
  currentState: {
    systems: string;
    tools: string;
    strengths: string;
    weaknesses: string;
    metrics: string;
  };
  relatedAreas: {
    adjacentFields: string[];
    backgroundConcepts: string[];
    dependencies: string[];
  };
  sources: ResearchSource[];
  generatedContent: string;
  lastUpdated: Timestamp;
}

interface ResearchSource {
  id: string;
  url: string;
  title: string;
  author?: string;
  publishDate?: string;
  sourceType: 'academic' | 'industry' | 'news' | 'blog' | 'other';
  credibilityScore: number;           // 1-10 rating
  relevanceScore: number;             // 1-10 rating
  keyQuotes: string[];
  summary: string;
  tavilyMetadata?: any;               // Original Tavily response data
}

interface ResearchProgress {
  experts: {
    status: 'pending' | 'running' | 'completed' | 'error';
    progress: number;                 // 0-100
    startTime?: Timestamp;
    completedTime?: Timestamp;
    errorMessage?: string;
  };
  spikyPOVs: {
    status: 'pending' | 'running' | 'completed' | 'error';
    progress: number;
    startTime?: Timestamp;
    completedTime?: Timestamp;
    errorMessage?: string;
  };
  knowledgeTree: {
    status: 'pending' | 'running' | 'completed' | 'error';
    progress: number;
    startTime?: Timestamp;
    completedTime?: Timestamp;
    errorMessage?: string;
  };
  overallProgress: number;            // 0-100
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Timestamp;
}
```

### Firebase Security Rules
```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // BrainLift documents - user can only access their own
    match /brainlifts/{documentId} {
      allow read, write: if request.auth != null 
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null 
        && request.auth.uid == request.resource.data.userId;
    }
    
    // User preferences and settings
    match /users/{userId} {
      allow read, write: if request.auth != null 
        && request.auth.uid == userId;
    }
  }
}
```

## LangGraph Workflow Definition

### Core Workflow Structure
```python
# langgraph_workflow.py
from langgraph import StateGraph, END
from typing import TypedDict, List
import asyncio

class ResearchState(TypedDict):
    purpose: dict
    research_plan: dict
    expert_results: List[dict]
    spiky_pov_results: List[dict]
    knowledge_tree_results: List[dict]
    progress: dict
    errors: List[str]

def create_research_workflow():
    workflow = StateGraph(ResearchState)
    
    # Define nodes
    workflow.add_node("analyze_purpose", analyze_purpose_node)
    workflow.add_node("create_research_plan", create_research_plan_node)
    workflow.add_node("execute_expert_research", execute_expert_research_node)
    workflow.add_node("execute_spiky_research", execute_spiky_research_node)
    workflow.add_node("execute_knowledge_research", execute_knowledge_research_node)
    workflow.add_node("aggregate_results", aggregate_results_node)
    workflow.add_node("generate_content", generate_content_node)
    
    # Define edges
    workflow.set_entry_point("analyze_purpose")
    workflow.add_edge("analyze_purpose", "create_research_plan")
    workflow.add_edge("create_research_plan", "execute_expert_research")
    workflow.add_edge("create_research_plan", "execute_spiky_research")
    workflow.add_edge("create_research_plan", "execute_knowledge_research")
    
    # Conditional edge for when all research is complete
    workflow.add_conditional_edges(
        "execute_expert_research",
        check_all_research_complete,
        {
            "continue": END,
            "aggregate": "aggregate_results"
        }
    )
    
    workflow.add_edge("aggregate_results", "generate_content")
    workflow.add_edge("generate_content", END)
    
    return workflow.compile()

async def analyze_purpose_node(state: ResearchState) -> ResearchState:
    """Analyze the purpose to identify key research domains and topics."""
    purpose = state["purpose"]
    
    # Extract key topics, domains, and research directions
    analysis_prompt = f"""
    Analyze this purpose statement and identify:
    1. Key domains and fields relevant to this problem
    2. Specific topics that need expert analysis
    3. Areas where conventional wisdom might be challenged
    4. Background knowledge and dependencies to explore
    
    Purpose: {purpose}
    
    Return structured analysis for research planning.
    """
    
    # Call OpenAI to analyze purpose
    analysis = await call_openai(analysis_prompt)
    
    state["research_plan"] = {
        "domains": analysis.get("domains", []),
        "expert_topics": analysis.get("expert_topics", []),
        "contrarian_areas": analysis.get("contrarian_areas", []),
        "background_concepts": analysis.get("background_concepts", [])
    }
    
    return state

async def create_research_plan_node(state: ResearchState) -> ResearchState:
    """Create specific search queries and research strategies for each section."""
    plan = state["research_plan"]
    
    # Generate specific Tavily search queries
    expert_queries = generate_expert_queries(plan["domains"], plan["expert_topics"])
    spiky_queries = generate_spiky_queries(plan["contrarian_areas"])
    knowledge_queries = generate_knowledge_queries(plan["background_concepts"])
    
    state["research_plan"].update({
        "expert_queries": expert_queries,
        "spiky_queries": spiky_queries,
        "knowledge_queries": knowledge_queries
    })
    
    return state

def generate_expert_queries(domains: List[str], topics: List[str]) -> List[str]:
    """Generate Tavily search queries for finding experts."""
    queries = []
    for domain in domains:
        for topic in topics:
            queries.extend([
                f"leading experts {domain} {topic} research",
                f"top researchers {topic} {domain} publications",
                f"thought leaders {domain} {topic} industry",
                f"professors {topic} {domain} university"
            ])
    return queries[:10]  # Limit to top 10 queries

def generate_spiky_queries(contrarian_areas: List[str]) -> List[str]:
    """Generate queries for finding contrarian viewpoints."""
    queries = []
    for area in contrarian_areas:
        queries.extend([
            f"conventional wisdom wrong {area}",
            f"contrarian view {area} evidence",
            f"debunked myths {area}",
            f"surprising research findings {area}",
            f"counterintuitive {area} studies"
        ])
    return queries[:10]

def generate_knowledge_queries(concepts: List[str]) -> List[str]:
    """Generate queries for mapping knowledge dependencies."""
    queries = []
    for concept in concepts:
        queries.extend([
            f"current state {concept} tools systems",
            f"background knowledge {concept}",
            f"dependencies {concept} related fields",
            f"adjacent areas {concept} connections"
        ])
    return queries[:10]
```

### Worker Thread Integration
```typescript
// worker-thread-interface.ts
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

// Message types for worker communication
export type WorkerMessage = 
  | { type: 'JOB_START'; payload: WorkerJob }
  | { type: 'PROGRESS_UPDATE'; payload: { progress: number; status: string } }
  | { type: 'RESULT_PARTIAL'; payload: { sources: ResearchSource[] } }
  | { type: 'JOB_COMPLETE'; payload: WorkerResult }
  | { type: 'JOB_ERROR'; payload: { error: string; retryable: boolean } }
  | { type: 'JOB_STOP'; payload: { cleanup: boolean } };
```

## API Integration Patterns

### Tavily Search Integration
```typescript
// tavily-client.ts
export class TavilyClient {
  private apiKey: string;
  private baseUrl = 'https://api.tavily.com';
  private requestCount = 0;
  private dailyLimit = 1000;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchForExperts(queries: string[], domain: string): Promise<TavilyResult[]> {
    const results: TavilyResult[] = [];
    
    for (const query of queries) {
      if (this.requestCount >= this.dailyLimit) {
        throw new Error('Daily API limit reached');
      }

      const searchParams = {
        query: query,
        search_depth: 'advanced',
        include_domains: this.getExpertDomains(domain),
        exclude_domains: ['wikipedia.org', 'reddit.com'], // Filter low-quality sources
        max_results: 5,
        include_raw_content: true
      };

      const result = await this.makeRequest('/search', searchParams);
      results.push(...result.results);
      this.requestCount++;
      
      // Rate limiting - 1 request per second
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return this.rankAndFilterResults(results, 'expert');
  }

  async searchForSpikyPOVs(queries: string[]): Promise<TavilyResult[]> {
    const results: TavilyResult[] = [];
    
    for (const query of queries) {
      const searchParams = {
        query: query,
        search_depth: 'advanced',
        include_domains: this.getContrarianDomains(),
        max_results: 5,
        include_raw_content: true
      };

      const result = await this.makeRequest('/search', searchParams);
      results.push(...result.results);
      this.requestCount++;
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return this.rankAndFilterResults(results, 'contrarian');
  }

  private getExpertDomains(domain: string): string[] {
    const academicDomains = [
      'edu', 'ac.uk', 'researchgate.net', 'scholar.google.com',
      'arxiv.org', 'ieee.org', 'acm.org'
    ];
    
    const industryDomains = [
      'mckinsey.com', 'bcg.com', 'deloitte.com', 'pwc.com',
      'hbr.org', 'mit.edu', 'stanford.edu'
    ];

    return [...academicDomains, ...industryDomains];
  }

  private getContrarianDomains(): string[] {
    return [
      'contrariancapital.com', 'marginalrevolution.com',
      'overcomingbias.com', 'lesswrong.com', 'slatestarcodex.com'
    ];
  }

  private rankAndFilterResults(results: TavilyResult[], type: string): TavilyResult[] {
    return results
      .filter(result => this.isHighQuality(result, type))
      .sort((a, b) => this.calculateRelevanceScore(b, type) - this.calculateRelevanceScore(a, type))
      .slice(0, 5); // Top 5 results
  }

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
    
    return score;
  }
}
```

### OpenAI Integration
```typescript
// openai-client.ts
export class OpenAIClient {
  private client: OpenAI;
  private requestCount = 0;
  private rpmLimit = 10000;
  private lastRequestTime = 0;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async analyzeExpertSource(source: TavilyResult, purpose: string): Promise<ExpertAnalysis> {
    await this.enforceRateLimit();

    const prompt = `
    Analyze this source to extract expert information for a BrainLift document.
    
    Purpose Context: ${purpose}
    
    Source Content: ${source.content}
    Source URL: ${source.url}
    
    Extract:
    1. Expert name and credentials
    2. Their specific expertise area
    3. Why they're relevant to this purpose
    4. Key insights or quotes
    5. Credibility assessment (1-10)
    
    Format as structured JSON.
    `;

    const response = await this.client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    this.requestCount++;
    return JSON.parse(response.choices[0].message.content || '{}');
  }

  async generateSpikyPOVContent(sources: TavilyResult[], purpose: string): Promise<string> {
    await this.enforceRateLimit();

    const prompt = `
    Create a SpikyPOV section for a BrainLift document using these sources.
    
    Purpose: ${purpose}
    
    Sources: ${sources.map(s => `${s.title}: ${s.content}`).join('\n\n')}
    
    Format:
    1. Consensus View: [What most people believe]
    2. Contrarian Insight: [The counter-consensus view with evidence]
    3. Supporting Evidence: [Specific data, studies, examples]
    4. Practical Implications: [What this means for the purpose]
    
    Focus on evidence-backed contrarian viewpoints, not mere opinions.
    `;

    const response = await this.client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 1500
    });

    this.requestCount++;
    return response.choices[0].message.content || '';
  }

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
}
```

## Development Environment Setup

### Prerequisites
```bash
# Required Node.js version
node --version  # Should be 18+ (LTS)
npm --version   # Should be 9+

# Install global dependencies
npm install -g concurrently cross-env
```

### Project Setup
```bash
# 1. Clone and setup project
git clone <repository-url>
cd brainlift-generator
npm install

# 2. Environment configuration
cp .env.example .env

# 3. Required environment variables
# .env file contents:
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_TAVILY_API_KEY=your_tavily_api_key
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# Development vs Production
NODE_ENV=development
```

### Development Scripts
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:vite\" \"npm run dev:electron\"",
    "dev:vite": "vite",
    "dev:electron": "wait-on http://localhost:5173 && electron .",
    "build": "npm run build:vite && npm run build:electron",
    "build:vite": "vite build",
    "build:electron": "electron-builder",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src --ext .ts,.tsx",
    "type-check": "tsc --noEmit"
  }
}
```

### File System Integration
```typescript
// services/file-system.ts
import * as fs from 'fs-extra';
import * as path from 'path';

export class FileSystemService {
  private readonly baseDirectory = 'C:\\Users\\seana\\OneDrive\\Documents\\Gauntlet Projects';

  async saveDocumentToProject(document: BrainLiftDocument, projectName: string): Promise<string> {
    const projectDir = path.join(this.baseDirectory, projectName);
    const docsDir = path.join(projectDir, 'docs');
    
    // Ensure directories exist
    await fs.ensureDir(docsDir);
    
    // Generate filename
    const filename = this.generateFilename(document.title);
    const filePath = path.join(docsDir, filename);
    
    // Check for existing file and handle conflicts
    const finalPath = await this.handleFileConflict(filePath);
    
    // Convert document to markdown
    const markdownContent = this.convertToMarkdown(document);
    
    // Write file
    await fs.writeFile(finalPath, markdownContent, 'utf-8');
    
    return finalPath;
  }

  private generateFilename(title: string): string {
    const sanitized = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    
    const timestamp = new Date().toISOString().split('T')[0];
    return `brainlift-${sanitized}-${timestamp}.md`;
  }

  private async handleFileConflict(filePath: string): Promise<string> {
    if (!(await fs.pathExists(filePath))) {
      return filePath;
    }

    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const name = path.basename(filePath, ext);
    
    let counter = 1;
    let newPath: string;
    
    do {
      newPath = path.join(dir, `${name}-${counter}${ext}`);
      counter++;
    } while (await fs.pathExists(newPath));
    
    return newPath;
  }

  private convertToMarkdown(document: BrainLiftDocument): string {
    return `# ${document.title}

## Purpose

### Core Problem
**Challenge:** ${document.purpose.coreProblem.challenge}
**Importance:** ${document.purpose.coreProblem.importance}
**Current Impact:** ${document.purpose.coreProblem.currentImpact}

### Target Outcome
**Success Definition:** ${document.purpose.targetOutcome.successDefinition}
**Measurable Results:** ${document.purpose.targetOutcome.measurableResults}
**Beneficiaries:** ${document.purpose.targetOutcome.beneficiaries}

### Boundaries
**Included:** ${document.purpose.boundaries.included}
**Excluded:** ${document.purpose.boundaries.excluded}
**Adjacent Problems:** ${document.purpose.boundaries.adjacentProblems}

## Experts

${document.experts.map(expert => `
### ${expert.expert.name}
**Title:** ${expert.expert.title}
**Focus Area:** ${expert.expert.focusArea}
**Relevance:** ${expert.expert.relevance}

${expert.generatedContent}

**Sources:**
${expert.sources.map(source => `- [${source.title}](${source.url})`).join('\n')}
`).join('\n')}

## SpikyPOVs

${document.spikyPOVs.map(spiky => `
### ${spiky.consensusView} vs ${spiky.contrarianInsight}

${spiky.generatedContent}

**Sources:**
${spiky.sources.map(source => `- [${source.title}](${source.url})`).join('\n')}
`).join('\n')}

## Knowledge Tree

${document.knowledgeTree.map(knowledge => `
${knowledge.generatedContent}

**Sources:**
${knowledge.sources.map(source => `- [${source.title}](${source.url})`).join('\n')}
`).join('\n')}

---
*Generated on ${new Date().toISOString()} by BrainLift Generator*
`;
  }
}
```

This implementation guide provides all the concrete details needed to begin development, including exact data structures, API integration patterns, workflow definitions, and development setup instructions. Each section can be directly translated into working code.

---
➡️ The word "serendipity" was coined by Horace Walpole in 1754, inspired by a Persian fairy tale called "The Three Princes of Serendip." 