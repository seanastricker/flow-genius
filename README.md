# BrainLift Generator

**An AI-powered desktop application that automates the creation of BrainLift documents - structured prompts that guide Large Language Models beyond consensus thinking to identify contrarian viewpoints with evidence.**

![Project Status](https://img.shields.io/badge/status-in%20development-yellow)
![Platform](https://img.shields.io/badge/platform-Windows-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 Project Overview

The BrainLift Generator transforms a time-intensive manual process into an automated workflow, reducing BrainLift document creation time from **hours to minutes**. The application combines interactive Purpose refinement with intelligent background research workflows to generate comprehensive, multi-perspective research documents.

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
- **Tailwind CSS 4+**: Utility-first styling with custom design system

### AI & Research
- **OpenAI API**: Natural language processing and content generation
- **Tavily API**: Real-time web search and information gathering
- **LangGraph**: Intelligent workflow orchestration and decision-making

### Data & State Management
- **Zustand**: Lightweight state management with persistence
- **Firebase**: Document storage, user authentication, and real-time sync
- **Node.js Worker Threads**: Background processing for research workflows

### Development Tools
- **Vite**: Fast build tooling and hot module replacement
- **ESLint + Prettier**: Code quality and formatting standards
- **Jest**: Comprehensive testing framework
- **GitHub Actions**: CI/CD pipeline and automated quality checks

## 📁 Project Structure

```
BrainLift-Generator/
├── src/                          # Source code
│   ├── main/                     # Electron main process
│   ├── renderer/                 # React frontend application
│   │   ├── components/           # Reusable UI components
│   │   ├── pages/                # Page-level components
│   │   ├── services/             # Business logic and API clients
│   │   ├── stores/               # Zustand state management
│   │   └── utils/                # Utility functions
│   ├── preload/                  # Secure IPC bridge scripts
│   ├── workers/                  # Background processing
│   └── shared/                   # Cross-process shared code
├── docs/                         # Project documentation
│   ├── phases/                   # Development phase plans
│   ├── project-overview.md       # Comprehensive project details
│   ├── tech-stack.md             # Technology specifications
│   ├── implementation-guide.md   # Implementation details
│   ├── project-rules.md          # Development conventions
│   ├── ui-rules.md               # UI/UX guidelines
│   └── theme-rules.md            # Design system specifications
├── tests/                        # Test files
└── scripts/                      # Build and utility scripts
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

The project follows an iterative development approach with clear milestones:

### Phase 0: Barebones Setup (2-3 weeks)
Basic Electron application with React frontend and development environment

### Phase 1: MVP (6-8 weeks)
Functional BrainLift generation with core research workflows

### Phase 2: Enhanced Features (8-10 weeks)
Advanced UI, multi-document management, and performance optimization

### Phase 3: Polish and Scale (6-8 weeks)
Production-ready application with enterprise-grade quality

**Total Timeline**: ~7-8 months to production-ready application

See [docs/phases/](./docs/phases/) for detailed phase documentation.

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm 9+
- Windows 10/11 (primary target platform)

### Development Setup
```bash
# Clone the repository
git clone <repository-url>
cd brainlift-generator

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm run dev
```

### Required API Keys
- **OpenAI API Key**: For AI conversations and content generation
- **Tavily API Key**: For web search and research
- **Firebase Configuration**: For document persistence and authentication

## 📊 Success Metrics

### User Experience Goals
- **80% Time Reduction**: From 2-3 hours to 20-30 minutes for BrainLift creation
- **95% Completion Rate**: Users successfully complete initiated BrainLift sessions
- **4.5/5 User Satisfaction**: Post-creation survey ratings

### Quality Targets
- **90% Source Relevance**: Research sources rated as relevant and credible
- **95% Content Quality**: Generated sections require minimal user editing
- **4+ Sources Per Section**: Consistent high-quality source coverage

### Technical Performance
- **99% Uptime**: Application reliability with no critical failures
- **<10 Minutes Research**: Comprehensive research completion time
- **<$5 API Cost**: Per BrainLift document generation

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