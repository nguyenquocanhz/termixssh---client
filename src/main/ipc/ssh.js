const { ipcMain } = require('electron');
const { Client } = require('ssh2');
const fs = require('fs');
const store = require('../store');
const { sessions, state } = require('../state');

module.exports = function registerSshIPC() {
  ipcMain.handle('ssh:connect', (event, { sessionId, profile, password, privateKey }) => {
    return new Promise((resolve, reject) => {
      const conn = new Client();

      const authConfig = {
        host: profile.host,
        port: profile.port || 22,
        username: profile.username,
        readyTimeout: 10000,
        keepaliveInterval: store.get('settings.keepAlive') ? 10000 : 0,
        keepaliveCountMax: 3,
        compress: true,
      };

      if (profile.authType === 'key') {
        try {
          authConfig.privateKey = privateKey || fs.readFileSync(profile.keyPath, 'utf8');
          if (profile.passphrase) authConfig.passphrase = profile.passphrase;
        } catch (err) {
          return reject({ code: 'KEY_READ_ERROR', message: err.message });
        }
      } else {
        authConfig.password = password;
      }

      conn.on('ready', () => {
        // Open PTY shell
        conn.shell({ term: 'xterm-256color', rows: 24, cols: 80 }, (err, stream) => {
          if (err) {
            conn.end();
            return reject({ code: 'SHELL_ERROR', message: err.message });
          }

          sessions.set(sessionId, { conn, stream, tunnels: [] });

          stream.on('data', (data) => {
            state.mainWindow?.webContents.send('ssh:data', { sessionId, data: data.toString('base64') });
          });

          stream.stderr.on('data', (data) => {
            state.mainWindow?.webContents.send('ssh:data', { sessionId, data: data.toString('base64') });
          });

          stream.on('close', () => {
            sessions.delete(sessionId);
            state.mainWindow?.webContents.send('ssh:closed', { sessionId });
          });

          resolve({ success: true });
        });
      });

      conn.on('error', (err) => {
        reject({ code: err.code || 'CONNECTION_ERROR', message: err.message });
      });

      conn.on('end', () => {
        sessions.delete(sessionId);
        state.mainWindow?.webContents.send('ssh:closed', { sessionId });
      });

      conn.connect(authConfig);
    });
  });

  // ─── IPC: SSH Write (keyboard input) ────────────────────────────────────────
  ipcMain.on('ssh:write', (_, { sessionId, data }) => {
    const session = sessions.get(sessionId);
    if (session?.stream) {
      session.stream.write(Buffer.from(data, 'base64'));
    }
  });

  // ─── IPC: SSH Resize PTY ─────────────────────────────────────────────────────
  ipcMain.on('ssh:resize', (_, { sessionId, cols, rows }) => {
    const session = sessions.get(sessionId);
    if (session?.stream) {
      session.stream.setWindow(rows, cols, 0, 0);
    }
  });

  // ─── IPC: SSH Disconnect ─────────────────────────────────────────────────────
  ipcMain.handle('ssh:disconnect', (_, { sessionId }) => {
    const session = sessions.get(sessionId);
    if (session) {
      session.tunnels.forEach(t => t.close());
      session.conn.end();
      sessions.delete(sessionId);
    }
    return true;
  });
};
