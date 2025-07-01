# BrainLift Generator - Project Rules

## Overview

This document establishes comprehensive project rules for the BrainLift Generator AI-first codebase. These rules ensure modularity, scalability, maintainability, and optimal compatibility with modern AI development tools. Every aspect of the codebase follows these standards to create a highly navigable and well-organized project structure.

## AI-First Development Principles

### Core Philosophy
- **Modular Architecture**: Each component serves a single, well-defined purpose
- **Scalable Design**: Code structure supports feature additions without major refactoring
- **AI Tool Compatibility**: File organization and documentation optimized for AI assistance
- **Self-Documenting Code**: Code structure and naming should be immediately understandable
- **Maximum Line Limit**: Files must not exceed 500 lines for optimal AI processing

### Documentation Standards
- **File Headers**: Every file includes a descriptive comment explaining its purpose
- **Function Documentation**: All functions use JSDoc/TSDoc with parameter and return descriptions
- **Type Annotations**: Complete TypeScript coverage with explicit interfaces
- **Inline Comments**: Complex logic includes explanatory comments
- **README Files**: Each major directory includes a README explaining its purpose

## Project Directory Structure

### Root Level Organization
```
BrainLift-Generator/
├── src/                          # Source code
├── docs/                         # Project documentation
├── tests/                        # Test files
├── scripts/                      # Build and utility scripts
├── public/                       # Static assets
├── dist/                         # Built application (generated)
├── node_modules/                 # Dependencies (generated)
├── .vscode/                      # VS Code configuration
├── .github/                      # GitHub workflows and templates
├── package.json                  # Project dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── vite.config.ts                # Vite build configuration
├── electron.config.js            # Electron configuration
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore rules
└── README.md                     # Project overview
```

### Source Code Structure (`src/`)
```
src/
├── main/                         # Electron main process
│   ├── index.ts                  # Main process entry point
│   ├── window-manager.ts         # Window creation and management
│   ├── ipc-handlers.ts           # Inter-process communication handlers
│   ├── file-system.ts            # File operations and project integration
│   ├── security.ts               # Security configuration and validation
│   └── auto-updater.ts           # Application update management
├── renderer/                     # Electron renderer process (React app)
│   ├── index.tsx                 # React application entry point
│   ├── App.tsx                   # Root React component
│   ├── components/               # Reusable UI components
│   ├── pages/                    # Page-level components
│   ├── hooks/                    # Custom React hooks
│   ├── services/                 # Business logic and API clients
│   ├── stores/                   # Zustand state management
│   ├── types/                    # TypeScript type definitions
│   ├── utils/                    # Utility functions
│   ├── constants/                # Application constants
│   └── assets/                   # Static assets (images, icons)
├── preload/                      # Electron preload scripts
│   ├── index.ts                  # Main preload script
│   ├── api-bridge.ts             # Secure API bridge for renderer
│   └── types.ts                  # Preload API type definitions
├── workers/                      # Background processing
│   ├── research-worker.ts        # Research workflow execution
│   ├── langraph-interface.ts     # LangGraph workflow integration
│   └── worker-manager.ts         # Worker thread management
└── shared/                       # Code shared between processes
    ├── types/                    # Shared type definitions
    ├── constants/                # Shared constants
    ├── utils/                    # Shared utility functions
    └── schemas/                  # Data validation schemas
```

### Component Organization (`src/renderer/components/`)
```
components/
├── ui/                           # Basic UI building blocks
│   ├── Button/
│   │   ├── Button.tsx            # Button component
│   │   ├── Button.types.ts       # Button type definitions
│   │   ├── Button.stories.tsx    # Storybook stories (if used)
│   │   └── index.ts              # Export barrel
│   ├── Card/
│   ├── Input/
│   ├── Modal/
│   ├── Progress/
│   └── index.ts                  # UI components barrel export
├── layout/                       # Layout and structural components
│   ├── Header/
│   ├── Sidebar/
│   ├── Panel/
│   ├── StatusBar/
│   └── index.ts
├── features/                     # Feature-specific components
│   ├── DocumentCard/
│   ├── ResearchProgress/
│   ├── SourceDisplay/
│   ├── ChatInterface/
│   ├── ContentEditor/
│   └── index.ts
└── patterns/                     # Complex interaction patterns
    ├── WorkflowStepper/
    ├── MultiPanelLayout/
    ├── ProgressTracker/
    ├── ErrorBoundary/
    └── index.ts
```

### Services Organization (`src/renderer/services/`)
```
services/
├── api/                          # External API integrations
│   ├── openai-client.ts          # OpenAI API integration
│   ├── tavily-client.ts          # Tavily search API integration
│   ├── firebase-client.ts        # Firebase services
│   └── index.ts
├── research/                     # Research workflow services
│   ├── expert-research.ts        # Expert identification and analysis
│   ├── spiky-research.ts         # Contrarian viewpoint research
│   ├── knowledge-research.ts     # Knowledge tree research
│   └── index.ts
├── document/                     # Document management services
│   ├── document-service.ts       # Document CRUD operations
│   ├── markdown-converter.ts     # Document format conversion
│   ├── validation-service.ts     # Document validation
│   └── index.ts
└── workflow/                     # Workflow orchestration
    ├── workflow-manager.ts       # Main workflow coordination
    ├── progress-tracker.ts       # Progress monitoring
    ├── error-handler.ts          # Error handling and recovery
    └── index.ts
```

### State Management (`src/renderer/stores/`)
```
stores/
├── document-store.ts             # Document state management
├── research-store.ts             # Research progress and results
├── ui-store.ts                   # UI state (modals, panels, etc.)
├── settings-store.ts             # User preferences and settings
├── auth-store.ts                 # Authentication state
├── types.ts                      # Store type definitions
└── index.ts                      # Store exports and configuration
```

## File Naming Conventions

### General Rules
- **kebab-case**: Use for file and directory names (`user-profile.ts`, `research-progress.tsx`)
- **PascalCase**: Use for React components (`UserProfile.tsx`, `ResearchProgress.tsx`)
- **camelCase**: Use for functions, variables, and methods (`getUserProfile`, `startResearch`)
- **SCREAMING_SNAKE_CASE**: Use for constants (`API_ENDPOINTS`, `MAX_RETRY_ATTEMPTS`)

### File Type Conventions
```typescript
// Component files
ComponentName.tsx              // React component
ComponentName.types.ts         // Component type definitions
ComponentName.test.tsx         // Component tests
ComponentName.stories.tsx      // Storybook stories

// Service files
service-name.ts               // Service implementation
service-name.types.ts         // Service type definitions
service-name.test.ts          // Service tests

// Utility files
utility-name.ts               // Utility functions
utility-name.types.ts         // Utility type definitions
utility-name.test.ts          // Utility tests

// Store files
store-name-store.ts           // Zustand store
store-name.types.ts           // Store type definitions

// Configuration files
config-name.config.ts         // Configuration files
```

### Directory Naming
- **Singular nouns**: Use singular forms (`component/`, `service/`, `util/`)
- **Feature-based**: Group by feature rather than file type (`user-profile/`, `research-workflow/`)
- **Descriptive**: Names should clearly indicate purpose (`api-clients/`, `background-workers/`)

## Code Organization Standards

### File Structure Template
```typescript
/**
 * Brief description of what this file does and its role in the application
 * 
 * @fileoverview Detailed explanation if needed
 * @author Team/Individual responsible
 * @since Version when this was added
 */

// External imports (libraries, frameworks)
import React from 'react';
import { z } from 'zod';

// Internal imports (grouped by proximity)
import { Button } from '@/components/ui';
import { useDocumentStore } from '@/stores';
import { DocumentService } from '@/services';

// Type imports (separate section)
import type { 
  ComponentProps, 
  DocumentData, 
  ResearchResult 
} from './types';

// Constants (if any)
const DEFAULT_CONFIG = {
  maxRetries: 3,
  timeout: 5000
} as const;

// Types and interfaces (if not in separate file)
interface LocalComponentState {
  isLoading: boolean;
  error: string | null;
}

// Main implementation
export function ComponentName({ prop1, prop2 }: ComponentProps) {
  // Implementation
}

// Default export (if applicable)
export default ComponentName;
```

### Function Documentation Standards
```typescript
/**
 * Processes user research queries and returns structured results
 * 
 * @param queries - Array of search queries to process
 * @param options - Configuration options for research processing
 * @param options.maxResults - Maximum number of results per query (default: 5)
 * @param options.includeMetadata - Whether to include source metadata (default: true)
 * @returns Promise resolving to processed research results with sources
 * @throws {ValidationError} When queries array is empty or invalid
 * @throws {APIError} When external API calls fail
 * 
 * @example
 * ```typescript
 * const results = await processResearchQueries(
 *   ['AI expert machine learning', 'contrarian AI views'],
 *   { maxResults: 3, includeMetadata: true }
 * );
 * ```
 */
async function processResearchQueries(
  queries: string[],
  options: ResearchOptions = {}
): Promise<ResearchResult[]> {
  // Implementation
}
```

### Component Documentation Standards
```typescript
/**
 * Research progress display component showing real-time workflow status
 * 
 * Displays progress for three parallel research workflows (Experts, SpikyPOVs, 
 * Knowledge Tree) with individual progress bars, status indicators, and 
 * estimated completion times.
 * 
 * @component
 * @example
 * ```tsx
 * <ResearchProgress 
 *   progress={researchState.progress}
 *   onCancel={() => handleCancelResearch()}
 *   showDetails={true}
 * />
 * ```
 */
export function ResearchProgress({ 
  progress, 
  onCancel, 
  showDetails = false 
}: ResearchProgressProps) {
  // Implementation
}
```

## Technology-Specific Rules

### TypeScript Standards
```typescript
// Strict configuration required
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}

// Interface naming
interface UserData {           // PascalCase, descriptive
  userId: string;             // camelCase properties
  userName: string;
  isActive: boolean;
}

// Type naming
type DocumentStatus = 'draft' | 'processing' | 'complete';
type APIResponse<T> = {
  data: T;
  status: 'success' | 'error';
  message?: string;
};

// Generic constraints
interface Repository<T extends { id: string }> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
}
```

### React Component Standards
```typescript
// Component props interface
interface ComponentProps {
  // Required props first
  title: string;
  onAction: (action: string) => void;
  
  // Optional props with defaults
  isLoading?: boolean;
  className?: string;
  
  // Children and render props
  children?: React.ReactNode;
  renderHeader?: () => React.ReactNode;
}

// Component implementation
export function ComponentName({ 
  title, 
  onAction, 
  isLoading = false,
  className,
  children 
}: ComponentProps): JSX.Element {
  // Hooks at the top
  const [state, setState] = useState<LocalState>({});
  const { data, error } = useQuery();
  
  // Event handlers
  const handleClick = useCallback(() => {
    onAction('click');
  }, [onAction]);
  
  // Effects
  useEffect(() => {
    // Effect logic
    return () => {
      // Cleanup
    };
  }, []);
  
  // Early returns
  if (error) {
    return <ErrorDisplay error={error} />;
  }
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  // Main render
  return (
    <div className={cn('base-styles', className)}>
      {children}
    </div>
  );
}
```

### Electron Security Standards
```typescript
// Main process security (MANDATORY)
const securityConfig = {
  webPreferences: {
    contextIsolation: true,              // REQUIRED
    nodeIntegration: false,              // REQUIRED
    sandbox: true,                       // REQUIRED
    webSecurity: true,                   // NEVER disable
    allowRunningInsecureContent: false,  // NEVER enable
    preload: path.join(__dirname, 'preload.js')
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
```

## Import and Export Standards

### Import Organization
```typescript
// 1. External library imports
import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { clsx } from 'clsx';

// 2. Internal imports (by proximity/dependency)
import { Button, Card } from '@/components/ui';
import { useDocumentStore } from '@/stores';
import { DocumentService } from '@/services';

// 3. Type-only imports (separate section)
import type { 
  ComponentProps,
  DocumentData,
  APIResponse 
} from './types';
import type { User } from '@/shared/types';
```

### Export Standards
```typescript
// Named exports preferred for utilities and services
export { DocumentService };
export { validateDocument };
export type { DocumentData };

// Default exports for components and main modules
export default function ComponentName() {
  // Implementation
}

// Barrel exports for clean imports
// index.ts
export { Button } from './Button';
export { Card } from './Card';
export { Modal } from './Modal';
export type { ButtonProps } from './Button/Button.types';
```

## Error Handling Standards

### Error Types and Hierarchy
```typescript
// Base error class
abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  
  constructor(
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Specific error types
class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;
}

class APIError extends AppError {
  readonly code = 'API_ERROR';
  readonly statusCode = 500;
  
  constructor(
    message: string,
    public readonly apiResponse?: unknown,
    context?: Record<string, unknown>
  ) {
    super(message, context);
  }
}
```

### Error Handling Patterns
```typescript
// Result pattern for error handling
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

async function safeApiCall<T>(
  apiCall: () => Promise<T>
): Promise<Result<T, APIError>> {
  try {
    const data = await apiCall();
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof APIError 
        ? error 
        : new APIError('Unknown API error', error)
    };
  }
}
```

## Testing Standards

### Test File Organization
```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx        # Component tests
│   │   └── Button.types.ts
│   └── __tests__/                 # Shared test utilities
│       ├── test-utils.tsx
│       └── mock-data.ts
├── services/
│   ├── document-service.ts
│   ├── document-service.test.ts   # Service tests
│   └── __mocks__/                 # Service mocks
│       └── document-service.ts
└── __tests__/                     # Integration tests
    ├── document-workflow.test.ts
    └── research-workflow.test.ts
```

### Test Naming Conventions
```typescript
// Test suite naming: describe_functionOrComponent_when_scenario
describe('DocumentService', () => {
  describe('saveDocument', () => {
    it('should_saveDocumentSuccessfully_when_validDataProvided', async () => {
      // Test implementation
    });
    
    it('should_throwValidationError_when_invalidDataProvided', async () => {
      // Test implementation
    });
    
    it('should_retryOnFailure_when_networkErrorOccurs', async () => {
      // Test implementation
    });
  });
});
```

## Performance Standards

### Bundle Size Management
- **Component Lazy Loading**: Use React.lazy() for route-level components
- **Tree Shaking**: Ensure all imports support tree shaking
- **Dynamic Imports**: Use dynamic imports for heavy dependencies
- **Bundle Analysis**: Regular bundle size monitoring

### Memory Management
```typescript
// Proper cleanup in React components
useEffect(() => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    // Timeout logic
  }, 5000);
  
  // Cleanup function (MANDATORY)
  return () => {
    controller.abort();
    clearTimeout(timeoutId);
  };
}, []);
```

### Performance Monitoring
```typescript
// Performance measurement wrapper
function withPerformanceMonitoring<T extends (...args: any[]) => any>(
  fn: T,
  operationName: string
): T {
  return ((...args: Parameters<T>) => {
    const start = performance.now();
    const result = fn(...args);
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - start;
        console.log(`${operationName}: ${duration}ms`);
      });
    }
    
    const duration = performance.now() - start;
    console.log(`${operationName}: ${duration}ms`);
    return result;
  }) as T;
}
```

## Development Workflow Rules

### Git Commit Standards
```bash
# Commit message format
Type(scope): description

# Types: Feat, Fix, Docs, Style, Refactor, Test, Chore
# Examples:
git commit -m "Feat(research): add expert identification workflow"
git commit -m "Fix(ui): resolve progress bar animation glitch"
git commit -m "Docs(api): update OpenAI integration documentation"
```

### Code Review Checklist
- [ ] File size under 500 lines
- [ ] Proper JSDoc/TSDoc documentation
- [ ] TypeScript strict mode compliance
- [ ] Error handling implemented
- [ ] Performance considerations addressed
- [ ] Security standards followed
- [ ] Test coverage adequate
- [ ] Import organization correct
- [ ] Naming conventions followed
- [ ] Component patterns consistent

### Development Scripts
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:vite\" \"npm run dev:electron\"",
    "build": "npm run type-check && npm run build:vite && npm run build:electron",
    "test": "jest --passWithNoTests",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts,.tsx --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write \"src/**/*.{ts,tsx}\"",
    "validate": "npm run type-check && npm run lint && npm run test"
  }
}
```

## Quality Assurance Standards

### Code Quality Metrics
- **TypeScript Coverage**: 100% (no `any` types)
- **Test Coverage**: Minimum 80% for business logic
- **ESLint Compliance**: Zero warnings in production build
- **File Size Limit**: Maximum 500 lines per file
- **Function Complexity**: Maximum cyclomatic complexity of 10

### Automated Quality Checks
```yaml
# GitHub Actions workflow example
name: Quality Check
on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Type check
        run: npm run type-check
      - name: Lint
        run: npm run lint
      - name: Test
        run: npm run test:coverage
      - name: Build
        run: npm run build
```

These project rules ensure a consistent, maintainable, and AI-friendly codebase that supports the complex requirements of the BrainLift Generator while maintaining high code quality and developer productivity standards.

---
➡️ The human brain uses approximately 20% of the body's total energy despite being only 2% of body weight. 