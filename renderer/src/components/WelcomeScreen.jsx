import { useState } from 'react';

export default function WelcomeScreen({ openConnect }) {
  const [quickInput, setQuickInput] = useState('');

  const handleQuickConnect = () => {
    if (!quickInput.trim()) return;

    // Parse format: user@host:port hoặc host hoặc user@host
    let username = 'root', host = '', port = 22;

    const input = quickInput.trim();
    if (input.includes('@')) {
      const [u, rest] = input.split('@');
      username = u;
      if (rest.includes(':')) {
        const [h, p] = rest.split(':');
        host = h;
        port = parseInt(p) || 22;
      } else {
        host = rest;
      }
    } else if (input.includes(':')) {
      const [h, p] = input.split(':');
      host = h;
      port = parseInt(p) || 22;
    } else {
      host = input;
    }

    if (!host) return;

    // Tạo profile tạm và mở ConnectModal
    const tempProfile = {
      id: `quick_${Date.now()}`,
      name: `${username}@${host}`,
      host,
      port,
      username,
      authType: 'password',
      color: '#3b82f6',
      group: 'Quick Connect',
    };

    openConnect(tempProfile);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-[#1e2d3d] gap-6 animate-fadeIn">
      {/* Logo */}
      <div className="w-[80px] h-[80px] rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center text-5xl shadow-[0_0_40px_rgba(99,102,241,0.1)] border border-blue-500/20 animate-scaleIn">
        ⚡
      </div>

      <div className="text-center">
        <h1 className="text-xl font-semibold text-slate-200 mb-2 tracking-wide">Termix SSH</h1>
        <p className="text-[13px] text-slate-500">Chọn host ở sidebar hoặc kết nối nhanh bên dưới.</p>
      </div>

      {/* Quick Connect */}
      <div className="w-[420px] bg-[#0f151e] border border-[#1e2d3d] rounded-xl p-5 transition-colors hover:border-slate-700">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Quick Connect</div>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-[#1a2332] border border-[#1e2d3d] rounded-lg py-2.5 px-3 text-slate-200 text-[13px] outline-none font-mono focus:border-blue-500/50 transition-colors"
            value={quickInput}
            onChange={e => setQuickInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleQuickConnect()}
            placeholder="root@192.168.1.100:22"
            autoFocus
          />
          <button
            onClick={handleQuickConnect}
            className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-lg px-5 py-2.5 text-xs font-medium cursor-pointer hover:opacity-90 transition-opacity border-none whitespace-nowrap"
          >
            Kết nối ➔
          </button>
        </div>
        <div className="text-[10px] text-slate-600 mt-2">Nhập: user@host:port — ví dụ: root@10.0.0.1:22</div>
      </div>

      {/* Shortcuts */}
      <div className="bg-[#0f151e] border border-[#1e2d3d] rounded-xl p-5 w-[420px] transition-colors hover:border-slate-700">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Phím Tắt</div>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-400">Copy</span>
            <kbd className="bg-[#1a2332] border border-[#2d3a4f] rounded px-1.5 py-0.5 text-slate-300">Ctrl+Shift+C</kbd>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-400">Paste</span>
            <kbd className="bg-[#1a2332] border border-[#2d3a4f] rounded px-1.5 py-0.5 text-slate-300">Ctrl+Shift+V</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
