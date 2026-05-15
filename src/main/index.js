const { app, BrowserWindow } = require('electron');
const path = require('path');
const store = require('./store');
const { sessions, state } = require('./state');

// Import IPC modules
const registerProfilesIPC = require('./ipc/profiles');
const registerSshIPC = require('./ipc/ssh');
const registerSftpIPC = require('./ipc/sftp');
const registerTunnelIPC = require('./ipc/tunnel');
const registerSshKeysIPC = require('./ipc/sshKeys');
const registerShellIPC = require('./ipc/shell');
const registerLocalFsIPC = require('./ipc/localFs');
const registerSettingsIPC = require('./ipc/settings');

// ─── Hardware Acceleration (configurable via settings) ───
if (store.get('settings.disableGPU')) {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
}

// ─── Window ─────────────────────────────────────────────────────────────────
function createWindow() {
  state.mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 500,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#0d1117',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Dev: load Vite dev server; Prod: load built index.html
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    state.mainWindow.loadURL('http://localhost:5173');
    state.mainWindow.webContents.openDevTools();
  } else {
    state.mainWindow.loadFile(path.join(__dirname, '../../renderer/dist/index.html'));
  }

  state.mainWindow.on('closed', () => {
    // Close all SSH sessions
    sessions.forEach(({ conn }) => conn.end());
    sessions.clear();
    // Cleanup local shell sessions
    try {
      const { localShells } = require('./ipc/shell');
      if (localShells) {
        localShells.forEach(pty => { try { pty.kill(); } catch {} });
        localShells.clear();
      }
    } catch {}
    state.mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  // Register all IPC handlers
  registerProfilesIPC();
  registerSshIPC();
  registerSftpIPC();
  registerTunnelIPC();
  registerSshKeysIPC();
  registerShellIPC();
  registerLocalFsIPC();
  registerSettingsIPC();
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (!state.mainWindow) createWindow(); });
