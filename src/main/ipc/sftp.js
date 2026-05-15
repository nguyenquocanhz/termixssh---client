const { ipcMain } = require('electron');
const { sessions, state } = require('../state');

// ─── Cached SFTP subsystem per session ──────────────────────────────────────
function getSftp(session) {
  if (session._sftp) return Promise.resolve(session._sftp);
  return new Promise((resolve, reject) => {
    session.conn.sftp((err, sftp) => {
      if (err) return reject({ message: err.message });
      session._sftp = sftp;
      sftp.on('close', () => { session._sftp = null; });
      sftp.on('error', () => { session._sftp = null; });
      resolve(sftp);
    });
  });
}

module.exports = function registerSftpIPC() {
  ipcMain.handle('sftp:list', async (_, { sessionId, remotePath }) => {
    const session = sessions.get(sessionId);
    if (!session) throw { message: 'Session not found' };

    const sftp = await getSftp(session);
    return new Promise((resolve, reject) => {
      sftp.readdir(remotePath, (err, list) => {
        if (err) return reject({ message: err.message });

        const files = list.map(item => ({
          name: item.filename,
          type: item.attrs.isDirectory() ? 'dir' : 'file',
          size: item.attrs.size,
          modified: new Date(item.attrs.mtime * 1000).toISOString(),
          permissions: item.attrs.mode,
        }));

        // Dirs first, then files, alphabetical
        files.sort((a, b) => {
          if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
          return a.name.localeCompare(b.name);
        });

        resolve([{ name: '..', type: 'dir', size: 0, modified: '' }, ...files]);
      });
    });
  });

  ipcMain.handle('sftp:download', async (_, { sessionId, remotePath, localPath }) => {
    const session = sessions.get(sessionId);
    if (!session) throw { message: 'Session not found' };

    const sftp = await getSftp(session);
    return new Promise((resolve, reject) => {
      sftp.fastGet(remotePath, localPath, {
        step: (transferred, chunk, total) => {
          state.mainWindow?.webContents.send('sftp:progress', {
            sessionId, type: 'download', remotePath,
            transferred, total,
          });
        },
      }, (err) => {
        if (err) return reject({ message: err.message });
        resolve({ success: true });
      });
    });
  });

  ipcMain.handle('sftp:upload', async (_, { sessionId, localPath, remotePath }) => {
    const session = sessions.get(sessionId);
    if (!session) throw { message: 'Session not found' };

    const sftp = await getSftp(session);
    return new Promise((resolve, reject) => {
      sftp.fastPut(localPath, remotePath, {
        step: (transferred, chunk, total) => {
          state.mainWindow?.webContents.send('sftp:progress', {
            sessionId, type: 'upload', localPath,
            transferred, total,
          });
        },
      }, (err) => {
        if (err) return reject({ message: err.message });
        resolve({ success: true });
      });
    });
  });

  ipcMain.handle('sftp:mkdir', async (_, { sessionId, remotePath }) => {
    const session = sessions.get(sessionId);
    if (!session) throw { message: 'Session not found' };

    const sftp = await getSftp(session);
    return new Promise((resolve, reject) => {
      sftp.mkdir(remotePath, (err) => {
        if (err) return reject({ message: err.message });
        resolve({ success: true });
      });
    });
  });

  ipcMain.handle('sftp:delete', async (_, { sessionId, remotePath }) => {
    const session = sessions.get(sessionId);
    if (!session) throw { message: 'Session not found' };

    const sftp = await getSftp(session);
    return new Promise((resolve, reject) => {
      sftp.unlink(remotePath, (err) => {
        if (err) return reject({ message: err.message });
        resolve({ success: true });
      });
    });
  });
};
