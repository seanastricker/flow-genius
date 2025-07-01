import { app, BrowserWindow } from 'electron';
import { join } from 'path';

/**
 * Creates the main application window with proper security settings
 */
function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Disabled for development, should be enabled in production
      preload: join(__dirname, '../preload/index.js'),
      webSecurity: true
    }
  });

  // Load the renderer
  const isDevelopment = process.env.NODE_ENV === 'development' || !app.isPackaged;
  
  if (isDevelopment) {
    mainWindow.loadURL('http://127.0.0.1:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  return mainWindow;
}

/**
 * Configure Electron app settings
 */
// Reduce GPU-related warnings on Windows
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-software-rasterizer');

/**
 * App event handlers
 */
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
}); 