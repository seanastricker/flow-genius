/**
 * Document Service
 * Handles document operations including markdown generation, file saving,
 * and project management. Provides a clean interface between UI and file system.
 */

import type { BrainLiftDocument } from '../../stores/document-store';
import { convertToMarkdown, generateFilename, validateDocumentForMarkdown } from './markdown-converter';

/**
 * Interface for project information
 */
export interface ProjectInfo {
  name: string;
  path: string;
  exists: boolean;
}

/**
 * Interface for save operation result
 */
export interface SaveResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

/**
 * Interface for file save options
 */
export interface SaveOptions {
  projectName: string;
  filename?: string;
  overwrite?: boolean;
  createBackup?: boolean;
}

/**
 * Service class for managing document operations
 */
export class DocumentService {
  /**
   * Saves a BrainLift document to the file system
   * @param document - The document to save
   * @param options - Save options including project name and filename
   * @returns Promise resolving to save result
   */
  async saveDocument(document: BrainLiftDocument, options: SaveOptions): Promise<SaveResult> {
    try {
      // Validate document before saving
      const validationErrors = validateDocumentForMarkdown(document);
      if (validationErrors.length > 0) {
        return {
          success: false,
          error: `Document validation failed: ${validationErrors.join(', ')}`
        };
      }

      // Generate markdown content
      const markdownContent = convertToMarkdown(document, {
        includeSourceLinks: true,
        includeMetadata: true,
        includeTableOfContents: true,
        sectionNumbering: true
      });

      // Generate filename if not provided
      const filename = options.filename || generateFilename(document.title);

      // Call main process to save file
      const result = await this.invokeMainProcess('fs:save-document', {
        content: markdownContent,
        projectName: options.projectName,
        filename: filename
      });

      if (result.success) {
        return {
          success: true,
          filePath: result.filePath
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to save document'
        };
      }

    } catch (error) {
      console.error('Document save error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Lists all available projects
   * @returns Promise resolving to array of project names
   */
  async listProjects(): Promise<string[]> {
    try {
      const result = await this.invokeMainProcess('fs:list-projects');
      
      if (result.success) {
        return result.projects || [];
      } else {
        console.error('Failed to list projects:', result.error);
        return [];
      }
    } catch (error) {
      console.error('Project list error:', error);
      return [];
    }
  }

  /**
   * Creates a new project directory
   * @param projectName - Name of the project to create
   * @returns Promise resolving to creation result
   */
  async createProject(projectName: string): Promise<SaveResult> {
    try {
      if (!projectName || projectName.trim() === '') {
        return {
          success: false,
          error: 'Project name is required'
        };
      }

      const result = await this.invokeMainProcess('fs:create-project', projectName.trim());
      
      return {
        success: result.success,
        filePath: result.filePath,
        error: result.error
      };

    } catch (error) {
      console.error('Project creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create project'
      };
    }
  }

  /**
   * Checks if a file exists in a specific project
   * @param projectName - Name of the project
   * @param filename - Name of the file to check
   * @returns Promise resolving to true if file exists
   */
  async fileExists(projectName: string, filename: string): Promise<boolean> {
    try {
      return await this.invokeMainProcess('fs:file-exists', projectName, filename);
    } catch (error) {
      console.error('File exists check error:', error);
      return false;
    }
  }

  /**
   * Generates a preview of the markdown content without saving
   * @param document - The document to preview
   * @returns Generated markdown content
   */
  generatePreview(document: BrainLiftDocument): string {
    try {
      return convertToMarkdown(document, {
        includeSourceLinks: true,
        includeMetadata: false, // Skip metadata in preview
        includeTableOfContents: true,
        sectionNumbering: true
      });
    } catch (error) {
      console.error('Preview generation error:', error);
      return 'Error generating preview';
    }
  }

  /**
   * Validates a document for completeness
   * @param document - The document to validate
   * @returns Array of validation errors (empty if valid)
   */
  validateDocument(document: BrainLiftDocument): string[] {
    return validateDocumentForMarkdown(document);
  }

  /**
   * Generates a suggested filename for a document
   * @param document - The document to generate filename for
   * @returns Suggested filename
   */
  generateSuggestedFilename(document: BrainLiftDocument): string {
    return generateFilename(document.title);
  }

  /**
   * Gets detailed information about a project
   * @param projectName - Name of the project
   * @returns Promise resolving to project information
   */
  async getProjectInfo(projectName: string): Promise<ProjectInfo> {
    try {
      const projects = await this.listProjects();
      const exists = projects.includes(projectName);

      return {
        name: projectName,
        path: exists ? `C:\\Users\\seana\\OneDrive\\Documents\\Gauntlet Projects\\${projectName}` : '',
        exists
      };
    } catch (error) {
      console.error('Project info error:', error);
      return {
        name: projectName,
        path: '',
        exists: false
      };
    }
  }

  /**
   * Safely invokes a main process function via IPC
   * @param channel - IPC channel name
   * @param args - Arguments to pass to main process
   * @returns Promise resolving to main process response
   */
  private async invokeMainProcess(channel: string, ...args: any[]): Promise<any> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available. Make sure the preload script is properly configured.');
    }

    // Route to appropriate file system API method
    switch (channel) {
      case 'fs:save-document':
        return await window.electronAPI.fileSystem.saveDocument(args[0]);
      case 'fs:list-projects':
        return await window.electronAPI.fileSystem.listProjects();
      case 'fs:create-project':
        return await window.electronAPI.fileSystem.createProject(args[0]);
      case 'fs:file-exists':
        return await window.electronAPI.fileSystem.fileExists(args[0], args[1]);
      case 'fs:get-file-stats':
        return await window.electronAPI.fileSystem.getFileStats(args[0]);
      default:
        throw new Error(`Unsupported IPC channel: ${channel}`);
    }
  }
}

/**
 * Singleton instance of the document service
 */
export const documentService = new DocumentService();

/**
 * Utility functions for working with documents
 */

/**
 * Estimates the time required to save a document based on content size
 * @param document - The document to estimate save time for
 * @returns Estimated save time in milliseconds
 */
export function estimateSaveTime(document: BrainLiftDocument): number {
  try {
    const content = convertToMarkdown(document);
    const sizeKB = content.length / 1024;
    
    // Base time (500ms) + 100ms per KB of content
    return 500 + (sizeKB * 100);
  } catch (error) {
    console.error('Save time estimation error:', error);
    return 2000; // Default to 2 seconds
  }
}

/**
 * Checks if a document is ready for saving
 * @param document - The document to check
 * @returns True if document is ready for saving
 */
export function isDocumentReadyForSave(document: BrainLiftDocument): boolean {
  const errors = validateDocumentForMarkdown(document);
  return errors.length === 0;
}

/**
 * Formats file size for display
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Sanitizes a project name for safe usage
 * @param projectName - Raw project name
 * @returns Sanitized project name
 */
export function sanitizeProjectName(projectName: string): string {
  return projectName
    .trim()
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid Windows filename characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 100); // Limit length
} 