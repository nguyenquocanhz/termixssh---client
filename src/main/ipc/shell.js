const { ipcMain } = require('electron');
const os = require('os');
const { state } = require('../state');

// Store local PTY sessions
const localShells = new Map();

function registerShellIPC() {
  // Spawn a local shell (PowerShell or CMD)
  ipcMain.handle('shell:spawn', async (_, { sessionId, shellType }) => {
    try {
      // Dynamic import node-pty (native module)
      const pty = require('node-pty');

      const shellPath = shellType === 'powershell'
        ? 'powershell.exe'
        : 'cmd.exe';

      const ptyProcess = pty.spawn(shellPath, [], {
        name: 'xterm-256color',
        cols: 120,
        rows: 30,
        cwd: os.homedir(),
        env: process.env,
      });

      localShells.set(sessionId, ptyProcess);

      // Forward PTY output → renderer
      ptyProcess.onData((data) => {
        if (state.mainWindow && !state.mainWindow.isDestroyed()) {
          const b64 = Buffer.from(data).toString('base64');
          state.mainWindow.webContents.send('ssh:data', { sessionId, data: b64 });
        }
      });

      ptyProcess.onExit(({ exitCode }) => {
        localShells.delete(sessionId);
        if (state.mainWindow && !state.mainWindow.isDestroyed()) {
          state.mainWindow.webContents.send('ssh:closed', { sessionId });
        }
      });

      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  // Write data to local shell
  ipcMain.on('shell:write', (_, { sessionId, data }) => {
    const ptyProcess = localShells.get(sessionId);
    if (ptyProcess) {
      const buf = Buffer.from(data, 'base64');
      ptyProcess.write(buf.toString());
    }
  });

  // Resize local shell
  ipcMain.on('shell:resize', (_, { sessionId, cols, rows }) => {
    const ptyProcess = localShells.get(sessionId);
    if (ptyProcess) {
      ptyProcess.resize(cols, rows);
    }
  });

  // Kill local shell
  ipcMain.handle('shell:kill', async (_, { sessionId }) => {
    const ptyProcess = localShells.get(sessionId);
    if (ptyProcess) {
      ptyProcess.kill();
      localShells.delete(sessionId);
    }
    return { ok: true };
  });
};

module.exports = registerShellIPC;
module.exports.localShells = localShells;
