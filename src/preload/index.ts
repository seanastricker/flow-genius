import { contextBridge, ipcRenderer } from 'electron';

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