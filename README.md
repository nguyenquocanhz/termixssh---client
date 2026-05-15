# Termix 🚀

SSH Terminal Client — Electron + React + xterm.js + ssh2  
Inspired by Termius

## Stack

| Layer | Tech |
|-------|------|
| Shell | Electron 28 |
| UI | React 18 + Vite |
| Terminal | @xterm/xterm + FitAddon |
| SSH | ssh2 |
| Storage | electron-store (JSON) |

## Cấu trúc project

```
termix/
├── src/main/
│   ├── index.js        ← Electron main process (SSH2, IPC handlers)
│   └── preload.js      ← Context bridge (main ↔ renderer)
├── renderer/
│   ├── src/
│   │   ├── App.jsx              ← Layout chính (sidebar, tabs, toolbar)
│   │   ├── useTerminal.js       ← xterm.js hook
│   │   └── components/
│   │       ├── ConnectModal.jsx  ← Nhập password khi connect
│   │       ├── ProfileModal.jsx  ← Tạo/sửa SSH profile
│   │       ├── TerminalTab.jsx   ← Tab terminal + embed xterm
│   │       ├── SftpPanel.jsx     ← SFTP file browser
│   │       └── TunnelPanel.jsx   ← Port forwarding UI
│   ├── index.html
│   └── package.json
└── package.json
```

## Setup

```bash
# 1. Cài deps gốc (Electron)
npm install

# 2. Cài deps renderer (React + xterm)
cd renderer && npm install && cd ..

# 3. Chạy dev
npm start
```

> `npm start` sẽ chạy song song:
> - Vite dev server tại `http://localhost:5173`  
> - Electron load từ `localhost:5173`

## Build

```bash
npm run build
# Output: dist/
```

## Tính năng

- ✅ Lưu SSH profiles (JSON local, không cloud)
- ✅ Multi-tab (mở nhiều server cùng lúc)
- ✅ Password auth + Private key auth
- ✅ Real PTY shell với xterm.js
- ✅ SFTP file browser (list, upload, download)
- ✅ Port forwarding / SSH Tunnel
- ✅ Keep-alive connection
- ✅ Right-click → Sửa profile
- ✅ Cross-platform (Windows / macOS / Linux)

## Thêm tính năng (sau)

- [ ] Split view (2 terminal song song)
- [ ] Search trong terminal (SearchAddon)
- [ ] Snippet / command palette
- [ ] SSH key generator
- [ ] Session recording
- [ ] Theme switching
