# BrainSwift

**An AI-powered desktop application that automates the creation of BrainLift documents - structured prompts that guide Large Language Models beyond consensus thinking to identify contrarian viewpoints with evidence.**

![Project Status](https://img.shields.io/badge/status-Phase%201%20MVP%20Implementation-orange)
![Platform](https://img.shields.io/badge/platform-Windows-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 Project Overview

BrainSwift transforms a time-intensive manual process into an automated workflow, reducing BrainLift document creation time from **hours to minutes**. The application combines interactive Purpose refinement with intelligent background research workflows to generate comprehensive, multi-perspective research documents.

### The Problem
Creating BrainLift documents manually requires extensive research across multiple domains:
- **Expert Identification**: Finding credible experts with relevant perspectives
- **Contrarian Research**: Discovering evidence-backed counter-consensus viewpoints  
- **Knowledge Mapping**: Analyzing current systems, tools, and dependencies
- **Source Validation**: Ensuring credibility and relevance of research sources

### The Solution
An Electron-based desktop application that:
- **Interactive Purpose Definition**: AI-guided chat interface for problem scope refinement
- **Automated Research Workflows**: Parallel processing of Experts, SpikyPOVs, and Knowledge Tree sections
- **Real-time Web Search**: Current information gathering via Tavily API integration
- **Quality Assurance**: Source credibility scoring and content validation
- **Seamless Integration**: Direct saving to project directories with markdown formatting

## 🚀 Key Features

### Core Workflow
- **Purpose Definition**: Interactive AI chat for defining Core Problem, Target Outcome, and Clear Boundaries
- **Automated Research**: Background processing of three parallel research workflows
- **Progress Tracking**: Real-time progress indicators with estimated completion times
- **Document Review**: Edit and refine AI-generated content with source transparency
- **Project Integration**: Save completed documents to `C:\Users\seana\OneDrive\Documents\Gauntlet Projects\[project-name]\docs\`

### Advanced Capabilities
- **Multi-Document Management**: Handle multiple concurrent BrainLift documents
- **Source Transparency**: Complete source attribution with credibility indicators
- **Offline Persistence**: Firebase integration with offline-first data synchronization
- **Quality Controls**: Automated content validation and improvement suggestions
- **Desktop Optimization**: Native Windows integration with keyboard shortcuts and context menus

## 🛠️ Technology Stack

### Core Framework
- **Electron 27+**: Cross-platform desktop application framework
- **React 18+**: Modern frontend with hooks and concurrent features
- **TypeScript 5+**: Strict type safety with comprehensive interfaces
- **Tailwind CSS 3+**: Utility-first styling with custom design system

### AI & Research
- **OpenAI API**: Natural language processing and content generation
- **Tavily API**: Real-time web search and information gathering
- **Direct TypeScript**: Intelligent workflow orchestration and decision-making

### Data & State Management
- **Zustand**: Lightweight state management with persistence
- **Firebase 11+**: Document storage, user authentication, and real-time sync
- **Node.js Worker Threads**: Background processing for research workflows

### Development Tools
- **Vite 5+**: Fast build tooling and hot module replacement
- **ESLint + TypeScript**: Code quality and formatting standards
- **React Router DOM**: Client-side routing and navigation
- **Cross-env**: Cross-platform environment variables

## 📁 Project Structure

```
FlowGenius/
├── src/                          # Source code
│   ├── main/                     # Electron main process
│   │   ├── index.ts              # Main process entry point
│   │   └── research-service.ts   # Research orchestration service
│   ├── preload/                  # Secure IPC bridge scripts
│   │   └── index.ts              # Preload script for secure communication
│   ├── renderer/                 # React frontend application
│   │   ├── components/           # Reusable UI components
│   │   │   ├── features/         # Feature-specific components
│   │   │   │   ├── ChatInterface/      # Purpose definition chat
│   │   │   │   ├── ContentEditor/      # Document editing interface
│   │   │   │   ├── ResearchProgress/   # Research progress tracking
│   │   │   │   └── SourceDisplay/      # Source attribution display
│   │   │   ├── layout/           # Layout components
│   │   │   └── ui/               # Basic UI components (button, card)
│   │   ├── pages/                # Page-level components
│   │   │   ├── PurposeDefinition.tsx   # Purpose definition page
│   │   │   └── DocumentReview.tsx      # Document review page
│   │   ├── services/             # Business logic and API clients
│   │   │   ├── api/              # External API integrations
│   │   │   │   ├── firebase-client.ts  # Firebase integration
│   │   │   │   ├── openai-client.ts    # OpenAI API client
│   │   │   │   └── tavily-client.ts    # Tavily search API
│   │   │   ├── document/         # Document processing services
│   │   │   │   └── validation-service.ts
│   │   │   └── research-orchestrator.ts # Research workflow coordination
│   │   ├── stores/               # Zustand state management
│   │   │   ├── auth-store.ts     # Authentication state
│   │   │   ├── document-store.ts # Document management state
│   │   │   └── research-store.ts # Research progress state
│   │   └── utils/                # Utility functions
│   ├── workers/                  # Background processing
│   │   ├── langraph-interface.ts        # LangGraph workflow interface
│   │   ├── langraph-workflow-manager.ts # Workflow management
│   │   ├── research-worker.ts           # Background research processing
│   │   └── worker-manager.ts            # Worker thread management
│   └── shared/                   # Cross-process shared code
│       ├── constants/            # Application constants
│       ├── types/                # TypeScript type definitions
│       │   ├── env.d.ts          # Environment variable types
│       │   └── global.d.ts       # Global type definitions
│       └── utils/                # Shared utility functions
├── docs/                         # Project documentation
│   ├── phases/                   # Development phase plans
│   │   ├── phase-0-setup.md      # Foundation setup (✅ COMPLETED)
│   │   ├── phase-1-mvp.md        # MVP implementation (✅ IN PROGRESS)
│   │   ├── phase-2-enhanced-features.md
│   │   └── phase-3-polish-and-scale.md
│   ├── project-overview.md       # Comprehensive project details
│   ├── tech-stack.md             # Technology specifications
│   ├── implementation-guide.md   # Implementation details
│   ├── project-rules.md          # Development conventions
│   ├── ui-rules.md               # UI/UX guidelines
│   ├── theme-rules.md            # Design system specifications
│   └── user-flow.md              # User journey documentation
├── scripts/                      # Build and utility scripts
│   └── deploy.js                 # Deployment automation
├── tests/                        # Test files
├── assets/                       # Application assets
├── DEPLOYMENT.md                 # Deployment documentation
└── USER_INSTRUCTIONS.txt         # User setup instructions
```

## 🎨 Design System

### Visual Identity
- **Modern Professional**: Clean, trustworthy interface for professional use
- **Desktop-First**: Optimized for desktop workflows with multi-panel layouts
- **Color System**: Primary blues (#2563eb) with semantic color coding
- **Typography**: Inter for UI, JetBrains Mono for code/technical content

### User Experience Principles
1. **Trust Through Transparency**: Clear source attribution and process explanation
2. **Cognitive Load Reduction**: Progressive disclosure and minimal interruption
3. **Workflow Efficiency**: Quick navigation and smart defaults
4. **Information Density Management**: Scannable layouts and categorization
5. **Status Communication**: Multi-state indicators and time estimates

## 🔧 Development Approach

### AI-First Development
- **Modular Architecture**: Each component serves a single, well-defined purpose
- **File Size Limit**: Maximum 500 lines per file for optimal AI processing
- **Comprehensive Documentation**: JSDoc/TSDoc for all functions and components
- **Type Safety**: 100% TypeScript coverage with strict configuration
- **Self-Documenting Code**: Clear naming and structure for AI understanding

### Code Quality Standards
```typescript
// Example: Proper function documentation
/**
 * Processes research queries and returns structured results
 * 
 * @param queries - Array of search queries to process
 * @param options - Configuration options for research processing
 * @returns Promise resolving to processed research results with sources
 * @throws {ValidationError} When queries array is empty or invalid
 * @throws {APIError} When external API calls fail
 */
async function processResearchQueries(
  queries: string[],
  options: ResearchOptions = {}
): Promise<ResearchResult[]> {
  // Implementation with proper error handling
}
```

### Security Standards
- **Electron Security**: Context isolation, disabled node integration, sandbox mode
- **API Key Management**: Encrypted storage with electron-store
- **Input Validation**: Comprehensive validation for all user inputs
- **IPC Security**: Typed message validation between processes

## 🚦 Development Phases

### Phase 0: Foundation Setup - ✅ COMPLETED

The foundational project structure has been successfully established with a fully functional Electron + React + TypeScript application.

#### ✅ Completed Features
- **Electron Application**: Launches successfully with proper security configuration
- **React Frontend**: Renders with modern UI using Tailwind CSS
- **TypeScript**: Full type safety with zero compilation errors
- **Development Environment**: Hot reload and development tools working
- **Build System**: Vite build process working correctly

### Phase 1: MVP Implementation - ✅ COMPLETED

**Current Status**: Major features implemented, integration and testing in progress.

#### ✅ Completed MVP Features

**Interactive Purpose Definition System**
- ✅ Chat interface component with message history
- ✅ OpenAI API integration for Purpose refinement
- ✅ Purpose section validation (Core Problem, Target Outcome, Boundaries)
- ✅ Purpose completion detection and workflow progression
- ✅ Auto-saving and chat history persistence

**Firebase Integration & Authentication**
- ✅ Firebase project configuration with Firestore and Authentication
- ✅ Anonymous authentication for user session management
- ✅ Complete Firestore schema implementation following design specifications
- ✅ Offline persistence and data synchronization
- ✅ Firebase security rules for document access control

**Document Management System**
- ✅ Comprehensive document store with Zustand state management
- ✅ Document creation, editing, and persistence
- ✅ Document history and multi-document support
- ✅ Real-time auto-saving and sync to Firebase
- ✅ Document status tracking and workflow progression

**Research Infrastructure**
- ✅ Worker thread manager for background processing
- ✅ LangGraph workflow integration and orchestration
- ✅ Tavily API client for web search functionality
- ✅ Research progress tracking with detailed status updates
- ✅ OpenAI integration for content generation and analysis

**User Interface & Navigation**
- ✅ Complete routing system with React Router
- ✅ Home page with document creation and history
- ✅ Purpose definition page with AI chat interface
- ✅ Research progress page with real-time updates
- ✅ Document review page for editing and finalization
- ✅ Responsive design optimized for desktop usage

**Research Workflow Engine**
- ✅ Background research processing implementation
- ✅ Expert identification and analysis workflows
- ✅ SpikyPOV contrarian viewpoint research
- ✅ Knowledge tree mapping and analysis
- ✅ Research result processing and content generation

**Document Review & Editing**
- ✅ Comprehensive content editing interface
- ✅ Source display with credibility indicators
- ✅ Content regeneration options
- ✅ Document validation before finalization

**File System Integration**
- ✅ Markdown document generation
- ✅ Project directory selection and creation
- ✅ File system operations via main process
- ✅ Document export and saving functionality

#### 🎯 MVP Success Criteria Progress

- ✅ Interactive Purpose definition with AI assistance
- ✅ Firebase document persistence and synchronization
- ✅ Multi-document management with history
- ✅ Real-time progress tracking interface
- ✅ Automated parallel research for all three sections
- ✅ Document review and editing functionality
- ✅ Save BrainLift documents to project directories
- ✅ Basic error handling and progress tracking

### Phase 2: Enhanced Features - 📋 PLANNED

- Advanced research customization and quality controls
- Enhanced UI/UX with animations and polish
- Document templates and customization options
- Advanced export formats and sharing capabilities

### Phase 3: Polish & Scale - 📋 PLANNED

- Performance optimization and caching
- Advanced analytics and usage insights
- Multi-language support and accessibility
- Cloud sync and collaboration features

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** (LTS version)
- **npm 9+** or **yarn**
- **Windows 10/11** (primary platform)

### Installation & Setup

```bash
# Clone the repository
git clone <repository-url>
cd brainlift-generator

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys:
# - VITE_OPENAI_API_KEY
# - VITE_TAVILY_API_KEY
# - VITE_FIREBASE_* (Firebase configuration)

# Start development server
npm run dev
```

### Development Commands

```bash
npm run dev              # Start development server (Vite + Electron)
npm run dev:vite         # Start Vite dev server only
npm run dev:electron     # Start Electron only
npm run build            # Build for production
npm run build:vite       # Build frontend only
npm run build:electron   # Build Electron app
npm run build:win        # Build Windows installer
npm run type-check       # TypeScript type checking
npm run lint             # Code linting and formatting
npm run test             # Run test suite
```

### Environment Variables Required

```env
# OpenAI API Configuration
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Tavily Search API Configuration
VITE_TAVILY_API_KEY=your_tavily_api_key_here

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# Development Environment
NODE_ENV=development
```

## 📊 Current Implementation Status

### ✅ Fully Implemented
- **Application Framework**: Electron + React + TypeScript setup
- **Authentication**: Firebase anonymous auth with user management
- **Document Management**: Complete CRUD operations with persistence
- **Purpose Definition**: AI-powered interactive chat interface
- **State Management**: Comprehensive Zustand stores for all app state
- **Navigation**: React Router with proper route handling
- **UI Components**: Core components with Tailwind CSS styling
- **API Integrations**: OpenAI, Tavily, and Firebase client implementations
- **Research Workflows**: LangGraph-based background processing
- **Content Generation**: Automated research result processing
- **Document Review**: Advanced editing and validation interface
- **File Export**: Markdown generation and file system integration

### 📋 Planned
- **Testing Suite**: Comprehensive unit and integration tests
- **Performance Optimization**: Memory management and API efficiency
- **Advanced Features**: Enhanced research customization
- **Polish & UX**: Animations, notifications, and user experience improvements

## 🔒 Security Implementation

### Current Security Measures
- **Electron Security**: Context isolation enabled, node integration disabled
- **API Key Management**: Environment variables for sensitive credentials
- **Firebase Security**: Comprehensive security rules and authentication
- **Input Validation**: Type-safe interfaces and validation throughout
- **IPC Communication**: Secure communication between main and renderer processes

### Planned Security Enhancements
- **Encrypted Local Storage**: For sensitive API keys and user data
- **Content Security Policy**: Enhanced XSS protection
- **Code Signing**: Windows application signing for distribution
- **Audit Logging**: Security event tracking and monitoring

## 🤝 Contributing

### Development Workflow
1. Follow [project-rules.md](./docs/project-rules.md) for code organization
2. Implement features according to current development phase
3. Maintain 100% TypeScript coverage with proper documentation
4. Write tests for all business logic (80%+ coverage target)
5. Follow commit message format: `Type(scope): description`

### Code Review Checklist
- [ ] File size under 500 lines
- [ ] Proper JSDoc/TSDoc documentation
- [ ] TypeScript strict mode compliance
- [ ] Security standards followed
- [ ] Performance considerations addressed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Documentation

- [Project Overview](./docs/project-overview.md) - Comprehensive project requirements
- [User Flow](./docs/user-flow.md) - Complete user journey documentation
- [Technology Stack](./docs/tech-stack.md) - Detailed technology specifications
- [Implementation Guide](./docs/implementation-guide.md) - Technical implementation details
- [Project Rules](./docs/project-rules.md) - Development conventions and standards
- [UI Guidelines](./docs/ui-rules.md) - User interface design principles
- [Theme System](./docs/theme-rules.md) - Visual design system specifications

---

**Built with ❤️ for AI-first development workflows**

*Last Updated: January 2025 - Phase 1 MVP Implementation* 
