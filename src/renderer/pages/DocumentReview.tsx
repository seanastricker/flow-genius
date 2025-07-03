/**
 * Document Review Page - Feature 5: Document Review and Editing
 * 
 * This page allows users to review, edit, and finalize AI-generated research content.
 * Users can edit individual sections, view source citations, and validate the document
 * before proceeding to the save process.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentStore } from '../stores/document-store';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ContentEditor } from '../components/features/ContentEditor/ContentEditor';
import { SourceDisplay } from '../components/features/SourceDisplay/SourceDisplay';
import { validateDocument } from '../services/document/validation-service';

/**
 * Safely formats a date value to a locale string
 * @param dateValue - Date value that could be a Date object, string, or timestamp
 * @returns Formatted date string or fallback message
 */
function formatDate(dateValue: any): string {
  try {
    if (!dateValue) return 'Not set';
    
    let date: Date;
    
    if (dateValue instanceof Date) {
      date = dateValue;
    } else if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    } else if (typeof dateValue === 'number') {
      date = new Date(dateValue);
    } else if (dateValue.toDate && typeof dateValue.toDate === 'function') {
      // Handle Firebase Timestamp objects
      date = dateValue.toDate();
    } else {
      return 'Invalid date';
    }
    
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return date.toLocaleDateString();
  } catch (error) {
    console.warn('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Main document review page component
 */
export function DocumentReview() {
  const navigate = useNavigate();
  const { currentDocument, updateDocument, setDocumentStatus } = useDocumentStore();
  
  const [activeSection, setActiveSection] = useState<string>('experts');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Redirect if no document or wrong status
  useEffect(() => {
    if (!currentDocument) {
      navigate('/');
      return;
    }
    
    // Allow access to review page if document has any research content
    // This handles cases where user navigates back from save page
    const hasResearchContent = (currentDocument.experts && currentDocument.experts.length > 0) ||
                              (currentDocument.spikyPOVs && currentDocument.spikyPOVs.length > 0) ||
                              (currentDocument.knowledgeTree && currentDocument.knowledgeTree.length > 0);
    
    if (!hasResearchContent) {
      // Only redirect if there's truly no research content to review
      if (currentDocument.status === 'purpose-definition') {
        navigate('/purpose');
      } else if (currentDocument.status === 'research-active') {
        navigate('/research');
      } else {
        navigate('/');
      }
      return;
    }
    
    // Set status to in-review when user enters this page (if not already completed)
    if (currentDocument.status === 'research-complete') {
      setDocumentStatus('in-review');
    }
  }, [currentDocument, navigate, setDocumentStatus]);

  // Auto-save when document changes
  useEffect(() => {
    if (hasUnsavedChanges && currentDocument) {
      const saveTimeout = setTimeout(() => {
        // Auto-save to Firebase would happen here
        setHasUnsavedChanges(false);
      }, 2000);
      
      return () => clearTimeout(saveTimeout);
    }
  }, [hasUnsavedChanges, currentDocument]);

  if (!currentDocument) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No Document Found</h2>
          <p className="text-slate-600 mb-4">Please create a new BrainLift document first.</p>
          <Button onClick={() => navigate('/')}>Go to Home</Button>
        </div>
      </div>
    );
  }

  const handleSectionEdit = (sectionType: string, sectionId: string, content: string) => {
    setHasUnsavedChanges(true);
    
    if (sectionType === 'experts') {
      const updatedExperts = currentDocument.experts.map(expert => 
        expert.id === sectionId 
          ? { ...expert, generatedContent: content, lastUpdated: new Date() }
          : expert
      );
      updateDocument({ experts: updatedExperts });
    } else if (sectionType === 'spikyPOVs') {
      const updatedSpiky = currentDocument.spikyPOVs.map(spiky => 
        spiky.id === sectionId 
          ? { ...spiky, generatedContent: content, lastUpdated: new Date() }
          : spiky
      );
      updateDocument({ spikyPOVs: updatedSpiky });
    } else if (sectionType === 'knowledgeTree') {
      const updatedKnowledge = currentDocument.knowledgeTree.map(knowledge => 
        knowledge.id === sectionId 
          ? { ...knowledge, generatedContent: content, lastUpdated: new Date() }
          : knowledge
      );
      updateDocument({ knowledgeTree: updatedKnowledge });
    }
  };

  const handleValidateDocument = async () => {
    setIsValidating(true);
    setValidationErrors([]);
    
    try {
      const errors = await validateDocument(currentDocument);
      setValidationErrors(errors);
      
      if (errors.length === 0) {
        // Document is valid, proceed to save
        handleProceedToSave();
      }
    } catch (error) {
      setValidationErrors(['Validation failed. Please try again.']);
    } finally {
      setIsValidating(false);
    }
  };

  const handleProceedToSave = () => {
    // Navigate to save page (Feature 6)
    console.log('Proceeding to save page...');
    navigate('/save');
  };

  const sectionTabs = [
    { id: 'experts', label: 'Experts', count: currentDocument.experts?.length || 0 },
    { id: 'spikyPOVs', label: 'SpikyPOVs', count: currentDocument.spikyPOVs?.length || 0 },
    { id: 'knowledgeTree', label: 'Knowledge Tree', count: currentDocument.knowledgeTree?.length || 0 }
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Document Review</h1>
              <p className="text-slate-600 mt-1">Review and edit your BrainLift research content</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
              >
                Back to Home
              </Button>
              <Button
                onClick={handleValidateDocument}
                disabled={isValidating}
                className="bg-green-600 hover:bg-green-700"
              >
                {isValidating ? 'Validating...' : 'Validate & Save'}
              </Button>
            </div>
          </div>
          
          {/* Document Info */}
          <div className="bg-white rounded-lg border p-4">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">{currentDocument.title}</h2>
            <div className="flex items-center space-x-6 text-sm text-slate-600">
              <span>Created: {formatDate(currentDocument.createdAt)}</span>
              <span>Last Updated: {formatDate(currentDocument.updatedAt)}</span>
              <span className="capitalize">Status: {currentDocument.status.replace('-', ' ')}</span>
              {hasUnsavedChanges && (
                <span className="text-amber-600 font-medium">● Unsaved changes</span>
              )}
            </div>
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mb-6">
            <Card className="border-red-200 bg-red-50">
              <div className="p-4">
                <h3 className="text-sm font-medium text-red-800 mb-2">Validation Issues</h3>
                <ul className="text-sm text-red-700 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </Card>
          </div>
        )}

        {/* Section Tabs */}
        <div className="mb-6">
          <div className="border-b border-slate-200">
            <nav className="flex space-x-8">
              {sectionTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeSection === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Section Content */}
        <div className="space-y-6">
          {activeSection === 'experts' && currentDocument.experts?.map((expert, index) => (
            <Card key={expert.id} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    Experts
                  </h3>
                  <ContentEditor
                    content={expert.generatedContent || ''}
                    onContentChange={(content) => handleSectionEdit('experts', expert.id, content)}
                    placeholder="Generated expert analysis will appear here..."
                  />
                </div>
                <div>
                  <SourceDisplay
                    sources={expert.sources || []}
                    expertInfo={expert.expert}
                  />
                </div>
              </div>
            </Card>
          ))}

          {activeSection === 'spikyPOVs' && currentDocument.spikyPOVs?.map((spiky, index) => (
            <Card key={spiky.id} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    SpikyPOVs
                  </h3>
                  <ContentEditor
                    content={spiky.generatedContent || ''}
                    onContentChange={(content) => handleSectionEdit('spikyPOVs', spiky.id, content)}
                    placeholder="Generated SpikyPOV analysis will appear here..."
                  />
                </div>
                <div>
                  <SourceDisplay sources={spiky.sources || []} />
                </div>
              </div>
            </Card>
          ))}

          {activeSection === 'knowledgeTree' && currentDocument.knowledgeTree?.map((knowledge, index) => (
            <Card key={knowledge.id} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    Knowledge Tree
                  </h3>
                  <ContentEditor
                    content={knowledge.generatedContent || ''}
                    onContentChange={(content) => handleSectionEdit('knowledgeTree', knowledge.id, content)}
                    placeholder="Generated knowledge tree analysis will appear here..."
                  />
                </div>
                <div>
                  <SourceDisplay sources={knowledge.sources || []} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="mt-8 flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => navigate('/research')}
          >
            ← Back to Research
          </Button>
          
          <div className="flex items-center space-x-3">
            <span className="text-sm text-slate-600">
              {hasUnsavedChanges ? 'Auto-saving...' : 'All changes saved'}
            </span>
            <Button
              onClick={handleValidateDocument}
              disabled={isValidating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isValidating ? 'Validating...' : 'Validate & Save Document'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 