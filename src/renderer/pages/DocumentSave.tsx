/**
 * Document Save Page - Feature 6: Document Generation and File System Integration
 * 
 * This page provides the interface for saving BrainLift documents to project directories.
 * Includes project selection/creation, filename configuration, and save progress tracking.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentStore } from '../stores/document-store';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { documentService, type SaveResult, isDocumentReadyForSave, formatFileSize, estimateSaveTime } from '../services/document/document-service';

/**
 * Available save modes
 */
type SaveMode = 'existing' | 'new';

/**
 * Save process steps
 */
type SaveStep = 'configure' | 'saving' | 'complete' | 'error';

export function DocumentSave() {
  const navigate = useNavigate();
  const { currentDocument, updateDocument } = useDocumentStore();
  
  // Form state
  const [saveMode, setSaveMode] = useState<SaveMode>('existing');
  const [selectedProject, setSelectedProject] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [filename, setFilename] = useState('');
  const [availableProjects, setAvailableProjects] = useState<string[]>([]);
  
  // Save process state
  const [saveStep, setSaveStep] = useState<SaveStep>('configure');
  const [saveProgress, setSaveProgress] = useState(0);
  const [saveResult, setSaveResult] = useState<SaveResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Loading states
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isCheckingFileExists, setIsCheckingFileExists] = useState(false);
  
  // Initialize component
  useEffect(() => {
    if (!currentDocument) {
      navigate('/');
      return;
    }
    
    // Generate suggested filename
    const suggestedFilename = documentService.generateSuggestedFilename(currentDocument);
    setFilename(suggestedFilename);
    
    // Load available projects
    loadProjects();
    
    // Validate document
    const errors = documentService.validateDocument(currentDocument);
    setValidationErrors(errors);
  }, [currentDocument, navigate]);

  /**
   * Loads the list of available projects
   */
  const loadProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const projects = await documentService.listProjects();
      setAvailableProjects(projects);
      
      // Auto-select FlowGenius if it exists
      if (projects.includes('FlowGenius')) {
        setSelectedProject('FlowGenius');
      } else if (projects.length > 0) {
        setSelectedProject(projects[0]);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  /**
   * Handles project selection change
   */
  const handleProjectChange = async (projectName: string) => {
    setSelectedProject(projectName);
    
    // Check if file exists in selected project
    if (projectName && filename) {
      setIsCheckingFileExists(true);
      try {
        const exists = await documentService.fileExists(projectName, filename);
        if (exists) {
          // File exists, show warning or suggest alternative name
          console.warn(`File ${filename} already exists in project ${projectName}`);
        }
      } catch (error) {
        console.error('Error checking file existence:', error);
      } finally {
        setIsCheckingFileExists(false);
      }
    }
  };

  /**
   * Handles creating a new project
   */
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      return;
    }
    
    try {
      const result = await documentService.createProject(newProjectName.trim());
      
      if (result.success) {
        // Reload projects and select the new one
        await loadProjects();
        setSelectedProject(newProjectName.trim());
        setSaveMode('existing');
        setNewProjectName('');
      } else {
        console.error('Failed to create project:', result.error);
        // Could show error message to user
      }
    } catch (error) {
      console.error('Project creation error:', error);
    }
  };

  /**
   * Handles the save process
   */
  const handleSave = async () => {
    if (!currentDocument || validationErrors.length > 0) {
      return;
    }
    
    const projectName = saveMode === 'existing' ? selectedProject : newProjectName.trim();
    
    if (!projectName || !filename) {
      return;
    }
    
    setSaveStep('saving');
    setSaveProgress(0);
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setSaveProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      // Create project if needed
      if (saveMode === 'new') {
        const createResult = await documentService.createProject(projectName);
        if (!createResult.success) {
          throw new Error(createResult.error || 'Failed to create project');
        }
      }
      
      // Save document
      const result = await documentService.saveDocument(currentDocument, {
        projectName,
        filename
      });
      
      clearInterval(progressInterval);
      setSaveProgress(100);
      setSaveResult(result);
      
      if (result.success) {
        // Update document with project name and file path
        updateDocument({
          projectName,
          filePath: result.filePath,
          status: 'completed'
        });
        
        setSaveStep('complete');
      } else {
        setSaveStep('error');
      }
    } catch (error) {
      setSaveStep('error');
      setSaveResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  /**
   * Handles navigation back to review
   */
  const handleBackToReview = () => {
    navigate('/review');
  };

  /**
   * Handles completion and navigation to home
   */
  const handleComplete = () => {
    navigate('/');
  };

  if (!currentDocument) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No Document Found</h2>
          <p className="text-slate-600 mb-4">Please create or select a document to save.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  const isFormValid = validationErrors.length === 0 && 
                     filename.trim() !== '' && 
                     ((saveMode === 'existing' && selectedProject) || 
                      (saveMode === 'new' && newProjectName.trim()));

  const estimatedSaveTime = estimateSaveTime(currentDocument);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Save BrainLift Document</h1>
            <p className="text-slate-600">
              Choose where to save your completed BrainLift document
            </p>
          </div>

          {/* Document Info */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Document Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <p className="text-slate-900">{currentDocument.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <p className="text-slate-900 capitalize">{currentDocument.status.replace('-', ' ')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Research Sections</label>
                <p className="text-slate-900">
                  {[
                    currentDocument.experts?.length > 0 && 'Experts',
                    currentDocument.spikyPOVs?.length > 0 && 'SpikyPOVs', 
                    currentDocument.knowledgeTree?.length > 0 && 'Knowledge Tree'
                  ].filter(Boolean).join(', ') || 'None'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Estimated Size</label>
                <p className="text-slate-900">{formatFileSize(currentDocument.title.length * 50)}</p>
              </div>
            </div>
          </Card>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Card className="p-6 mb-6 border-red-200 bg-red-50">
              <h3 className="text-lg font-semibold text-red-900 mb-2">Document Validation Issues</h3>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-red-700">{error}</li>
                ))}
              </ul>
              <Button
                variant="outline"
                onClick={handleBackToReview}
                className="mt-4"
              >
                ← Back to Review
              </Button>
            </Card>
          )}

          {/* Save Configuration */}
          {saveStep === 'configure' && (
            <Card className="p-6 mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Save Configuration</h2>
              
              {/* Save Mode Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Project Option</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="saveMode"
                      value="existing"
                      checked={saveMode === 'existing'}
                      onChange={(e) => setSaveMode(e.target.value as SaveMode)}
                      className="mr-2"
                    />
                    Use Existing Project
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="saveMode"
                      value="new"
                      checked={saveMode === 'new'}
                      onChange={(e) => setSaveMode(e.target.value as SaveMode)}
                      className="mr-2"
                    />
                    Create New Project
                  </label>
                </div>
              </div>

              {/* Existing Project Selection */}
              {saveMode === 'existing' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Select Project
                  </label>
                  {isLoadingProjects ? (
                    <div className="text-slate-500">Loading projects...</div>
                  ) : availableProjects.length > 0 ? (
                    <select
                      value={selectedProject}
                      onChange={(e) => handleProjectChange(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select a project...</option>
                      {availableProjects.map(project => (
                        <option key={project} value={project}>{project}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-slate-500">
                      No existing projects found. Create a new project instead.
                    </div>
                  )}
                </div>
              )}

              {/* New Project Creation */}
              {saveMode === 'new' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    New Project Name
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="Enter project name..."
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <Button
                      onClick={handleCreateProject}
                      disabled={!newProjectName.trim()}
                      variant="outline"
                    >
                      Create
                    </Button>
                  </div>
                </div>
              )}

              {/* Filename Configuration */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Filename
                </label>
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="brainlift-document-name.md"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {isCheckingFileExists && (
                  <p className="text-sm text-slate-500 mt-1">Checking if file exists...</p>
                )}
              </div>

              {/* Save Path Preview */}
              {((saveMode === 'existing' && selectedProject) || (saveMode === 'new' && newProjectName)) && filename && (
                <div className="mb-6 p-3 bg-slate-100 rounded-md">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Save Location</label>
                  <p className="text-sm text-slate-600 font-mono">
                    C:\Users\seana\OneDrive\Documents\Gauntlet Projects\
                    {saveMode === 'existing' ? selectedProject : newProjectName}\docs\{filename}
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* Save Progress */}
          {saveStep === 'saving' && (
            <Card className="p-6 mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Saving Document...</h2>
              <div className="mb-4">
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${saveProgress}%` }}
                  />
                </div>
              </div>
              <p className="text-slate-600">
                {saveProgress < 100 ? 'Generating markdown and saving to file system...' : 'Finalizing...'}
              </p>
            </Card>
          )}

          {/* Save Complete */}
          {saveStep === 'complete' && saveResult?.success && (
            <Card className="p-6 mb-6 border-green-200 bg-green-50">
              <h2 className="text-lg font-semibold text-green-900 mb-4">✅ Document Saved Successfully!</h2>
              <div className="space-y-2 mb-4">
                <p className="text-green-800">
                  <span className="font-medium">File Path:</span> {saveResult.filePath}
                </p>
                <p className="text-green-800">
                  <span className="font-medium">Project:</span> {currentDocument.projectName}
                </p>
              </div>
              <div className="flex space-x-3">
                <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700">
                  Return to Home
                </Button>
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    try {
                      if (saveResult.filePath) {
                        const result = await window.electronAPI.showItemInFolder(saveResult.filePath);
                        if (!result.success) {
                          console.error('Failed to open file location:', result.error);
                        }
                      }
                    } catch (error) {
                      console.error('Error opening file location:', error);
                    }
                  }}
                >
                  Open File Location
                </Button>
              </div>
            </Card>
          )}

          {/* Save Error */}
          {saveStep === 'error' && (
            <Card className="p-6 mb-6 border-red-200 bg-red-50">
              <h2 className="text-lg font-semibold text-red-900 mb-4">❌ Save Failed</h2>
              <p className="text-red-800 mb-4">
                {saveResult?.error || 'An unknown error occurred while saving the document.'}
              </p>
              <div className="flex space-x-3">
                <Button onClick={() => setSaveStep('configure')} variant="outline">
                  Try Again
                </Button>
                <Button onClick={handleBackToReview} variant="outline">
                  Back to Review
                </Button>
              </div>
            </Card>
          )}

          {/* Bottom Actions */}
          {saveStep === 'configure' && (
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={handleBackToReview}
              >
                ← Back to Review
              </Button>
              
              <div className="flex items-center space-x-4">
                <div className="text-sm text-slate-600">
                  Estimated save time: {Math.ceil(estimatedSaveTime / 1000)}s
                </div>
                <Button
                  onClick={handleSave}
                  disabled={!isFormValid}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Save Document
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 