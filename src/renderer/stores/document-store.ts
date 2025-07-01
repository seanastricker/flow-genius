/**
 * Document store for managing BrainLift document state
 * Follows Firebase schema from implementation-guide.md
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Core interfaces following Firebase schema
export type DocumentStatus = 
  | 'purpose-definition'    // User defining purpose
  | 'research-active'       // Background research running
  | 'research-complete'     // Research done, ready for review
  | 'in-review'            // User reviewing/editing
  | 'completed';           // Saved to project directory

export interface PurposeSection {
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

export interface ExpertSection {
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
  lastUpdated: Date;
}

export interface SpikyPOVSection {
  id: string;
  consensusView: string;
  contrarianInsight: string;
  evidence: string[];
  practicalImplications: string;
  sources: ResearchSource[];
  generatedContent: string;
  lastUpdated: Date;
}

export interface KnowledgeTreeSection {
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
  lastUpdated: Date;
}

export interface ResearchProgress {
  experts: {
    status: 'pending' | 'running' | 'completed' | 'error';
    progress: number;           // 0-100
    startTime?: Date;
    completedTime?: Date;
    errorMessage?: string;
  };
  spikyPOVs: {
    status: 'pending' | 'running' | 'completed' | 'error';
    progress: number;
    startTime?: Date;
    completedTime?: Date;
    errorMessage?: string;
  };
  knowledgeTree: {
    status: 'pending' | 'running' | 'completed' | 'error';
    progress: number;
    startTime?: Date;
    completedTime?: Date;
    errorMessage?: string;
  };
  overallProgress: number;      // 0-100
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface BrainLiftDocument {
  id: string;                    // Auto-generated document ID
  title: string;                 // User-defined or auto-generated title
  status: DocumentStatus;        // Current document state
  createdAt: Date;              // Creation timestamp
  updatedAt: Date;              // Last modification timestamp
  userId: string;               // User identifier (anonymous auth)
  
  // Core Content
  purpose: PurposeSection;
  experts: ExpertSection[];
  spikyPOVs: SpikyPOVSection[];
  knowledgeTree: KnowledgeTreeSection[];
  
  // Metadata
  researchProgress: ResearchProgress;
  chatHistory: ChatMessage[];
  projectName?: string;         // Set during save process
  filePath?: string;           // Final saved file location
}

interface DocumentStore {
  // Current document state
  currentDocument: BrainLiftDocument | null;
  documentHistory: BrainLiftDocument[];
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  createNewDocument: () => void;
  updateDocument: (updates: Partial<BrainLiftDocument>) => void;
  updatePurpose: (purpose: Partial<PurposeSection>) => void;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setDocumentStatus: (status: DocumentStatus) => void;
  saveCurrentDocumentToHistory: () => void;
  loadDocumentFromHistory: (documentId: string) => void;
  clearError: () => void;
  resetCurrentDocument: () => void;
}

/**
 * Create initial empty purpose section
 */
function createEmptyPurposeSection(): PurposeSection {
  return {
    coreProblem: {
      challenge: '',
      importance: '',
      currentImpact: ''
    },
    targetOutcome: {
      successDefinition: '',
      measurableResults: '',
      beneficiaries: ''
    },
    boundaries: {
      included: '',
      excluded: '',
      adjacentProblems: ''
    },
    isComplete: false
  };
}

/**
 * Create initial empty research progress
 */
function createEmptyResearchProgress(): ResearchProgress {
  return {
    experts: {
      status: 'pending',
      progress: 0
    },
    spikyPOVs: {
      status: 'pending',
      progress: 0
    },
    knowledgeTree: {
      status: 'pending',
      progress: 0
    },
    overallProgress: 0
  };
}

/**
 * Generate unique ID for documents and other entities
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export const useDocumentStore = create<DocumentStore>()(
  persist(
    (set, get) => ({
      currentDocument: null,
      documentHistory: [],
      isLoading: false,
      error: null,

      createNewDocument: () => {
        const newDocument: BrainLiftDocument = {
          id: generateId(),
          title: `BrainLift - ${new Date().toLocaleDateString()}`,
          status: 'purpose-definition',
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: 'anonymous', // Will be updated when Firebase auth is implemented
          purpose: createEmptyPurposeSection(),
          experts: [],
          spikyPOVs: [],
          knowledgeTree: [],
          researchProgress: createEmptyResearchProgress(),
          chatHistory: []
        };

        set({ currentDocument: newDocument, error: null });
      },

      updateDocument: (updates) => {
        const { currentDocument } = get();
        if (!currentDocument) return;

        const updatedDocument = {
          ...currentDocument,
          ...updates,
          updatedAt: new Date()
        };

        set({ currentDocument: updatedDocument });
        
        // Auto-save to history whenever document is updated
        get().saveCurrentDocumentToHistory();
      },

      updatePurpose: (purposeUpdates) => {
        const { currentDocument } = get();
        if (!currentDocument) return;

        const updatedPurpose = {
          ...currentDocument.purpose,
          ...purposeUpdates
        };

        // Check if purpose is complete
        const isComplete = 
          updatedPurpose.coreProblem.challenge.trim() !== '' &&
          updatedPurpose.coreProblem.importance.trim() !== '' &&
          updatedPurpose.coreProblem.currentImpact.trim() !== '' &&
          updatedPurpose.targetOutcome.successDefinition.trim() !== '' &&
          updatedPurpose.targetOutcome.measurableResults.trim() !== '' &&
          updatedPurpose.targetOutcome.beneficiaries.trim() !== '' &&
          updatedPurpose.boundaries.included.trim() !== '' &&
          updatedPurpose.boundaries.excluded.trim() !== '' &&
          updatedPurpose.boundaries.adjacentProblems.trim() !== '';

        updatedPurpose.isComplete = isComplete;

        const updatedDocument = {
          ...currentDocument,
          purpose: updatedPurpose,
          updatedAt: new Date()
        };

        set({ currentDocument: updatedDocument });
        
        // Auto-save to history whenever purpose is updated
        get().saveCurrentDocumentToHistory();
      },

      addChatMessage: (message) => {
        const { currentDocument } = get();
        if (!currentDocument) return;

        const newMessage: ChatMessage = {
          id: generateId(),
          timestamp: new Date(),
          ...message
        };

        const updatedDocument = {
          ...currentDocument,
          chatHistory: [...currentDocument.chatHistory, newMessage],
          updatedAt: new Date()
        };

        set({ currentDocument: updatedDocument });
        
        // Auto-save to history when AI responds (not just user messages)
        if (message.role === 'assistant') {
          get().saveCurrentDocumentToHistory();
        }
      },

      setDocumentStatus: (status) => {
        const { currentDocument } = get();
        if (!currentDocument) return;

        const updatedDocument = {
          ...currentDocument,
          status,
          updatedAt: new Date()
        };

        set({ currentDocument: updatedDocument });
      },

      saveCurrentDocumentToHistory: () => {
        const { currentDocument, documentHistory } = get();
        if (!currentDocument) return;

        // Check if document already exists in history
        const existingIndex = documentHistory.findIndex(doc => doc.id === currentDocument.id);
        
        if (existingIndex >= 0) {
          // Update existing document in history
          const updatedHistory = [...documentHistory];
          updatedHistory[existingIndex] = { ...currentDocument };
          set({ documentHistory: updatedHistory });
        } else {
          // Add new document to history
          set({ documentHistory: [...documentHistory, { ...currentDocument }] });
        }
      },

      loadDocumentFromHistory: (documentId) => {
        const { documentHistory } = get();
        const document = documentHistory.find(doc => doc.id === documentId);
        if (document) {
          set({ currentDocument: { ...document }, error: null });
        }
      },

      clearError: () => set({ error: null }),

      resetCurrentDocument: () => set({ currentDocument: null, error: null })
    }),
    {
      name: 'brainlift-document-storage',
      partialize: (state) => ({
        documentHistory: state.documentHistory,
        currentDocument: state.currentDocument
      })
    }
  )
); 