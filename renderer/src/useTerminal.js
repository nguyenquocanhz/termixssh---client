import { useEffect, useRef, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SearchAddon } from '@xterm/addon-search';
import { Unicode11Addon } from '@xterm/addon-unicode11';
import { WebglAddon } from '@xterm/addon-webgl';
import '@xterm/xterm/css/xterm.css';

const THEME = {
  background: '#0d1117',
  foreground: '#f0f4f8',
  cursor: '#60a5fa',
  cursorAccent: '#0d1117',
  selectionBackground: 'rgba(96, 165, 250, 0.3)',
  black: '#21262d',
  red: '#ff7b72',
  green: '#7ee787',
  yellow: '#ffa657',
  blue: '#79c0ff',
  magenta: '#d2a8ff',
  cyan: '#56d4dd',
  white: '#f0f4f8',
  brightBlack: '#484f58',
  brightRed: '#ffa198',
  brightGreen: '#a5f3b5',
  brightYellow: '#ffcb6b',
  brightBlue: '#a5d6ff',
  brightMagenta: '#e2c5ff',
  brightCyan: '#76e4f7',
  brightWhite: '#ffffff',
};

export function useTerminal({ containerRef, sessionId, connected, isLocal = false, fontSize = 14 }) {
  const termRef = useRef(null);
  const fitAddonRef = useRef(null);
  const searchAddonRef = useRef(null);
  const unsubDataRef = useRef(null);
  const isLocalRef = useRef(isLocal);

  // Keep isLocal ref in sync
  isLocalRef.current = isLocal;

  // Helper: write to correct backend
  const writeToBackend = useCallback((sid, b64) => {
    if (!window.termix || !sid) return;
    if (isLocalRef.current && window.termix.shell) {
      window.termix.shell.write(sid, b64);
    } else {
      window.termix.ssh.write(sid, b64);
    }
  }, []);

  // Helper: resize correct backend
  const resizeBackend = useCallback((sid, cols, rows) => {
    if (!window.termix || !sid) return;
    if (isLocalRef.current && window.termix.shell) {
      window.termix.shell.resize(sid, cols, rows);
    } else {
      window.termix.ssh.resize(sid, cols, rows);
    }
  }, []);

  // Init xterm
  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      theme: THEME,
      fontFamily: "Consolas, 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
      fontSize: 14,
      lineHeight: 1.35,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 10000,
    });

    const fitAddon = new FitAddon();
    const linksAddon = new WebLinksAddon();
    const searchAddon = new SearchAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(linksAddon);
    term.loadAddon(searchAddon);
    term.open(containerRef.current);

    // GPU-accelerated rendering (with canvas fallback)
    try {
      const webgl = new WebglAddon();
      webgl.onContextLoss(() => { webgl.dispose(); });
      term.loadAddon(webgl);
    } catch (e) {
      console.warn('WebGL addon failed, using canvas renderer:', e);
    }

    // Unicode11
    try {
      const unicode11 = new Unicode11Addon();
      term.loadAddon(unicode11);
      term.unicode.activeVersion = '11';
    } catch (e) { /* ignore */ }

    fitAddon.fit();

    termRef.current = term;
    fitAddonRef.current = fitAddon;
    searchAddonRef.current = searchAddon;

    // Copy / Paste
    term.attachCustomKeyEventHandler((event) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'C') {
        const selection = term.getSelection();
        if (selection) navigator.clipboard.writeText(selection);
        return false;
      }
      if (event.ctrlKey && event.shiftKey && event.key === 'V') {
        navigator.clipboard.readText().then(text => {
          if (text && sessionId) {
            const b64 = btoa(unescape(encodeURIComponent(text)));
            writeToBackend(sessionId, b64);
          }
        });
        return false;
      }
      return true;
    });

    // Keyboard → backend
    term.onData((data) => {
      if (sessionId) {
        const b64 = btoa(unescape(encodeURIComponent(data)));
        writeToBackend(sessionId, b64);
      }
    });

    // Receive data from backend → terminal (both SSH and local shell use 'ssh:data' channel)
    if (window.termix) {
      unsubDataRef.current = window.termix.ssh.onData(({ sessionId: sid, data }) => {
        if (sid === sessionId && termRef.current) {
          try {
            const text = decodeURIComponent(escape(atob(data)));
            termRef.current.write(text);
          } catch {
            // Fallback: write raw
            termRef.current.write(atob(data));
          }
        }
      });
    }

    // Resize observer
    const ro = new ResizeObserver(() => {
      try {
        fitAddon.fit();
        resizeBackend(sessionId, term.cols, term.rows);
      } catch {}
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      unsubDataRef.current?.();
      term.dispose();
      termRef.current = null;
    };
  }, [sessionId]);

  // Write welcome message when not connected (SSH only)
  useEffect(() => {
    if (!termRef.current) return;
    if (!connected && !isLocal) {
      termRef.current.clear();
      termRef.current.writeln('\r\n\x1b[38;5;244m  Connecting...\x1b[0m');
    }
  }, [connected, isLocal]);

  const fit = useCallback(() => {
    try { fitAddonRef.current?.fit(); } catch {}
  }, []);

  const clear = useCallback(() => {
    termRef.current?.clear();
  }, []);

  const search = useCallback((query) => {
    searchAddonRef.current?.findNext(query);
  }, []);

  return { term: termRef.current, fit, clear };
}

