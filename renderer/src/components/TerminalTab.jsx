import { useRef, useEffect } from 'react';
import { useTerminal } from '../useTerminal.js';

export default function TerminalTab({ tab, active }) {
  const containerRef = useRef(null);
  const { fit } = useTerminal({
    containerRef,
    sessionId: tab.sessionId,
    connected: tab.connected,
    isLocal: tab.isLocal || false,
    fontSize: 14,
  });

  useEffect(() => {
    if (active) setTimeout(fit, 50);
  }, [active]);

  return (
    <div className={`${active ? 'flex' : 'hidden'} flex-1 min-h-0 min-w-0`}>
      {/* xterm container */}
      <div className="flex-1 p-2 min-w-0 bg-termix-bg">
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  );
}
