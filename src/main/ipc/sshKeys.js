const { ipcMain } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { execFile, exec } = require('child_process');
const store = require('../store');

module.exports = function registerSshKeysIPC() {
  ipcMain.handle('sshKeys:list', () => store.get('sshKeys') || []);

  ipcMain.handle('sshKeys:save', (_, keyData) => {
    const keys = store.get('sshKeys') || [];
    const idx = keys.findIndex(k => k.id === keyData.id);
    if (idx >= 0) {
      keys[idx] = keyData;
    } else {
      keys.push({ ...keyData, id: Date.now().toString() });
    }
    store.set('sshKeys', keys);
    return keys;
  });

  ipcMain.handle('sshKeys:delete', (_, id) => {
    const keys = (store.get('sshKeys') || []).filter(k => k.id !== id);
    store.set('sshKeys', keys);
    return keys;
  });

  // Kiểm tra ssh-keygen có sẵn không
  ipcMain.handle('sshKeys:checkKeygen', async () => {
    return new Promise((resolve) => {
      exec('ssh-keygen -h', (err) => {
        resolve({ available: !err });
      });
    });
  });

  // Generate SSH key pair
  ipcMain.handle('sshKeys:generate', async (_, { name, type, bits, passphrase }) => {
    const customPath = store.get('settings.keyStorePath');
    const sshDir = customPath || path.join(os.homedir(), '.ssh');

    // Tạo thư mục .ssh nếu chưa có
    if (!fs.existsSync(sshDir)) {
      fs.mkdirSync(sshDir, { recursive: true, mode: 0o700 });
    }

    const keyName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const keyPath = path.join(sshDir, keyName);

    // Kiểm tra file đã tồn tại
    if (fs.existsSync(keyPath)) {
      return { ok: false, error: `File ${keyPath} đã tồn tại` };
    }

    const keyType = type || 'ed25519';
    const args = ['-t', keyType, '-f', keyPath, '-N', passphrase || '', '-C', name];
    if (keyType === 'rsa') {
      args.push('-b', String(bits || 4096));
    }

    return new Promise((resolve) => {
      execFile('ssh-keygen', args, (err, stdout, stderr) => {
        if (err) {
          resolve({ ok: false, error: stderr || err.message });
        } else {
          // Tự động lưu vào danh sách keys
          const keys = store.get('sshKeys') || [];
          keys.push({ id: Date.now().toString(), name, keyPath });
          store.set('sshKeys', keys);
          resolve({ ok: true, keyPath, keys });
        }
      });
    });
  });
};
