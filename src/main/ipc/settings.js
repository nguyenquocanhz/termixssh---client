const { ipcMain, dialog } = require('electron');
const store = require('../store');

module.exports = function registerSettingsIPC() {
  ipcMain.handle('settings:get', () => {
    return store.get('settings');
  });

  ipcMain.handle('settings:set', (_, settings) => {
    store.set('settings', settings);
    return settings;
  });

  ipcMain.handle('settings:selectFolder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Chọn thư mục lưu SSH Keys',
    });
    if (result.canceled || !result.filePaths.length) return { canceled: true };
    return { canceled: false, path: result.filePaths[0] };
  });

  ipcMain.handle('settings:selectFile', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      title: 'Chọn Private Key',
    });
    if (result.canceled || !result.filePaths.length) return { canceled: true };
    return { canceled: false, path: result.filePaths[0] };
  });

  ipcMain.handle('settings:getStorePath', () => {
    const os = require('os');
    const path = require('path');
    const customPath = store.get('settings.keyStorePath');
    return customPath || path.join(os.homedir(), '.ssh');
  });
};
