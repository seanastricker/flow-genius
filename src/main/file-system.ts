/**
 * File System Service - Main Process
 * Handles all file system operations securely from the main process
 * Following Electron security best practices with proper path validation
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { ipcMain } from 'electron';

/**
 * Base directory for BrainLift projects
 * Following the project requirements specification
 */
const BASE_DIRECTORY = 'C:\\Users\\seana\\OneDrive\\Documents\\Gauntlet Projects';

/**
 * Interface for save document request
 */
interface SaveDocumentRequest {
  content: string;
  projectName: string;
  filename: string;
}

/**
 * Interface for save document response
 */
interface SaveDocumentResponse {
  success: boolean;
  filePath?: string;
  error?: string;
}

/**
 * Interface for project listing response
 */
interface ProjectListResponse {
  success: boolean;
  projects?: string[];
  error?: string;
}

/**
 * Interface for file conflict resolution
 */
interface FileConflictResponse {
  success: boolean;
  resolvedPath?: string;
  action?: 'overwrite' | 'rename' | 'cancel';
  error?: string;
}

/**
 * Initializes the file system IPC handlers
 * Must be called during application startup
 */
export function initializeFileSystemHandlers(): void {
  // Save document to project directory
  ipcMain.handle('fs:save-document', async (event, request: SaveDocumentRequest): Promise<SaveDocumentResponse> => {
    try {
      const { content, projectName, filename } = request;
      
      // Validate inputs
      const validationError = validateSaveRequest(request);
      if (validationError) {
        return { success: false, error: validationError };
      }
      
      // Create project directory if needed
      const projectDir = path.join(BASE_DIRECTORY, sanitizeProjectName(projectName));
      const docsDir = path.join(projectDir, 'docs');
      
      await fs.ensureDir(docsDir);
      
      // Generate final file path with conflict resolution
      const requestedPath = path.join(docsDir, filename);
      const finalPath = await resolveFileConflict(requestedPath);
      
      // Write file securely
      await fs.writeFile(finalPath, content, 'utf-8');
      
      return {
        success: true,
        filePath: finalPath
      };
      
    } catch (error) {
      console.error('File save error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  });
  
  // List existing projects
  ipcMain.handle('fs:list-projects', async (): Promise<ProjectListResponse> => {
    try {
      // Ensure base directory exists
      await fs.ensureDir(BASE_DIRECTORY);
      
      // Read directory contents
      const items = await fs.readdir(BASE_DIRECTORY, { withFileTypes: true });
      
      // Filter for directories only
      const projects = items
        .filter(item => item.isDirectory())
        .map(item => item.name)
        .sort();
      
      return {
        success: true,
        projects
      };
      
    } catch (error) {
      console.error('Project list error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list projects'
      };
    }
  });
  
  // Create new project directory
  ipcMain.handle('fs:create-project', async (event, projectName: string): Promise<SaveDocumentResponse> => {
    try {
      if (!projectName || typeof projectName !== 'string') {
        return { success: false, error: 'Project name is required' };
      }
      
      const sanitized = sanitizeProjectName(projectName);
      if (!sanitized) {
        return { success: false, error: 'Invalid project name' };
      }
      
      const projectDir = path.join(BASE_DIRECTORY, sanitized);
      const docsDir = path.join(projectDir, 'docs');
      
      // Check if project already exists
      if (await fs.pathExists(projectDir)) {
        return { success: false, error: 'Project already exists' };
      }
      
      // Create project structure
      await fs.ensureDir(docsDir);
      
      // Create a basic README in the project
      const readmeContent = `# ${projectName}\n\nCreated by BrainSwift on ${new Date().toLocaleDateString()}\n`;
      await fs.writeFile(path.join(projectDir, 'README.md'), readmeContent, 'utf-8');
      
      return {
        success: true,
        filePath: projectDir
      };
      
    } catch (error) {
      console.error('Project creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create project'
      };
    }
  });
  
  // Check if file exists (for conflict detection)
  ipcMain.handle('fs:file-exists', async (event, projectName: string, filename: string): Promise<boolean> => {
    try {
      const projectDir = path.join(BASE_DIRECTORY, sanitizeProjectName(projectName));
      const filePath = path.join(projectDir, 'docs', filename);
      
      // Validate path is within allowed directory
      if (!isPathSafe(filePath)) {
        return false;
      }
      
      return await fs.pathExists(filePath);
      
    } catch (error) {
      console.error('File exists check error:', error);
      return false;
    }
  });
  
  // Get file stats (for backup/versioning)
  ipcMain.handle('fs:get-file-stats', async (event, filePath: string) => {
    try {
      if (!isPathSafe(filePath)) {
        throw new Error('Invalid file path');
      }
      
      const stats = await fs.stat(filePath);
      
      return {
        success: true,
        stats: {
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          isFile: stats.isFile(),
          isDirectory: stats.isDirectory()
        }
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get file stats'
      };
    }
  });
}

/**
 * Validates a save document request
 * @param request - The save document request to validate
 * @returns Error message if invalid, null if valid
 */
function validateSaveRequest(request: SaveDocumentRequest): string | null {
  if (!request.content || typeof request.content !== 'string') {
    return 'Document content is required';
  }
  
  if (!request.projectName || typeof request.projectName !== 'string') {
    return 'Project name is required';
  }
  
  if (!request.filename || typeof request.filename !== 'string') {
    return 'Filename is required';
  }
  
  // Validate filename
  if (!/^[a-zA-Z0-9\-_\s\.]+\.md$/.test(request.filename)) {
    return 'Invalid filename format. Must be a .md file with safe characters only';
  }
  
  // Check content size (prevent extremely large files)
  if (request.content.length > 10 * 1024 * 1024) { // 10MB limit
    return 'Document content too large (max 10MB)';
  }
  
  return null;
}

/**
 * Sanitizes a project name for safe file system usage
 * @param projectName - Raw project name from user
 * @returns Sanitized project name
 */
function sanitizeProjectName(projectName: string): string {
  return projectName
    .trim()
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid Windows filename characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 100); // Limit length
}

/**
 * Resolves file conflicts by finding an available filename
 * @param requestedPath - The originally requested file path
 * @returns Promise resolving to available file path
 */
async function resolveFileConflict(requestedPath: string): Promise<string> {
  if (!(await fs.pathExists(requestedPath))) {
    return requestedPath;
  }
  
  const dir = path.dirname(requestedPath);
  const ext = path.extname(requestedPath);
  const name = path.basename(requestedPath, ext);
  
  let counter = 1;
  let newPath: string;
  
  do {
    newPath = path.join(dir, `${name}-${counter}${ext}`);
    counter++;
  } while (await fs.pathExists(newPath));
  
  return newPath;
}

/**
 * Validates that a file path is safe and within allowed directories
 * @param filePath - The file path to validate
 * @returns True if path is safe, false otherwise
 */
function isPathSafe(filePath: string): boolean {
  try {
    // Resolve the path to eliminate any relative path traversal attempts
    const resolvedPath = path.resolve(filePath);
    const normalizedBasePath = path.resolve(BASE_DIRECTORY);
    
    // Check if the resolved path is within the base directory
    return resolvedPath.startsWith(normalizedBasePath);
  } catch (error) {
    console.error('Path validation error:', error);
    return false;
  }
}

/**
 * Creates a backup of an existing file before overwriting
 * @param filePath - Path to file to backup
 * @returns Promise resolving to backup file path
 */
async function createBackup(filePath: string): Promise<string> {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const name = path.basename(filePath, ext);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  const backupPath = path.join(dir, `${name}.backup.${timestamp}${ext}`);
  
  await fs.copy(filePath, backupPath);
  
  return backupPath;
}

/**
 * Cleans up old backup files to prevent disk space issues
 * @param directory - Directory to clean backups from
 * @param maxBackups - Maximum number of backups to keep per file
 */
async function cleanupBackups(directory: string, maxBackups: number = 5): Promise<void> {
  try {
    const files = await fs.readdir(directory);
    const backupFiles = files.filter(file => file.includes('.backup.'));
    
    // Group backups by original filename
    const backupGroups = new Map<string, string[]>();
    
    backupFiles.forEach(backup => {
      const baseName = backup.split('.backup.')[0];
      if (!backupGroups.has(baseName)) {
        backupGroups.set(baseName, []);
      }
      backupGroups.get(baseName)!.push(backup);
    });
    
    // Remove excess backups
    for (const [baseName, backups] of backupGroups) {
      if (backups.length > maxBackups) {
        // Sort by creation time (newest first)
        backups.sort((a, b) => {
          const timeA = a.split('.backup.')[1];
          const timeB = b.split('.backup.')[1];
          return timeB.localeCompare(timeA);
        });
        
        // Remove oldest backups
        const toRemove = backups.slice(maxBackups);
        for (const backup of toRemove) {
          await fs.remove(path.join(directory, backup));
        }
      }
    }
  } catch (error) {
    console.error('Backup cleanup error:', error);
  }
}

/**
 * Gets available disk space for the base directory
 * Note: This is a placeholder implementation. Full disk space checking
 * can be implemented later with platform-specific solutions if needed.
 * @returns Promise resolving to available space in bytes (placeholder)
 */
async function getAvailableDiskSpace(): Promise<number> {
  try {
    // For now, return a large number as we're not implementing
    // actual disk space checking in the MVP phase
    return 10 * 1024 * 1024 * 1024; // 10GB placeholder
  } catch (error) {
    console.error('Disk space check error:', error);
    return 0;
  }
} 