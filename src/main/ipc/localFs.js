const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = function registerLocalFsIPC() {
  ipcMain.handle('localFs:list', (_, dirPath) => {
    return new Promise((resolve, reject) => {
      try {
        const p = dirPath || os.homedir();
        const items = fs.readdirSync(p);
        
        const files = items.map(name => {
          try {
            const stat = fs.statSync(path.join(p, name));
            return {
              name,
              type: stat.isDirectory() ? 'dir' : 'file',
              size: stat.size,
              modified: stat.mtime.toISOString(),
            };
          } catch (e) {
            return null;
          }
        }).filter(Boolean);

        // Sort: dirs first, alphabet
        files.sort((a, b) => {
          if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
          return a.name.localeCompare(b.name);
        });

        // Add parent dir '..'
        const parentFiles = [{ name: '..', type: 'dir', size: 0, modified: '' }, ...files];
        resolve(parentFiles);
      } catch (err) {
        reject({ message: err.message });
      }
    });
  });

  ipcMain.handle('localFs:home', () => os.homedir());
};
