import { useState, useEffect } from 'react';

export default function TunnelPanel({ sessionId, onClose }) {
  const [tunnels, setTunnels] = useState([]);
  const [form, setForm] = useState({ localPort: '', remoteHost: 'localhost', remotePort: '' });
  const [error, setError] = useState('');

  const load = async () => {
    if (!window.termix || !sessionId) return;
    const list = await window.termix.tunnel.list(sessionId);
    setTunnels(list);
  };

  useEffect(() => { load(); }, [sessionId]);

  const create = async () => {
    if (!form.localPort || !form.remotePort) { setError('Điền đủ port'); return; }
    setError('');
    try {
      await window.termix.tunnel.create({
        sessionId,
        localPort: +form.localPort,
        remoteHost: form.remoteHost,
        remotePort: +form.remotePort,
      });
      setForm({ localPort: '', remoteHost: 'localhost', remotePort: '' });
      load();
    } catch (e) {
      setError(e.message || 'Lỗi tạo tunnel');
    }
  };

  const remove = async (tunnelId) => {
    await window.termix.tunnel.close(sessionId, tunnelId);
    load();
  };

  const inputClass = "bg-[#1a2332] border border-[#1e2d3d] rounded-md py-1.5 px-2.5 text-slate-200 text-xs outline-none font-sans w-full focus:border-blue-500/50 transition-colors";

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#141c27] border border-[#1e2d3d] rounded-xl p-6 w-[460px] shadow-[0_25px_60px_rgba(0,0,0,0.5)]">
        <div className="flex justify-between items-center mb-5">
          <span className="text-[15px] font-semibold text-slate-200">Port Forwarding</span>
          <button onClick={onClose} className="bg-transparent border-none text-slate-500 cursor-pointer text-[1.2rem] hover:text-slate-300 transition-colors">×</button>
        </div>

        {/* Add tunnel */}
        <div className="mb-5 p-4 bg-[#111827] rounded-lg">
          <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-[0.08em] mb-3">
            Tunnel mới
          </div>
          <div className="grid grid-cols-3 gap-2 mb-2.5">
            <div>
              <div className="text-[11px] text-slate-500 mb-1">Local Port</div>
              <input className={inputClass} type="number" placeholder="8080" value={form.localPort}
                onChange={e => setForm(f => ({ ...f, localPort: e.target.value }))} />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 mb-1">Remote Host</div>
              <input className={inputClass} placeholder="localhost" value={form.remoteHost}
                onChange={e => setForm(f => ({ ...f, remoteHost: e.target.value }))} />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 mb-1">Remote Port</div>
              <input className={inputClass} type="number" placeholder="3306" value={form.remotePort}
                onChange={e => setForm(f => ({ ...f, remotePort: e.target.value }))} />
            </div>
          </div>
          {error && <div className="text-red-400 text-xs mb-2">{error}</div>}
          <button 
            onClick={create} 
            className="w-full p-2 rounded-lg border-none bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-[13px] cursor-pointer font-medium hover:opacity-90 transition-opacity"
          >
            Tạo Tunnel
          </button>
        </div>

        {/* Active tunnels */}
        <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-[0.08em] mb-2.5">
          Đang hoạt động ({tunnels.length})
        </div>
        
        {tunnels.length === 0 ? (
          <div className="text-slate-600 text-[13px] text-center p-4">Chưa có tunnel nào</div>
        ) : tunnels.map(t => (
          <div key={t.id} className="flex items-center gap-3 py-2.5 px-3.5 bg-[#111827] rounded-lg mb-2">
            <div className="w-2 h-2 rounded-full bg-termix-success shrink-0" />
            <div className="flex-1 text-[13px] font-mono text-slate-400 truncate">
              localhost:{t.localPort}
              <span className="text-slate-600 mx-2">→</span>
              {t.remoteHost}:{t.remotePort}
            </div>
            <button 
              onClick={() => remove(t.id)} 
              className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-md py-[3px] px-2.5 text-xs cursor-pointer hover:bg-red-500/20 transition-colors"
            >
              Đóng
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
