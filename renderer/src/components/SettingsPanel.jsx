import { useState, useEffect } from 'react';

export default function SettingsPanel() {
  const [settings, setSettings] = useState(null);
  const [saved, setSaved] = useState(false);
  const [currentStorePath, setCurrentStorePath] = useState('');

  useEffect(() => {
    if (window.termix && window.termix.settings) {
      window.termix.settings.get().then(s => setSettings(s));
      window.termix.settings.getStorePath().then(p => setCurrentStorePath(p));
    }
  }, []);

  const update = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const save = async () => {
    if (window.termix && window.termix.settings) {
      await window.termix.settings.set(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      // Bắn event để App.jsx biết update
      window.dispatchEvent(new CustomEvent('termix:settings-updated'));
    }
  };

  const selectFolder = async () => {
    if (window.termix && window.termix.settings) {
      const result = await window.termix.settings.selectFolder();
      if (!result.canceled) {
        update('keyStorePath', result.path);
        setCurrentStorePath(result.path);
      }
    }
  };

  const resetPath = () => {
    update('keyStorePath', '');
    if (window.termix && window.termix.settings) {
      window.termix.settings.getStorePath().then(p => setCurrentStorePath(p));
    }
  };

  if (!settings) return <div className="flex-1 bg-termix-bg flex items-center justify-center text-slate-500 text-sm">Đang tải...</div>;

  return (
    <div className="flex-1 bg-termix-bg text-termix-text overflow-y-auto p-8 font-sans animate-fadeIn">
      <div className="max-w-[600px]">
        <h1 className="text-lg font-semibold text-slate-200 tracking-wide mb-1">Cài đặt</h1>
        <p className="text-xs text-slate-500 mb-8">Tuỳ chỉnh ứng dụng Termix</p>

        {/* Account Info */}
        <div className="mb-8">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-4">Tài khoản</div>
          <div className="bg-[#111827] border border-[#1e2d3d] rounded-xl p-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-slate-500 mb-1.5 block font-medium">Tên hiển thị</label>
                <input
                  className="w-full bg-[#1a2332] border border-[#1e2d3d] rounded-lg py-2 px-3 text-slate-200 text-[13px] outline-none font-sans focus:border-blue-500/50 transition-colors"
                  value={settings.userName || ''}
                  onChange={e => update('userName', e.target.value)}
                  placeholder="Ví dụ: Dev"
                  maxLength={10}
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 mb-1.5 block font-medium">URL Ảnh Đại diện (Avatar)</label>
                <input
                  className="w-full bg-[#1a2332] border border-[#1e2d3d] rounded-lg py-2 px-3 text-slate-200 text-[13px] outline-none font-sans focus:border-blue-500/50 transition-colors"
                  value={settings.userAvatar || ''}
                  onChange={e => update('userAvatar', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="text-[10px] text-slate-500 mt-2 italic">Hãy thử nhập một URL ảnh có sẵn hoặc để trống để hiển thị chữ cái đầu.</div>
          </div>
        </div>

        {/* SSH Key Store Path */}
        <div className="mb-8">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-4">Đường dẫn lưu SSH Key</div>
          <div className="bg-[#111827] border border-[#1e2d3d] rounded-xl p-5">
            <div className="text-xs text-slate-400 mb-3">
              Thư mục hiện tại: <span className="text-blue-300 font-mono">{currentStorePath}</span>
            </div>
            <div className="flex gap-2 items-center mb-3">
              <input
                className="flex-1 bg-[#1a2332] border border-[#1e2d3d] rounded-lg py-2 px-3 text-slate-200 text-[13px] outline-none font-mono focus:border-blue-500/50 transition-colors"
                value={settings.keyStorePath || ''}
                onChange={e => update('keyStorePath', e.target.value)}
                placeholder="Mặc định: ~/.ssh"
              />
              <button
                onClick={selectFolder}
                className="bg-blue-500/10 border border-blue-500/25 text-blue-400 rounded-lg px-3 py-2 text-xs cursor-pointer hover:bg-blue-500/20 transition-colors shrink-0"
              >
                📂 Chọn
              </button>
            </div>
            {settings.keyStorePath && (
              <button
                onClick={resetPath}
                className="text-[11px] text-slate-500 hover:text-slate-400 bg-transparent border-none cursor-pointer"
              >
                ↺ Đặt lại mặc định (~/.ssh)
              </button>
            )}
          </div>
        </div>

        {/* Terminal */}
        <div className="mb-8">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-4">Terminal</div>
          <div className="bg-[#111827] border border-[#1e2d3d] rounded-xl p-5">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-[11px] text-slate-500 mb-1.5 block font-medium">Font chữ</label>
                <select
                  className="w-full bg-[#1a2332] border border-[#1e2d3d] rounded-lg py-2 px-3 text-slate-200 text-[13px] outline-none cursor-pointer"
                  value={settings.fontFamily}
                  onChange={e => update('fontFamily', e.target.value)}
                >
                  <option value="Consolas">Consolas</option>
                  <option value="'Cascadia Code'">Cascadia Code</option>
                  <option value="'JetBrains Mono'">JetBrains Mono</option>
                  <option value="'Fira Code'">Fira Code</option>
                  <option value="'Courier New'">Courier New</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-500 mb-1.5 block font-medium">Cỡ chữ</label>
                <input
                  type="number"
                  className="w-full bg-[#1a2332] border border-[#1e2d3d] rounded-lg py-2 px-3 text-slate-200 text-[13px] outline-none focus:border-blue-500/50 transition-colors"
                  value={settings.fontSize}
                  onChange={e => update('fontSize', +e.target.value)}
                  min={10}
                  max={24}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.keepAlive}
                  onChange={e => update('keepAlive', e.target.checked)}
                  className="accent-blue-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs text-slate-400">Giữ kết nối (Keep Alive)</span>
              </label>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="mb-8">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-4">Thông tin</div>
          <div className="bg-[#111827] border border-[#1e2d3d] rounded-xl p-5 text-xs text-slate-500">
            <div className="mb-1"><span className="text-slate-400 font-medium">Termix</span> v1.0.0</div>
            <div className="mb-1">Electron SSH / SFTP Terminal Client</div>
            <div className="text-slate-600">© 2026 — Built with ❤️</div>
          </div>
        </div>

        {/* Save */}
        <div className="flex gap-3 items-center">
          <button
            onClick={save}
            className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-lg px-6 py-2.5 text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity border-none"
          >
            💾 Lưu cài đặt
          </button>
          {saved && <span className="text-emerald-400 text-xs animate-fadeIn">✓ Đã lưu!</span>}
        </div>
      </div>
    </div>
  );
}
