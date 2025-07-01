import type { ElectronAPI } from '../../preload/index';

/**
 * Global type definitions for the renderer process
 */
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {}; 