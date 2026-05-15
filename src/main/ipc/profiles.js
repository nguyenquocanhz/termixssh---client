const { ipcMain } = require('electron');
const store = require('../store');

module.exports = function registerProfilesIPC() {
  ipcMain.handle('profiles:list', () => store.get('profiles'));

  ipcMain.handle('profiles:save', (_, profile) => {
    const profiles = store.get('profiles');
    const idx = profiles.findIndex(p => p.id === profile.id);
    if (idx >= 0) profiles[idx] = profile;
    else profiles.push({ ...profile, id: Date.now().toString() });
    store.set('profiles', profiles);
    return profiles;
  });

  ipcMain.handle('profiles:delete', (_, id) => {
    const profiles = store.get('profiles').filter(p => p.id !== id);
    store.set('profiles', profiles);
    return profiles;
  });
};
