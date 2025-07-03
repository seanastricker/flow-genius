import { contextBridge, ipcRenderer } from 'electron';

/**
 * Research API types
 */
interface ResearchServiceConfig {
  tavilyApiKey: string;
  openaiApiKey: string;
  workerCount?: number;
  maxRetries?: number;
  jobTimeout?: number;
}

interface WorkerJob {
  id: string;
  type: 'experts' | 'spikyPOVs' | 'knowledgeTree';
  queries: string[];
  purpose: string;
  sectionRequirements: any;
}

/**
 * Exposed APIs for the renderer process
 */
const electronAPI = {
  // App information
  getAppInfo: () => ({
    name: 'BrainLift Generator',
    version: '0.1.0'
  }),

  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),

  // Development tools
  openDevTools: () => ipcRenderer.invoke('dev:open-devtools'),

  // External links
  openExternal: (url: string) => ipcRenderer.invoke('app:open-external', url),

  // File system API
  fileSystem: {
    saveDocument: (request: { content: string; projectName: string; filename: string }) =>
      ipcRenderer.invoke('fs:save-document', request),
    
    listProjects: () =>
      ipcRenderer.invoke('fs:list-projects'),
    
    createProject: (projectName: string) =>
      ipcRenderer.invoke('fs:create-project', projectName),
    
    fileExists: (projectName: string, filename: string) =>
      ipcRenderer.invoke('fs:file-exists', projectName, filename),
    
    getFileStats: (filePath: string) =>
      ipcRenderer.invoke('fs:get-file-stats', filePath)
  },

  // Research API
  research: {
    // Initialize research service
    initialize: (config: ResearchServiceConfig) => 
      ipcRenderer.invoke('research-initialize', config),
    
    // Execute single job
    executeJob: (job: WorkerJob) => 
      ipcRenderer.invoke('research-execute-job', job),
    
    // Execute multiple jobs in parallel
    executeJobsParallel: (jobs: WorkerJob[]) => 
      ipcRenderer.invoke('research-execute-jobs-parallel', jobs),
    
    // Get worker status
    getStatus: () => 
      ipcRenderer.invoke('research-get-status'),
    
    // Cancel job
    cancelJob: (jobId: string) => 
      ipcRenderer.invoke('research-cancel-job', jobId),
    
    // Shutdown service
    shutdown: () => 
      ipcRenderer.invoke('research-shutdown'),

    // Event listeners for research updates
    onProgress: (callback: (data: any) => void) => {
      ipcRenderer.on('research-progress', (_, data) => callback(data));
    },
    
    onComplete: (callback: (data: any) => void) => {
      ipcRenderer.on('research-complete', (_, data) => callback(data));
    },
    
    onError: (callback: (data: any) => void) => {
      ipcRenderer.on('research-error', (_, data) => callback(data));
    },

    // Remove research event listeners
    removeProgressListeners: () => ipcRenderer.removeAllListeners('research-progress'),
    removeCompleteListeners: () => ipcRenderer.removeAllListeners('research-complete'),
    removeErrorListeners: () => ipcRenderer.removeAllListeners('research-error')
  },

  // Event listeners
  onWindowEvent: (callback: (event: string) => void) => {
    ipcRenderer.on('window-event', (_, event) => callback(event));
  },

  // Remove event listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  }
};

/**
 * Expose the API to the renderer process
 */
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

/**
 * Type definitions for the exposed API
 */
export type ElectronAPI = typeof electronAPI; 