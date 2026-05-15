const { ipcMain } = require('electron');
const { sessions } = require('../state');

module.exports = function registerTunnelIPC() {
  ipcMain.handle('tunnel:connect', (_, { sessionId, localPort, remoteHost, remotePort }) => {
    return new Promise((resolve, reject) => {
      const session = sessions.get(sessionId);
      if (!session) return reject({ message: 'Session not found' });

      const net = require('net');
      const server = net.createServer((sock) => {
        session.conn.forwardOut(
          sock.remoteAddress, sock.remotePort,
          remoteHost, remotePort,
          (err, stream) => {
            if (err) { sock.destroy(); return; }
            sock.pipe(stream).pipe(sock);
          }
        );
      });

      server.listen(localPort, '127.0.0.1', () => {
        const tunnel = {
          id: Date.now().toString(),
          server,
          localPort,
          remoteHost,
          remotePort,
          close: () => server.close(),
        };
        session.tunnels.push(tunnel);
        resolve({ success: true, tunnelId: tunnel.id, localPort });
      });

      server.on('error', (err) => reject({ message: err.message }));
    });
  });

  ipcMain.handle('tunnel:list', (_, sessionId) => {
    const session = sessions.get(sessionId);
    if (!session) return [];
    return session.tunnels.map(t => ({
      id: t.id,
      localPort: t.localPort,
      remoteHost: t.remoteHost,
      remotePort: t.remotePort,
    }));
  });

  ipcMain.handle('tunnel:disconnect', (_, tunnelId) => {
    // Search across all sessions for the tunnel
    for (const [, session] of sessions) {
      const idx = session.tunnels.findIndex(t => t.id === tunnelId);
      if (idx >= 0) {
        session.tunnels[idx].close();
        session.tunnels.splice(idx, 1);
        return true;
      }
    }
    return false;
  });
};
