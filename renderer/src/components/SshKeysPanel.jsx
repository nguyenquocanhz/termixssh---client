import { useState, useEffect } from 'react';

export default function SshKeysPanel() {
  const [keys, setKeys] = useState([]);
  const [form, setForm] = useState({ name: '', keyPath: '' });
  const [showForm, setShowForm] = useState(false);
  const [showGen, setShowGen] = useState(false);
  const [genForm, setGenForm] = useState({ name: '', type: 'ed25519', passphrase: '' });
  const [genStatus, setGenStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [genError, setGenError] = useState('');
  const [keygenAvailable, setKeygenAvailable] = useState(null);
  const [storePath, setStorePath] = useState('');

  const load = async () => {
    if (window.termix && window.termix.sshKeys) {
      const list = await window.termix.sshKeys.list();
      setKeys(list);
    }
  };

  useEffect(() => {
    load();
    // Check ssh-keygen & storePath
    if (window.termix) {
      if (window.termix.sshKeys && window.termix.sshKeys.checkKeygen) {
        window.termix.sshKeys.checkKeygen().then(r => setKeygenAvailable(r.available));
      }
      if (window.termix.settings && window.termix.settings.getStorePath) {
        window.termix.settings.getStorePath().then(p => setStorePath(p));
      }
    }
  }, []);

  const save = async () => {
    if (!form.name || !form.keyPath) return;
    if (window.termix && window.termix.sshKeys) {
      await window.termix.sshKeys.save(form);
      setForm({ name: '', keyPath: '' });
      setShowForm(false);
      load();
    }
  };

  const remove = async (id) => {
    if (window.termix && window.termix.sshKeys) {
      await window.termix.sshKeys.delete(id);
      load();
    }
  };

  const handleSelectFile = async () => {
    if (window.termix && window.termix.settings) {
      const result = await window.termix.settings.selectFile();
      if (!result.canceled) {
        setForm({ ...form, keyPath: result.path });
      }
    }
  };

  const generateKey = async () => {
    if (!genForm.name.trim()) return;
    setGenStatus('loading');
    setGenError('');
    try {
      const result = await window.termix.sshKeys.generate(genForm);
      if (result.ok) {
        setGenStatus('success');
        setKeys(result.keys);
        setTimeout(() => {
          setShowGen(false);
          setGenStatus(null);
          setGenForm({ name: '', type: 'ed25519', passphrase: '' });
        }, 1500);
      } else {
        setGenStatus('error');
        setGenError(result.error);
      }
    } catch (e) {
      setGenStatus('error');
      setGenError(e.message);
    }
  };

  return (
    <div className="flex-1 bg-termix-bg text-termix-text overflow-y-auto p-8 font-sans animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-slate-200 tracking-wide">SSH Keys</h1>
          <p className="text-xs text-slate-500 mt-1">Quản lý Private Keys cho xác thực SSH</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`px-4 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200 ${
            showForm 
              ? 'bg-slate-700/50 border border-slate-600 text-slate-400 hover:bg-slate-700' 
              : 'bg-blue-500/10 border border-blue-500/25 text-blue-400 hover:bg-blue-500/20'
          }`}
        >
          {showForm ? '✕ Đóng' : '+ Thêm Key'}
        </button>
        {keygenAvailable && (
          <button
            onClick={() => { setShowGen(!showGen); setShowForm(false); }}
            className={`px-4 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200 ${
              showGen
                ? 'bg-slate-700/50 border border-slate-600 text-slate-400 hover:bg-slate-700'
                : 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20'
            }`}
          >
            {showGen ? '✕ Đóng' : '🔐 Tạo Key'}
          </button>
        )}
      </div>

      {/* Add Form — Collapsible */}
      <div className={`overflow-hidden transition-all duration-300 ${showForm ? 'max-h-[400px] opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
        <div className="bg-[#111827] border border-[#1e2d3d] rounded-xl p-5 animate-scaleIn">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-4">Thêm Key Đã Có Sẵn</div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[11px] text-slate-500 mb-1.5 block font-medium">Tên hiển thị</label>
              <input
                className="w-full bg-[#1a2332] border border-[#1e2d3d] rounded-lg py-2 px-3 text-slate-200 text-[13px] outline-none font-sans focus:border-blue-500/50 transition-colors"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="AWS Production Key"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 mb-1.5 block font-medium">Đường dẫn tệp Private Key</label>
              <div className="flex gap-2 items-center">
                <input
                  className="flex-1 bg-[#1a2332] border border-[#1e2d3d] rounded-lg py-2 px-3 text-slate-200 text-[13px] outline-none font-mono focus:border-blue-500/50 transition-colors"
                  value={form.keyPath}
                  onChange={e => setForm({ ...form, keyPath: e.target.value })}
                  placeholder={storePath ? `${storePath}\\id_rsa` : "C:\\Users\\Name\\.ssh\\id_rsa"}
                />
                <button
                  onClick={handleSelectFile}
                  className="bg-blue-500/10 border border-blue-500/25 text-blue-400 rounded-lg px-3 py-2 text-[13px] cursor-pointer hover:bg-blue-500/20 transition-colors shrink-0"
                >
                  📂
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={save}
            className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-lg px-5 py-2 text-xs font-medium cursor-pointer hover:opacity-90 transition-opacity border-none"
          >
            Lưu Key
          </button>
        </div>
      </div>

      {/* Generate Key Form */}
      <div className={`overflow-hidden transition-all duration-300 ${showGen ? 'max-h-[500px] opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
        <div className="bg-[#111827] border border-emerald-500/20 rounded-xl p-5 animate-scaleIn relative">
          <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-widest mb-4">🔐 Tạo SSH Key Mới (ssh-keygen)</div>
          <div className="text-xs text-slate-500 mb-4 bg-black/20 p-2.5 rounded-lg border border-white/5 font-mono">
            Vị trí lưu: <span className="text-emerald-300">{storePath}</span>
            <div className="text-[10px] text-slate-600 mt-1 italic">(Có thể đổi trong icon Settings)</div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-[11px] text-slate-500 mb-1.5 block font-medium">Tên Key</label>
              <input
                className="w-full bg-[#1a2332] border border-[#1e2d3d] rounded-lg py-2 px-3 text-slate-200 text-[13px] outline-none font-sans focus:border-emerald-500/50 transition-colors"
                value={genForm.name}
                onChange={e => setGenForm({ ...genForm, name: e.target.value })}
                placeholder="my_server_key"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 mb-1.5 block font-medium">Loại Key</label>
              <select
                className="w-full bg-[#1a2332] border border-[#1e2d3d] rounded-lg py-2 px-3 text-slate-200 text-[13px] outline-none cursor-pointer"
                value={genForm.type}
                onChange={e => setGenForm({ ...genForm, type: e.target.value })}
              >
                <option value="ed25519">Ed25519 (khuyên dùng)</option>
                <option value="rsa">RSA 4096-bit</option>
                <option value="ecdsa">ECDSA</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-500 mb-1.5 block font-medium">Passphrase (tuỳ chọn)</label>
              <input
                type="password"
                className="w-full bg-[#1a2332] border border-[#1e2d3d] rounded-lg py-2 px-3 text-slate-200 text-[13px] outline-none font-mono focus:border-emerald-500/50 transition-colors"
                value={genForm.passphrase}
                onChange={e => setGenForm({ ...genForm, passphrase: e.target.value })}
                placeholder="Để trống nếu không cần"
              />
            </div>
          </div>
          {genStatus === 'error' && (
            <div className="text-xs text-red-400 mb-3 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{genError}</div>
          )}
          {genStatus === 'success' && (
            <div className="text-xs text-emerald-400 mb-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">✓ Key đã tạo thành công và lưu vào ~/.ssh/</div>
          )}
          <button
            onClick={generateKey}
            disabled={genStatus === 'loading'}
            className="bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-lg px-5 py-2 text-xs font-medium cursor-pointer hover:opacity-90 transition-opacity border-none disabled:opacity-50"
          >
            {genStatus === 'loading' ? 'Đang tạo...' : 'Tạo Key'}
          </button>
          <span className="text-[10px] text-slate-600 ml-3">Key sẽ được lưu tại: ~/.ssh/{genForm.name || 'key_name'}</span>
        </div>
      </div>

      {/* Key List */}
      <div className="flex flex-col gap-2.5">
        {keys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#111827] border border-[#1e2d3d] flex items-center justify-center text-2xl mb-4">
              🔑
            </div>
            <div className="text-sm text-slate-500 mb-1">Chưa có SSH Key nào</div>
            <div className="text-xs text-slate-600">Bấm "Thêm Key" để bắt đầu quản lý Private Key.</div>
          </div>
        ) : keys.map(k => (
          <div
            key={k.id}
            className="group bg-[#111827] border border-[#1e2d3d] rounded-xl p-4 flex items-center gap-4 hover:border-slate-600 transition-colors"
          >
            {/* Icon */}
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6M15.5 7.5l3 3L21 8l-3-3"/>
              </svg>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-200 truncate">{k.name}</div>
              <div className="text-[11px] text-slate-500 font-mono truncate mt-0.5">{k.keyPath}</div>
            </div>

            {/* Delete */}
            <button
              onClick={() => remove(k.id)}
              className="opacity-0 group-hover:opacity-100 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-2 cursor-pointer hover:bg-red-500/20 transition-all duration-200 shrink-0"
              title="Xóa Key"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

