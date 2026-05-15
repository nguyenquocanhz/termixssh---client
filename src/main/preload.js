const { contextBridge, ipcRenderer } = require('electron');

// Expose API to renderer (React) via window.termix
contextBridge.exposeInMainWorld('termix', {
  // ─── Profiles ───────────────────────────────────────────────────────────
  profiles: {
    list: () => ipcRenderer.invoke('profiles:list'),
    save: (profile) => ipcRenderer.invoke('profiles:save', profile),
    delete: (id) => ipcRenderer.invoke('profiles:delete', id),
  },

  // ─── Settings ───────────────────────────────────────────────────────────
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (settings) => ipcRenderer.invoke('settings:set', settings),
    selectFolder: () => ipcRenderer.invoke('settings:selectFolder'),
    selectFile: () => ipcRenderer.invoke('settings:selectFile'),
    getStorePath: () => ipcRenderer.invoke('settings:getStorePath'),
  },

  // ─── SSH Keys ───────────────────────────────────────────────────────────
  sshKeys: {
    list: () => ipcRenderer.invoke('sshKeys:list'),
    save: (keyData) => ipcRenderer.invoke('sshKeys:save', keyData),
    delete: (id) => ipcRenderer.invoke('sshKeys:delete', id),
    checkKeygen: () => ipcRenderer.invoke('sshKeys:checkKeygen'),
    generate: (params) => ipcRenderer.invoke('sshKeys:generate', params),
  },

  // ─── SSH ────────────────────────────────────────────────────────────────
  ssh: {
    connect: (params) => ipcRenderer.invoke('ssh:connect', params),
    disconnect: (params) => ipcRenderer.invoke('ssh:disconnect', params),

    // Fire-and-forget writes (keyboard → PTY)
    write: (sessionId, data) => ipcRenderer.send('ssh:write', { sessionId, data }),
    resize: (sessionId, cols, rows) => ipcRenderer.send('ssh:resize', { sessionId, cols, rows }),

    // Subscribe to data from server
    onData: (cb) => {
      const handler = (_, payload) => cb(payload);
      ipcRenderer.on('ssh:data', handler);
      return () => ipcRenderer.removeListener('ssh:data', handler);
    },

    // Subscribe to disconnect events
    onClosed: (cb) => {
      const handler = (_, payload) => cb(payload);
      ipcRenderer.on('ssh:closed', handler);
      return () => ipcRenderer.removeListener('ssh:closed', handler);
    },
  },

  // ─── SFTP ───────────────────────────────────────────────────────────────
  sftp: {
    list: (sessionId, remotePath) => ipcRenderer.invoke('sftp:list', { sessionId, remotePath }),
    download: (sessionId, remotePath, localPath) =>
      ipcRenderer.invoke('sftp:download', { sessionId, remotePath, localPath }),
    upload: (sessionId, localPath, remotePath) =>
      ipcRenderer.invoke('sftp:upload', { sessionId, localPath, remotePath }),
    mkdir: (sessionId, remotePath) => ipcRenderer.invoke('sftp:mkdir', { sessionId, remotePath }),
    delete: (sessionId, remotePath) => ipcRenderer.invoke('sftp:delete', { sessionId, remotePath }),

    onProgress: (cb) => {
      const handler = (_, payload) => cb(payload);
      ipcRenderer.on('sftp:progress', handler);
      return () => ipcRenderer.removeListener('sftp:progress', handler);
    },
  },

  // ─── Tunnels ────────────────────────────────────────────────────────────
  tunnel: {
    connect: (params) => ipcRenderer.invoke('tunnel:connect', params),
    disconnect: (id) => ipcRenderer.invoke('tunnel:disconnect', id),
    list: (sessionId) => ipcRenderer.invoke('tunnel:list', sessionId),
    onTerminated: (cb) => {
      const handler = (_, id) => cb(id);
      ipcRenderer.on('tunnel:terminated', handler);
      return () => ipcRenderer.removeListener('tunnel:terminated', handler);
    },
  },

  // ─── Local FS ─────────────────────────────────────────────────────────────
  localFs: {
    list: (dirPath) => ipcRenderer.invoke('localFs:list', dirPath),
    home: () => ipcRenderer.invoke('localFs:home'),
  },

  // ─── Local Shell ──────────────────────────────────────────────────────
  shell: {
    spawn: (params) => ipcRenderer.invoke('shell:spawn', params),
    write: (sessionId, data) => ipcRenderer.send('shell:write', { sessionId, data }),
    resize: (sessionId, cols, rows) => ipcRenderer.send('shell:resize', { sessionId, cols, rows }),
    kill: (sessionId) => ipcRenderer.invoke('shell:kill', { sessionId }),
  },
});
