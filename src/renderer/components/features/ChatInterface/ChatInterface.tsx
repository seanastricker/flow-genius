/**
 * Chat interface component for Purpose refinement conversations
 * Handles message display, user input, and AI responses
 */
import React, { useState, useRef, useEffect } from 'react';
import { useDocumentStore } from '../../../stores/document-store';
import { openAIClient } from '../../../services/api/openai-client';
import type { ChatMessage } from '../../../stores/document-store';

interface ChatInterfaceProps {
  onPurposeComplete?: () => void;
}

/**
 * Main chat interface component
 */
export function ChatInterface({ onPurposeComplete }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyPrompt, setApiKeyPrompt] = useState(!openAIClient.isReady());
  const [tempApiKey, setTempApiKey] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    currentDocument,
    addChatMessage,
    updatePurpose,
    createNewDocument
  } = useDocumentStore();

  // Create new document if none exists
  useEffect(() => {
    if (!currentDocument) {
      createNewDocument();
    }
  }, [currentDocument, createNewDocument]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentDocument?.chatHistory]);

  // Check if purpose is complete and notify parent
  useEffect(() => {
    if (currentDocument?.purpose.isComplete && onPurposeComplete) {
      onPurposeComplete();
    }
  }, [currentDocument?.purpose.isComplete, onPurposeComplete]);

  /**
   * Handle API key setup
   */
  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempApiKey.trim()) {
      openAIClient.setApiKey(tempApiKey.trim());
      setApiKeyPrompt(false);
      setTempApiKey('');
      
      // Add welcome message
      addChatMessage({
        role: 'assistant',
        content: 'Great! I\'m ready to help you define your BrainLift Purpose. Let\'s start by understanding what challenge you\'re trying to solve. What\'s the core problem you want to address?'
      });
    }
  };

  /**
   * Handle sending user message
   */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !currentDocument) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // Add user message to chat
      addChatMessage({
        role: 'user',
        content: userMessage
      });

      // Prepare chat history for API call
      const chatHistory = currentDocument.chatHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Get AI response
      const response = await openAIClient.refinePurpose(
        userMessage,
        currentDocument.purpose,
        chatHistory
      );

      // Add AI response to chat
      addChatMessage({
        role: 'assistant',
        content: response.message
      });

      // Update purpose if suggestions are provided
      if (response.suggestions) {
        const purposeUpdates: any = {};
        
        if (response.suggestions.coreProblem) {
          purposeUpdates.coreProblem = {
            ...currentDocument.purpose.coreProblem,
            ...(response.suggestions.coreProblem.challenge && { challenge: response.suggestions.coreProblem.challenge }),
            ...(response.suggestions.coreProblem.importance && { importance: response.suggestions.coreProblem.importance }),
            ...(response.suggestions.coreProblem.currentImpact && { currentImpact: response.suggestions.coreProblem.currentImpact })
          };
        }
        
        if (response.suggestions.targetOutcome) {
          purposeUpdates.targetOutcome = {
            ...currentDocument.purpose.targetOutcome,
            ...(response.suggestions.targetOutcome.successDefinition && { successDefinition: response.suggestions.targetOutcome.successDefinition }),
            ...(response.suggestions.targetOutcome.measurableResults && { measurableResults: response.suggestions.targetOutcome.measurableResults }),
            ...(response.suggestions.targetOutcome.beneficiaries && { beneficiaries: response.suggestions.targetOutcome.beneficiaries })
          };
        }
        
        if (response.suggestions.boundaries) {
          purposeUpdates.boundaries = {
            ...currentDocument.purpose.boundaries,
            ...(response.suggestions.boundaries.included && { included: response.suggestions.boundaries.included }),
            ...(response.suggestions.boundaries.excluded && { excluded: response.suggestions.boundaries.excluded }),
            ...(response.suggestions.boundaries.adjacentProblems && { adjacentProblems: response.suggestions.boundaries.adjacentProblems })
          };
        }
        
        if (Object.keys(purposeUpdates).length > 0) {
          updatePurpose(purposeUpdates);
        }
      }

    } catch (error) {
      console.error('Error getting AI response:', error);
      addChatMessage({
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again or check your API key settings.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show API key prompt if not configured
  if (apiKeyPrompt) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            OpenAI API Key Required
          </h3>
          <p className="text-slate-600 mb-4">
            To use the Purpose refinement feature, please enter your OpenAI API key:
          </p>
          <form onSubmit={handleApiKeySubmit} className="space-y-4">
            <input
              type="password"
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
            <button
              type="submit"
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              Continue
            </button>
          </form>
          <p className="text-xs text-slate-500 mt-2">
            Your API key is stored locally and never shared.
          </p>
        </div>
      </div>
    );
  }

  if (!currentDocument) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentDocument.chatHistory.length === 0 && (
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <p className="text-slate-600">
              Welcome! I'll help you define a clear Purpose for your BrainLift document. 
              Let's start by understanding what challenge you're trying to solve.
            </p>
          </div>
        )}
        
        {currentDocument.chatHistory.map((message) => (
          <ChatMessageComponent key={message.id} message={message} />
        ))}
        
        {isLoading && (
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <span className="text-slate-500 ml-2">AI is thinking...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 bg-white p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

/**
 * Individual chat message component
 */
interface ChatMessageComponentProps {
  message: ChatMessage;
}

function ChatMessageComponent({ message }: ChatMessageComponentProps) {
  const isUser = message.role === 'user';
  
  // Handle timestamp - convert to Date if it's a string (from localStorage serialization)
  const timestamp = message.timestamp instanceof Date 
    ? message.timestamp 
    : new Date(message.timestamp);
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-lg p-4 ${
        isUser 
          ? 'bg-primary-600 text-white' 
          : 'bg-white border border-slate-200 text-slate-800'
      }`}>
        <div className="whitespace-pre-wrap">{message.content}</div>
        <div className={`text-xs mt-2 ${
          isUser ? 'text-primary-100' : 'text-slate-500'
        }`}>
          {timestamp.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
} 