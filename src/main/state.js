/**
 * Global state for the main process
 */

// Active SSH sessions
// Map<string, { conn: Client, stream: any, tunnels: any[] }>
const sessions = new Map();

// Main window reference
const state = {
  mainWindow: null,
};

module.exports = {
  sessions,
  state,
};
