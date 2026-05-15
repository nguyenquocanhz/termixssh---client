const Store = require('electron-store');
//  Khai báo 
const store = new Store({
  name: 'termix-config',
  defaults: {
    profiles: [],
    sshKeys: [],
    settings: {
      fontSize: 14,
      fontFamily: 'Consolas',
      theme: 'dark',
      keepAlive: true,
      keyStorePath: '', // empty = default ~/.ssh
      userName: 'QA',
      userAvatar: '',
    },
  },
});

// Auto-cleanup legacy mockups from disk
const savedProfiles = store.get('profiles') || [];
if (savedProfiles.some(p => p.id === '1' && p.name === 'Production Server' && p.host === 'prod.example.com')) {
  store.set('profiles', savedProfiles.filter(p => p.id !== '1' && p.id !== '2'));
}

module.exports = store;
