# BrainLift Generator - Technology Stack

## Overview

This document defines the complete technology stack for the BrainLift Generator desktop application, including comprehensive best practices, limitations, and conventions for each technology. The stack is designed to support AI-first development practices, background workflow processing, and seamless desktop integration for Windows.

## Core Technologies (Predefined)

### Desktop Framework
- **Electron** - Cross-platform desktop application framework
- **React** - Frontend user interface library
- **TypeScript** - Type-safe JavaScript development

### AI & Workflow Orchestration
- **LangGraph** - Intelligent workflow management and AI orchestration
- **OpenAI API** - Natural language processing and content generation

### Cloud Services
- **Firebase** - Document history, user preferences, and project management

## Technology Deep Dive with Best Practices

### Electron Framework

#### Best Practices
- **Process Isolation**: Always separate main and renderer processes for security and stability
- **Security Configuration**: Enable context isolation and disable node integration in renderer
- **IPC Communication**: Use typed interfaces for all Inter-Process Communication
- **Memory Management**: Properly dispose of windows and clean up event listeners
- **Auto-updater**: Implement proper update mechanisms with rollback capabilities
- **Native Modules**: Minimize native module dependencies to reduce complexity

#### Common Pitfalls
- **Memory Leaks**: Not properly cleaning up event listeners, DOM references, and subscriptions
- **Security Vulnerabilities**: Exposing Node.js APIs to renderer without proper validation
- **Performance Issues**: Running CPU-intensive tasks on the main thread blocking UI
- **Bundle Size**: Including unnecessary dependencies inflating the final application size
- **Platform Inconsistencies**: Not testing behavior differences across operating systems

#### Limitations
- **Resource Usage**: Higher memory footprint (50-200MB) compared to native applications
- **Security Model**: Complex security configuration required to prevent code injection
- **Platform Differences**: Subtle behavior differences across Windows, macOS, and Linux
- **Update Complexity**: Managing application updates while preserving user data
- **Performance Overhead**: Additional abstraction layer impacts raw performance

#### Critical Configuration
```typescript
// Main process security configuration (REQUIRED)
const mainWindow = new BrowserWindow({
  webPreferences: {
    contextIsolation: true,           // MANDATORY for security
    nodeIntegration: false,           // MANDATORY for security
    sandbox: true,                    // Recommended for additional security
    preload: path.join(__dirname, 'preload.js'),
    webSecurity: true                 // Never disable in production
  }
});

// Content Security Policy implementation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);  // Safely open external links
  });
  
  // Prevent navigation to external URLs
  contents.on('will-navigate', (event, url) => {
    if (url !== contents.getURL()) {
      event.preventDefault();
    }
  });
});
```

### React 18+ Framework

#### Best Practices
- **Component Composition**: Prefer composition over inheritance for better reusability
- **State Management**: Use local state for component-specific data, global state for shared data
- **Effect Management**: Always provide cleanup functions in useEffect hooks
- **Performance Optimization**: Use React.memo, useMemo, and useCallback strategically
- **Error Boundaries**: Implement error boundaries for graceful error handling
- **Strict Mode**: Always use React.StrictMode in development

#### Common Pitfalls
- **Stale Closures**: Capturing stale values in useEffect and event handlers
- **Infinite Re-renders**: Dependencies array causing unnecessary effect re-runs
- **Memory Leaks**: Not cleaning up subscriptions, timers, and event listeners
- **Prop Drilling**: Passing props through multiple component layers unnecessarily
- **Key Prop Misuse**: Using array indices as keys for dynamic lists

#### Limitations
- **Learning Curve**: Hooks and concurrent features require significant understanding
- **Bundle Size**: Can become large with many dependencies and poor tree-shaking
- **SEO Limitations**: Server-side rendering not applicable in Electron context
- **Debugging Complexity**: Complex state updates and effect dependencies hard to trace
- **Performance Overhead**: Virtual DOM reconciliation adds computational cost

#### React 18 Specific Implementation
```typescript
// Proper Suspense usage with Error Boundaries
function DataComponent() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <Suspense fallback={<LoadingSpinner />}>
        <AsyncDataComponent />
      </Suspense>
    </ErrorBoundary>
  );
}

// Proper cleanup in effects (CRITICAL)
useEffect(() => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    // Cleanup timeout
  }, 5000);
  
  fetchData(controller.signal)
    .then(setData)
    .catch(error => {
      if (!controller.signal.aborted) {
        setError(error);
      }
    });
    
  // MANDATORY cleanup function
  return () => {
    controller.abort();
    clearTimeout(timeoutId);
  };
}, []);

// Proper memoization patterns
const MemoizedComponent = React.memo(({ data, onUpdate }) => {
  const processedData = useMemo(() => {
    return expensiveDataProcessing(data);
  }, [data]);
  
  const handleUpdate = useCallback((newValue) => {
    onUpdate(newValue);
  }, [onUpdate]);
  
  return <div>{/* Component JSX */}</div>;
});
```

## Technology Deep Dive with Best Practices

### Electron Framework

#### Best Practices
- **Process Isolation**: Always separate main and renderer processes
- **Security**: Enable context isolation and disable node integration in renderer
- **IPC Communication**: Use typed interfaces for IPC messages
- **Memory Management**: Properly dispose of windows and clean up event listeners
- **Auto-updater**: Implement proper update mechanisms with rollback capabilities

#### Common Pitfalls
- **Memory Leaks**: Not properly cleaning up event listeners and DOM references
- **Security Vulnerabilities**: Exposing Node.js APIs to renderer without proper validation
- **Performance Issues**: Running CPU-intensive tasks on main thread
- **Bundle Size**: Including unnecessary dependencies in the final build

#### Limitations
- **Resource Usage**: Higher memory footprint compared to native applications
- **Security Model**: Requires careful configuration to prevent code injection
- **Platform Differences**: Subtle behavior differences across operating systems
- **Update Complexity**: Managing application updates and user data migration

#### Configuration Requirements
```typescript
// Main process security configuration
const mainWindow = new BrowserWindow({
  webPreferences: {
    contextIsolation: true,           // REQUIRED for security
    nodeIntegration: false,           // REQUIRED for security
    sandbox: true,                    // Recommended for security
    preload: path.join(__dirname, 'preload.js')
  }
});

// Content Security Policy
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });
});
```

### React 18+ Framework

#### Best Practices
- **Component Composition**: Prefer composition over inheritance
- **State Management**: Use local state for component-specific data
- **Effect Management**: Properly handle cleanup in useEffect
- **Performance**: Use React.memo, useMemo, and useCallback judiciously
- **Error Boundaries**: Implement error boundaries for graceful error handling

#### Common Pitfalls
- **Stale Closures**: Capturing stale values in useEffect and event handlers
- **Infinite Re-renders**: Dependencies causing unnecessary effect re-runs
- **Memory Leaks**: Not cleaning up subscriptions and timers
- **Prop Drilling**: Passing props through multiple component layers

#### Limitations
- **Learning Curve**: Hooks and concurrent features require understanding
- **Bundle Size**: Can become large with many dependencies
- **SEO**: Limited server-side rendering in Electron context
- **Debugging**: Complex state updates can be hard to trace

#### React 18 Specific Considerations
```typescript
// Proper Suspense usage for data loading
function DataComponent() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ErrorBoundary>
        <AsyncDataComponent />
      </ErrorBoundary>
    </Suspense>
  );
}

// Proper cleanup in effects
useEffect(() => {
  const controller = new AbortController();
  
  fetchData(controller.signal)
    .then(setData)
    .catch(error => {
      if (!controller.signal.aborted) {
        setError(error);
      }
    });
    
  return () => controller.abort();
}, []);
```

### TypeScript 5+ Development

#### Best Practices
- **Strict Configuration**: Enable all strict type checking options
- **Type Definitions**: Create comprehensive interfaces for all data structures
- **Generic Types**: Use generics for reusable components and functions
- **Utility Types**: Leverage built-in utility types (Partial, Pick, Omit)
- **Type Guards**: Implement proper runtime type checking

#### Common Pitfalls
- **Any Type Abuse**: Overusing `any` defeats the purpose of TypeScript
- **Type Assertions**: Unsafe type assertions without runtime validation
- **Complex Types**: Overly complex type definitions that hurt readability
- **Missing Null Checks**: Not handling null/undefined cases properly

#### Limitations
- **Compilation Time**: Large projects can have slow compilation
- **Learning Curve**: Advanced type features require significant learning
- **Runtime Overhead**: No runtime type checking without additional libraries
- **Third-party Types**: Inconsistent or missing type definitions

#### Configuration Requirements
```typescript
// tsconfig.json - Strict configuration
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true
  }
}

// Proper type definitions
interface APIResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
}

// Type guards for runtime safety
function isValidUser(obj: unknown): obj is User {
  return typeof obj === 'object' && 
         obj !== null && 
         'id' in obj && 
         'name' in obj;
}
```

### Tailwind CSS 4+ Styling

#### Best Practices
- **Utility-First**: Use utility classes instead of custom CSS
- **Component Extraction**: Extract repeated patterns into components
- **Responsive Design**: Use mobile-first responsive design principles
- **Design System**: Establish consistent spacing, colors, and typography
- **Performance**: Use PurgeCSS to remove unused styles

#### Common Pitfalls
- **Class Name Explosion**: Too many utility classes making HTML unreadable
- **Inconsistent Spacing**: Not following consistent spacing scale
- **Color Misuse**: Using arbitrary colors instead of design system colors
- **Responsive Breakpoints**: Inconsistent responsive design patterns

#### Limitations
- **Learning Curve**: Requires memorizing utility class names
- **Bundle Size**: Can be large without proper purging
- **Customization**: Limited customization without configuration changes
- **Team Adoption**: Requires team-wide adoption for consistency

#### Configuration Requirements
```typescript
// tailwind.config.js - Optimized for desktop app
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          // ... full color scale
          900: '#0c4a6e'
        }
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem'
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ]
}
```

### Zustand State Management

#### Best Practices
- **Single Store Pattern**: Use one main store with slices for different concerns
- **Immutable Updates**: Always return new state objects, never mutate existing state
- **Computed Values**: Use selectors for derived state and expensive computations
- **Persistence Strategy**: Use persist middleware for critical application state only
- **Type Safety**: Properly type all store interfaces and actions
- **Action Creators**: Create clear, descriptive action creator functions

#### Common Pitfalls
- **State Mutation**: Directly mutating state objects instead of creating new ones
- **Over-subscription**: Components subscribing to too much state causing unnecessary re-renders
- **Complex Nested State**: Overly nested state structures that are hard to update
- **Side Effects in Store**: Performing side effects directly in store actions
- **Missing Selectors**: Not using selectors for computed values and derived state

#### Limitations
- **DevTools**: Limited debugging tools compared to Redux ecosystem
- **Middleware Ecosystem**: Fewer middleware options than Redux
- **Complex State Logic**: Can become unwieldy with very complex state management needs
- **Time Travel Debugging**: No built-in time travel debugging capabilities
- **Learning Resources**: Fewer learning resources compared to more established solutions

#### Implementation Pattern
```typescript
interface AppState {
  documents: BrainLiftDocument[];
  currentDocument: string | null;
  researchProgress: ResearchProgress;
  
  // Actions
  addDocument: (doc: BrainLiftDocument) => void;
  updateDocument: (id: string, updates: Partial<BrainLiftDocument>) => void;
  setCurrentDocument: (id: string) => void;
}

const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      documents: [],
      currentDocument: null,
      researchProgress: { overall: 0 },
      
      addDocument: (doc) => set((state) => ({
        documents: [...state.documents, doc]
      })),
      
      updateDocument: (id, updates) => set((state) => ({
        documents: state.documents.map(doc => 
          doc.id === id ? { ...doc, ...updates } : doc
        )
      }))
    }),
    {
      name: 'brainlift-storage',
      partialize: (state) => ({ 
        documents: state.documents,
        currentDocument: state.currentDocument 
      })
    }
  )
);
```

#### Common Pitfalls
- **Mutation**: Directly mutating state objects
- **Over-subscription**: Components subscribing to too much state
- **Complex State**: Overly nested state structures
- **Side Effects**: Performing side effects directly in store actions

#### Limitations
- **DevTools**: Limited debugging tools compared to Redux
- **Middleware**: Fewer middleware options than Redux ecosystem
- **Complex State**: Can become unwieldy with very complex state
- **Time Travel**: No built-in time travel debugging

#### Implementation Pattern
```typescript
interface AppState {
  documents: BrainLiftDocument[];
  currentDocument: string | null;
  researchProgress: ResearchProgress;
  
  // Actions
  addDocument: (doc: BrainLiftDocument) => void;
  updateDocument: (id: string, updates: Partial<BrainLiftDocument>) => void;
  setCurrentDocument: (id: string) => void;
}

const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      documents: [],
      currentDocument: null,
      researchProgress: { overall: 0 },
      
      addDocument: (doc) => set((state) => ({
        documents: [...state.documents, doc]
      })),
      
      updateDocument: (id, updates) => set((state) => ({
        documents: state.documents.map(doc => 
          doc.id === id ? { ...doc, ...updates } : doc
        )
      }))
    }),
    {
      name: 'brainlift-storage',
      partialize: (state) => ({ 
        documents: state.documents,
        currentDocument: state.currentDocument 
      })
    }
  )
);
```

### LangGraph Workflow Orchestration

#### Best Practices
- **State Management**: Keep workflow state minimal and serializable
- **Error Handling**: Implement comprehensive error handling at each node
- **Monitoring**: Add logging and monitoring to track workflow execution
- **Conditional Logic**: Use conditional edges for complex decision making
- **Resource Management**: Properly manage API connections and cleanup

#### Common Pitfalls
- **State Bloat**: Storing too much data in workflow state
- **Blocking Operations**: Long-running operations blocking the workflow
- **Error Propagation**: Not properly handling and propagating errors
- **Resource Leaks**: Not cleaning up resources after workflow completion

#### Limitations
- **Python Dependency**: Requires Python runtime in Electron app
- **Learning Curve**: Complex workflow concepts require understanding
- **Debugging**: Difficult to debug complex workflow interactions
- **Performance**: Overhead of workflow orchestration

#### Implementation Considerations
```python
# Proper error handling in LangGraph nodes
async def research_node(state: ResearchState) -> ResearchState:
    try:
        # Perform research operations
        results = await perform_research(state['queries'])
        
        return {
            **state,
            'results': results,
            'status': 'completed'
        }
    except APIRateLimitError as e:
        # Handle rate limiting with exponential backoff
        await asyncio.sleep(calculate_backoff(e.retry_after))
        return {
            **state,
            'status': 'retry_needed',
            'error': str(e)
        }
    except Exception as e:
        # Log error and mark as failed
        logger.error(f"Research failed: {str(e)}")
        return {
            **state,
            'status': 'failed',
            'error': str(e)
        }
```

### OpenAI API Integration

#### Best Practices
- **Rate Limiting**: Implement proper rate limiting and backoff strategies
- **Error Handling**: Handle all API error types appropriately
- **Token Management**: Monitor and optimize token usage
- **Prompt Engineering**: Use clear, specific prompts with examples
- **Response Validation**: Validate API responses before using

#### Common Pitfalls
- **Rate Limit Violations**: Exceeding API rate limits
- **Token Waste**: Inefficient prompts consuming too many tokens
- **Error Handling**: Not handling network errors and API failures
- **Context Management**: Losing important context in conversations

#### Limitations
- **Cost**: API calls can become expensive with high usage
- **Rate Limits**: Strict rate limiting can slow down operations
- **Latency**: Network latency affects response times
- **Reliability**: Dependent on external service availability

#### Implementation Pattern
```typescript
class OpenAIService {
  private client: OpenAI;
  private rateLimiter: RateLimiter;
  
  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
    this.rateLimiter = new RateLimiter({
      tokensPerMinute: 10000,
      requestsPerMinute: 500
    });
  }
  
  async generateContent(prompt: string, options: GenerationOptions = {}) {
    await this.rateLimiter.waitForToken();
    
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens ?? 1000,
        response_format: options.jsonMode ? { type: 'json_object' } : undefined
      });
      
      return response.choices[0]?.message?.content || '';
    } catch (error) {
      if (error instanceof APIError) {
        if (error.status === 429) {
          // Rate limit hit, implement exponential backoff
          await this.handleRateLimit(error);
          return this.generateContent(prompt, options);
        }
      }
      throw error;
    }
  }
}
```

### Tavily Search API Integration

#### Best Practices
- **Query Optimization**: Craft specific, targeted search queries
- **Result Filtering**: Filter results by domain, date, and relevance
- **Rate Limiting**: Respect daily and per-minute rate limits
- **Source Quality**: Prioritize high-quality, credible sources
- **Caching**: Cache search results to avoid duplicate requests

#### Common Pitfalls
- **Generic Queries**: Using too broad or generic search terms
- **Rate Limit Violations**: Exceeding daily request limits
- **Poor Source Quality**: Not filtering for credible sources
- **Duplicate Requests**: Making redundant API calls

#### Limitations
- **Daily Limits**: Strict daily request limits (1000/day for basic plans)
- **Search Quality**: Results quality depends on query formulation
- **Cost**: Can become expensive with high usage
- **Coverage**: May not cover all domains equally well

#### Implementation Pattern
```typescript
class TavilyService {
  private apiKey: string;
  private requestCount = 0;
  private dailyLimit = 1000;
  private cache = new Map<string, TavilyResult[]>();
  
  async search(query: string, options: SearchOptions = {}): Promise<TavilyResult[]> {
    // Check cache first
    const cacheKey = `${query}-${JSON.stringify(options)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    // Check rate limits
    if (this.requestCount >= this.dailyLimit) {
      throw new Error('Daily API limit reached');
    }
    
    const searchParams = {
      query,
      search_depth: options.depth ?? 'advanced',
      include_domains: options.includeDomains ?? [],
      exclude_domains: options.excludeDomains ?? ['wikipedia.org'],
      max_results: options.maxResults ?? 5,
      include_raw_content: true
    };
    
    const results = await this.makeRequest('/search', searchParams);
    this.requestCount++;
    
    // Cache results
    this.cache.set(cacheKey, results);
    
    return results;
  }
}
```

### Firebase Integration

#### Best Practices
- **Security Rules**: Implement comprehensive security rules
- **Offline Persistence**: Enable offline persistence for better UX
- **Data Structure**: Design efficient document structures
- **Indexing**: Create proper indexes for queries
- **Error Handling**: Handle network errors and auth failures

#### Common Pitfalls
- **Security Rules**: Inadequate or overly permissive security rules
- **Data Structure**: Inefficient nested data structures
- **Query Optimization**: Unoptimized queries causing performance issues
- **Authentication**: Not properly handling authentication state

#### Limitations
- **Offline Limitations**: Limited offline query capabilities
- **Cost**: Can become expensive with high read/write operations
- **Real-time**: Real-time features may not be needed for desktop app
- **Vendor Lock-in**: Tight coupling to Google's ecosystem

#### Configuration Pattern
```typescript
// Firebase configuration with offline persistence
const firebaseConfig = {
  // ... config
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Enable offline persistence
enablePersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab');
  } else if (err.code === 'unimplemented') {
    console.warn('Browser doesn\'t support persistence');
  }
});

// Proper error handling for Firestore operations
async function saveDocument(doc: BrainLiftDocument): Promise<void> {
  try {
    await setDoc(doc(db, 'documents', doc.id), doc);
  } catch (error) {
    if (error instanceof FirestoreError) {
      switch (error.code) {
        case 'permission-denied':
          throw new Error('Access denied. Please check your permissions.');
        case 'unavailable':
          throw new Error('Service temporarily unavailable. Please try again.');
        default:
          throw new Error(`Failed to save document: ${error.message}`);
      }
    }
    throw error;
  }
}
```

### Node.js Worker Threads

#### Best Practices
- **Resource Management**: Properly initialize and cleanup worker resources
- **Message Passing**: Use structured message passing with type safety
- **Error Handling**: Handle worker errors and crashes gracefully
- **Load Balancing**: Distribute work evenly across workers
- **Memory Management**: Monitor worker memory usage

#### Common Pitfalls
- **Memory Leaks**: Not properly cleaning up worker resources
- **Blocking Operations**: Running blocking operations in workers
- **Message Overhead**: Passing large objects between threads
- **Error Propagation**: Not properly handling worker errors

#### Limitations
- **Serialization**: Data must be serializable for message passing
- **Debugging**: Harder to debug worker thread code
- **Resource Usage**: Each worker consumes additional memory
- **Complexity**: Adds complexity to application architecture

#### Implementation Pattern
```typescript
// Worker thread manager
class WorkerManager {
  private workers: Worker[] = [];
  private jobQueue: WorkerJob[] = [];
  private activeJobs = new Map<string, { workerId: number; job: WorkerJob }>();
  
  constructor(private workerCount: number = 3) {
    this.initializeWorkers();
  }
  
  private initializeWorkers() {
    for (let i = 0; i < this.workerCount; i++) {
      const worker = new Worker(path.join(__dirname, 'research-worker.js'));
      
      worker.on('message', (message: WorkerMessage) => {
        this.handleWorkerMessage(i, message);
      });
      
      worker.on('error', (error) => {
        console.error(`Worker ${i} error:`, error);
        this.restartWorker(i);
      });
      
      worker.on('exit', (code) => {
        if (code !== 0) {
          console.error(`Worker ${i} exited with code ${code}`);
          this.restartWorker(i);
        }
      });
      
      this.workers[i] = worker;
    }
  }
  
  async executeJob(job: WorkerJob): Promise<WorkerResult> {
    return new Promise((resolve, reject) => {
      const availableWorker = this.findAvailableWorker();
      
      if (availableWorker === -1) {
        this.jobQueue.push(job);
        return;
      }
      
      this.activeJobs.set(job.id, { workerId: availableWorker, job });
      
      const timeout = setTimeout(() => {
        reject(new Error(`Job ${job.id} timed out`));
        this.terminateJob(job.id);
      }, 300000); // 5 minute timeout
      
      job.resolve = (result: WorkerResult) => {
        clearTimeout(timeout);
        resolve(result);
      };
      
      job.reject = (error: Error) => {
        clearTimeout(timeout);
        reject(error);
      };
      
      this.workers[availableWorker].postMessage({
        type: 'JOB_START',
        payload: job
      });
    });
  }
}
```

## Development Environment Setup

### Required Node.js Version
- **Node.js 18+** - LTS version for stability
- **npm 9+** - Package manager

### Development Dependencies
```json
{
  "electron": "^27.0.0",
  "react": "^18.2.0",
  "typescript": "^5.0.0",
  "vite": "^5.0.0",
  "tailwindcss": "^4.0.0",
  "@types/node": "^20.0.0"
}
```

### Production Dependencies
```json
{
  "zustand": "^4.4.0",
  "firebase": "^10.5.0",
  "fs-extra": "^11.1.0",
  "node-notifier": "^10.0.0",
  "electron-store": "^8.1.0",
  "langgraph": "^0.1.0"
}
```

## Security Considerations

### API Key Management
- **electron-store** - Encrypted local storage for API keys
- **Environment Variables** - Development configuration
- **Process Isolation** - Separate main and renderer processes

### Data Protection
- **Firebase Security Rules** - Cloud data access control
- **Firebase Offline Encryption** - Local cache encryption
- **Content Security Policy** - XSS protection

## Performance Optimizations

### Frontend Performance
- **React.memo** - Component memoization
- **useMemo/useCallback** - Hook optimization
- **Code Splitting** - Lazy loading of components
- **Virtual Scrolling** - Efficient list rendering

### Backend Performance
- **Worker Thread Pooling** - Efficient parallel processing
- **Firebase Offline Caching** - Automatic result caching
- **Job Queue Optimization** - Efficient task processing
- **Memory Management** - Garbage collection optimization

## Deployment Strategy

### Build Process
1. **TypeScript Compilation** - Type checking and JS generation
2. **Vite Build** - Frontend optimization and bundling
3. **Electron Builder** - Desktop application packaging
4. **Code Signing** - Windows application signing
5. **Distribution** - Installer generation

### Release Management
- **Semantic Versioning** - Version management
- **Automated Updates** - electron-updater integration
- **Error Reporting** - Crash reporting and analytics
- **Performance Monitoring** - Application performance tracking

## Critical Implementation Guidelines

### Error Handling Strategy
```typescript
// Centralized error handling
class ErrorHandler {
  static handle(error: unknown, context: string): void {
    if (error instanceof APIError) {
      // Handle API-specific errors
      this.handleAPIError(error, context);
    } else if (error instanceof NetworkError) {
      // Handle network errors
      this.handleNetworkError(error, context);
    } else {
      // Handle unexpected errors
      this.handleUnknownError(error, context);
    }
  }
  
  private static handleAPIError(error: APIError, context: string): void {
    switch (error.status) {
      case 429:
        // Rate limit - implement backoff
        this.scheduleRetry(context, error.retryAfter);
        break;
      case 401:
        // Authentication error
        this.handleAuthError(context);
        break;
      default:
        this.logError(error, context);
    }
  }
}
```

### Memory Management
```typescript
// Proper cleanup patterns
class ComponentWithCleanup extends React.Component {
  private abortController = new AbortController();
  private intervals: NodeJS.Timeout[] = [];
  
  componentWillUnmount() {
    // Cancel ongoing requests
    this.abortController.abort();
    
    // Clear intervals
    this.intervals.forEach(interval => clearInterval(interval));
    
    // Remove event listeners
    window.removeEventListener('resize', this.handleResize);
  }
  
  private handleResize = () => {
    // Event handler
  };
}
```

### Performance Monitoring
```typescript
// Performance tracking
class PerformanceMonitor {
  static measureAsync<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    const start = performance.now();
    
    return operation().then(
      result => {
        const duration = performance.now() - start;
        console.log(`${operationName} completed in ${duration}ms`);
        return result;
      },
      error => {
        const duration = performance.now() - start;
        console.error(`${operationName} failed after ${duration}ms:`, error);
        throw error;
      }
    );
  }
}
```

## Technology-Specific Conventions and Standards

### TypeScript Conventions
```typescript
// Naming conventions (REQUIRED)
interface UserData {           // PascalCase for interfaces
  userId: string;             // camelCase for properties
  userName: string;
  isActive: boolean;
}

type ActionType = 'CREATE' | 'UPDATE' | 'DELETE';  // PascalCase for types
const API_ENDPOINTS = {       // SCREAMING_SNAKE_CASE for constants
  USERS: '/api/users',
  DOCUMENTS: '/api/documents'
} as const;

// Function naming and documentation (REQUIRED)
/**
 * Processes user authentication and returns session data
 * @param credentials - User login credentials
 * @param options - Optional authentication parameters
 * @returns Promise resolving to authenticated user session
 * @throws {AuthenticationError} When credentials are invalid
 * @throws {NetworkError} When network request fails
 */
async function authenticateUser(
  credentials: LoginCredentials,
  options: AuthOptions = {}
): Promise<UserSession> {
  // Implementation
}

// Error handling patterns (MANDATORY)
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

function safeApiCall<T>(apiCall: () => Promise<T>): Promise<Result<T>> {
  return apiCall()
    .then(data => ({ success: true as const, data }))
    .catch(error => ({ success: false as const, error }));
}
```

### React Component Conventions
```typescript
// Component structure (REQUIRED)
interface ComponentProps {
  // Props interface must be explicit
  title: string;
  onAction: (action: string) => void;
  isLoading?: boolean;
}

/**
 * Primary navigation component for the application
 * Handles user navigation and state management
 */
export function NavigationComponent({ 
  title, 
  onAction, 
  isLoading = false 
}: ComponentProps): JSX.Element {
  // Hooks at the top
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  
  // Event handlers
  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);
  
  // Effects
  useEffect(() => {
    const cleanup = setupKeyboardHandlers();
    return cleanup;
  }, []);
  
  // Early returns
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <LoginPrompt />;
  }
  
  // Main render
  return (
    <nav className="flex items-center justify-between p-4">
      {/* Component JSX */}
    </nav>
  );
}
```

### Electron Security Standards
```typescript
// Main process security configuration (MANDATORY)
const SECURITY_CONFIG = {
  webPreferences: {
    contextIsolation: true,              // REQUIRED
    nodeIntegration: false,              // REQUIRED
    sandbox: true,                       // REQUIRED
    webSecurity: true,                   // NEVER disable
    allowRunningInsecureContent: false,  // NEVER enable
    experimentalFeatures: false          // NEVER enable
  }
} as const;

// IPC message validation (REQUIRED)
interface IPCMessage {
  type: string;
  payload: unknown;
  timestamp: number;
}

function validateIPCMessage(message: unknown): message is IPCMessage {
  return typeof message === 'object' &&
         message !== null &&
         'type' in message &&
         'payload' in message &&
         'timestamp' in message;
}

// Preload script pattern (REQUIRED)
const electronAPI = {
  // Only expose necessary functions
  saveDocument: (doc: BrainLiftDocument) => 
    ipcRenderer.invoke('save-document', doc),
  
  onResearchProgress: (callback: (progress: number) => void) =>
    ipcRenderer.on('research-progress', (_, progress) => callback(progress))
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
```

### Firebase Best Practices
```typescript
// Security rules pattern (REQUIRED)
const FIRESTORE_RULES = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /brainlifts/{documentId} {
      allow read, write: if request.auth != null 
        && request.auth.uid == resource.data.userId
        && isValidDocument(request.resource.data);
    }
  }
  
  function isValidDocument(data) {
    return data.keys().hasAll(['title', 'status', 'userId', 'createdAt'])
      && data.title is string
      && data.title.size() <= 200
      && data.status in ['purpose-definition', 'research-active', 'completed'];
  }
}`;

// Offline persistence configuration (REQUIRED)
async function initializeFirebase(): Promise<void> {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  try {
    await enablePersistence(db, {
      synchronizeTabs: false  // Single-user desktop app
    });
  } catch (error) {
    if (error.code === 'failed-precondition') {
      console.warn('Persistence failed: Multiple tabs open');
    } else {
      console.error('Persistence failed:', error);
    }
  }
}

// Error handling pattern (REQUIRED)
async function firestoreOperation<T>(
  operation: () => Promise<T>
): Promise<Result<T, FirestoreError>> {
  try {
    const result = await operation();
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof FirestoreError) {
      return { success: false, error };
    }
    throw error; // Re-throw unexpected errors
  }
}
```

### API Integration Standards
```typescript
// Rate limiting implementation (REQUIRED)
class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per second
  
  constructor(maxTokens: number, refillRate: number) {
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

// API client pattern (REQUIRED)
abstract class BaseAPIClient {
  protected rateLimiter: RateLimiter;
  protected retryCount = 0;
  protected maxRetries = 3;
  
  constructor(rateLimit: { maxTokens: number; refillRate: number }) {
    this.rateLimiter = new RateLimiter(rateLimit.maxTokens, rateLimit.refillRate);
  }
  
  protected async makeRequest<T>(
    request: () => Promise<T>
  ): Promise<T> {
    await this.rateLimiter.waitForToken();
    
    try {
      return await request();
    } catch (error) {
      if (this.shouldRetry(error) && this.retryCount < this.maxRetries) {
        this.retryCount++;
        const backoffTime = Math.pow(2, this.retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        return this.makeRequest(request);
      }
      
      this.retryCount = 0;
      throw error;
    }
  }
  
  protected abstract shouldRetry(error: unknown): boolean;
}
```

## Development Workflow Standards

### Code Quality Gates
```typescript
// Pre-commit hooks configuration
const PRE_COMMIT_CHECKS = [
  'npm run type-check',      // TypeScript compilation
  'npm run lint',            // ESLint validation
  'npm run test:unit',       // Unit test execution
  'npm run security-audit'   // Security vulnerability check
];

// Testing standards (REQUIRED)
describe('Component Test Suite', () => {
  // Setup and teardown
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  // Test naming convention: should_expectedBehavior_when_stateUnderTest
  it('should_updateDocumentState_when_validDocumentProvided', async () => {
    // Arrange
    const mockDocument = createMockDocument();
    const mockUpdateFn = jest.fn();
    
    // Act
    const result = await updateDocument(mockDocument, mockUpdateFn);
    
    // Assert
    expect(result).toBeDefined();
    expect(mockUpdateFn).toHaveBeenCalledWith(mockDocument);
  });
  
  it('should_throwValidationError_when_invalidDocumentProvided', async () => {
    // Arrange
    const invalidDocument = {};
    
    // Act & Assert
    await expect(updateDocument(invalidDocument))
      .rejects
      .toThrow(ValidationError);
  });
});
```

### Performance Standards
```typescript
// Performance benchmarks (REQUIRED)
const PERFORMANCE_THRESHOLDS = {
  COMPONENT_RENDER: 16,      // 16ms for 60fps
  API_REQUEST: 2000,         // 2 seconds max
  DOCUMENT_SAVE: 1000,       // 1 second max
  SEARCH_QUERY: 5000,        // 5 seconds max
  WORKER_STARTUP: 500        // 500ms max
} as const;

// Performance monitoring (REQUIRED)
function withPerformanceMonitoring<T extends (...args: any[]) => any>(
  fn: T,
  operationName: string,
  threshold: number
): T {
  return ((...args: Parameters<T>) => {
    const start = performance.now();
    const result = fn(...args);
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - start;
        if (duration > threshold) {
          console.warn(`Performance threshold exceeded: ${operationName} took ${duration}ms`);
        }
      });
    }
    
    const duration = performance.now() - start;
    if (duration > threshold) {
      console.warn(`Performance threshold exceeded: ${operationName} took ${duration}ms`);
    }
    
    return result;
  }) as T;
}
```

## Critical Success Factors

### **Must-Have Practices**
1. **Type Safety**: 100% TypeScript coverage with strict configuration
2. **Error Handling**: Comprehensive error handling at every integration point
3. **Security**: Proper Electron security configuration and input validation
4. **Performance**: Sub-second response times for critical user interactions
5. **Memory Management**: Zero memory leaks with proper cleanup patterns
6. **Testing**: 80%+ test coverage for business logic

### **Common Failure Points**
1. **Insufficient Error Handling**: Not handling API failures and network issues
2. **Memory Leaks**: Missing cleanup in React components and worker threads
3. **Security Vulnerabilities**: Improper Electron configuration
4. **Performance Degradation**: Blocking operations on main thread
5. **Type Safety Violations**: Using `any` types and unsafe assertions
6. **Rate Limit Violations**: Not implementing proper API rate limiting

### **Monitoring and Alerts**
```typescript
// Critical metrics to monitor (REQUIRED)
const CRITICAL_METRICS = {
  memoryUsage: () => process.memoryUsage(),
  apiErrorRate: () => errorTracker.getErrorRate('api'),
  responseTime: () => performanceTracker.getAverageResponseTime(),
  workerHealth: () => workerManager.getHealthStatus(),
  documentSaveSuccess: () => documentService.getSuccessRate()
};

// Alert thresholds
const ALERT_THRESHOLDS = {
  MEMORY_USAGE_MB: 500,
  API_ERROR_RATE_PERCENT: 5,
  RESPONSE_TIME_MS: 3000,
  WORKER_FAILURE_RATE_PERCENT: 10
};
```

This comprehensive technology stack guide provides the foundation for building a robust, maintainable, and performant BrainLift Generator application while avoiding common pitfalls and following industry best practices. The detailed conventions and standards ensure consistent, high-quality code across the entire application. 