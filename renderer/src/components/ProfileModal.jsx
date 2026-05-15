import { useState, useEffect } from 'react';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#ef4444', '#06b6d4', '#84cc16'];

const DEFAULT = {
  name: '', host: '', port: 22, username: 'root',
  authType: 'password', keyPath: '', passphrase: '',
  password: '', savePassword: false,
  color: '#3b82f6', group: 'Default',
};

export default function ProfileModal({ profile, onSave, onCancel }) {
  const [form, setForm] = useState(profile || DEFAULT);
  const [keys, setKeys] = useState([]);
  
  // States cho việc tạo key inline
  const [showGen, setShowGen] = useState(false);
  const [genForm, setGenForm] = useState({ name: '', type: 'ed25519', passphrase: '', passphraseConfirm: '' });
  const [genStatus, setGenStatus] = useState(null);
  const [genError, setGenError] = useState('');
  const [keygenAvailable, setKeygenAvailable] = useState(false);

  useEffect(() => {
    if (window.termix && window.termix.sshKeys) {
      window.termix.sshKeys.list().then(setKeys);
      window.termix.sshKeys.checkKeygen().then(r => setKeygenAvailable(r.available));
    }
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.host || !form.username) return;
    if (form.authType === 'key' && !form.keyPath) return;
    await onSave(form);
  };

  const handleGenerateKey = async () => {
    if (!genForm.name.trim()) { setGenError('Tên key không được để trống'); return; }
    if (genForm.passphrase !== genForm.passphraseConfirm) {
      setGenError('Mật khẩu xác nhận không khớp'); return;
    }

    setGenStatus('loading');
    setGenError('');
    try {
      const result = await window.termix.sshKeys.generate({
        name: genForm.name.trim(),
        type: genForm.type,
        passphrase: genForm.passphrase
      });
      if (result.ok) {
        setGenStatus('success');
        setKeys(result.keys);
        set('keyPath', result.keyPath); // auto-select the new key
        setTimeout(() => {
          setShowGen(false);
          setGenStatus(null);
          setGenForm({ name: '', type: 'ed25519', passphrase: '', passphraseConfirm: '' });
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
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm animate-fadeIn"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-[#141c27] border border-[#1e2d3d] rounded-xl p-7 w-[480px] shadow-[0_25px_60px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto scrollbar-custom animate-scaleIn">
        <div className="text-base font-semibold text-slate-200 mb-5">
          {profile?.id ? 'Sửa Host' : 'Thêm Host Mới'}
        </div>

        <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-[0.08em] mb-3 mt-1">Thông tin cơ bản</div>

        <div className="grid grid-cols-2 gap-3">
          <div className="mb-3.5">
            <label className="text-xs text-slate-500 mb-[5px] block font-medium">Tên hiển thị *</label>
            <input 
              className="w-full bg-[#1a2332] border border-[#1e2d3d] rounded-lg py-2 px-3 text-slate-200 text-[13px] outline-none font-sans focus:border-blue-500/50 transition-colors"
              value={form.name} 
              onChange={e => set('name', e.target.value)} 
              placeholder="Production Server" 
            />
          </div>
          <div className="mb-3.5">
            <label className="text-xs text-slate-500 mb-[5px] block font-medium">Group</label>
            <input 
              className="w-full bg-[#1a2332] border border-[#1e2d3d] rounded-lg py-2 px-3 text-slate-200 text-[13px] outline-none font-sans focus:border-blue-500/50 transition-colors"
              value={form.group} 
              onChange={e => set('group', e.target.value)} 
              placeholder="Work" 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="mb-3.5">
            <label className="text-xs text-slate-500 mb-[5px] block font-medium">Host / IP *</label>
            <input 
              className="w-full bg-[#1a2332] border border-[#1e2d3d] rounded-lg py-2 px-3 text-slate-200 text-[13px] outline-none font-sans focus:border-blue-500/50 transition-colors"
              value={form.host} 
              onChange={e => set('host', e.target.value)} 
              placeholder="192.168.1.10" 
            />
          </div>
          <div className="mb-3.5">
            <label className="text-xs text-slate-500 mb-[5px] block font-medium">Port</label>
            <input 
              className="w-full bg-[#1a2332] border border-[#1e2d3d] rounded-lg py-2 px-3 text-slate-200 text-[13px] outline-none font-sans focus:border-blue-500/50 transition-colors"
              type="number" 
              value={form.port} 
              onChange={e => set('port', +e.target.value)} 
            />
          </div>
        </div>

        <div className="mb-3.5">
          <label className="text-xs text-slate-500 mb-[5px] block font-medium">Username *</label>
          <input 
            className="w-full bg-[#1a2332] border border-[#1e2d3d] rounded-lg py-2 px-3 text-slate-200 text-[13px] outline-none font-sans focus:border-blue-500/50 transition-colors"
            value={form.username} 
            onChange={e => set('username', e.target.value)} 
            placeholder="root" 
          />
        </div>

        <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-[0.08em] mb-3 mt-1">Xác thực</div>

        <div className="flex gap-2 mb-3.5">
          {['password', 'key'].map(type => (
            <button 
              key={type} 
              onClick={() => set('authType', type)} 
              className={`flex-1 p-2 rounded-lg text-[13px] cursor-pointer border transition-colors ${
                form.authType === type 
                  ? 'border-blue-500 bg-blue-500/10 text-blue-400' 
                  : 'border-[#1e2d3d] bg-transparent text-slate-500 hover:bg-white/5'
              }`}
            >
              {type === 'password' ? '🔒 Password' : '🔑 Private Key'}
            </button>
          ))}
        </div>

        {form.authType === 'password' && (
          <div className="mb-3.5 bg-[#111827] border border-[#1e2d3d] rounded-lg p-4 mt-2">
            <div className="flex items-center gap-2 mb-3">
              <input 
                type="checkbox" 
                className="accent-blue-500 w-3.5 h-3.5 cursor-pointer"
                checked={form.savePassword || false}
                onChange={e => {
                  set('savePassword', e.target.checked);
                  if (!e.target.checked) set('password', '');
                }}
              />
              <span className="text-xs text-slate-400">Lưu mật khẩu (tự động kết nối)</span>
            </div>
            {form.savePassword && (
              <div>
                <input
                  type="password"
                  className="w-full bg-[#1a2332] border border-[#1e2d3d] rounded py-1.5 px-2 text-slate-200 text-xs outline-none focus:border-blue-500/50"
                  value={form.password || ''}
                  onChange={e => set('password', e.target.value)}
                  placeholder="Nhập mật khẩu SSH..."
                />
              </div>
            )}
          </div>
        )}

        {form.authType === 'key' && (
          <div className="mb-3.5 relative">
            <div className="flex justify-between items-end mb-[5px]">
              <label className="text-xs text-slate-500 font-medium">Chọn SSH Key</label>
              {keygenAvailable && (
                <button 
                  onClick={() => setShowGen(!showGen)}
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-medium transition-colors bg-transparent border-none cursor-pointer"
                >
                  {showGen ? 'Hủy tạo key' : '+ Tạo Key mới'}
                </button>
              )}
            </div>
            
            {!showGen ? (
              <div className="relative">
                <select 
                  className="w-full bg-[#1a2332] border border-[#1e2d3d] rounded-lg py-2 px-3 text-slate-200 text-[13px] outline-none font-sans focus:border-blue-500/50 transition-colors appearance-none cursor-pointer"
                  value={form.keyPath} 
                  onChange={e => set('keyPath', e.target.value)} 
                >
                  <option value="" disabled>-- Chọn một SSH Key đã lưu --</option>
                  {keys.length === 0 && <option value="" disabled>(Chưa có key nào. Hãy thêm ở mục Keys)</option>}
                  {keys.map(k => (
                    <option key={k.id} value={k.keyPath}>{k.name} - {k.keyPath}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-[11px] pointer-events-none text-slate-500 text-[10px]">▼</div>
              </div>
            ) : (
              <div className="bg-[#111827] border border-blue-500/30 rounded-lg p-4 mt-2 mb-2">
                <div className="text-[11px] text-blue-400 font-medium mb-3">Tạo Private Key mới (Ed25519)</div>
                <div className="mb-3">
                  <label className="text-[10px] text-slate-500 mb-1 block">Tên Key</label>
                  <input
                    className="w-full bg-[#1a2332] border border-[#1e2d3d] rounded py-1.5 px-2 text-slate-200 text-xs outline-none focus:border-blue-500/50"
                    value={genForm.name}
                    onChange={e => setGenForm({ ...genForm, name: e.target.value })}
                    placeholder="my_vps_key"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">Passphrase</label>
                    <input
                      type="password"
                      className="w-full bg-[#1a2332] border border-[#1e2d3d] rounded py-1.5 px-2 text-slate-200 text-xs outline-none focus:border-blue-500/50"
                      value={genForm.passphrase}
                      onChange={e => setGenForm({ ...genForm, passphrase: e.target.value })}
                      placeholder="Mật khẩu bảo vệ key"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">Nhập lại Passphrase</label>
                    <input
                      type="password"
                      className="w-full bg-[#1a2332] border border-[#1e2d3d] rounded py-1.5 px-2 text-slate-200 text-xs outline-none focus:border-blue-500/50"
                      value={genForm.passphraseConfirm}
                      onChange={e => setGenForm({ ...genForm, passphraseConfirm: e.target.value })}
                      placeholder="Nhập lại để xác nhận"
                    />
                  </div>
                </div>
                
                {genStatus === 'error' && <div className="text-[10px] text-red-400 mb-2">{genError}</div>}
                {genStatus === 'success' && <div className="text-[10px] text-emerald-400 mb-2">✓ Key đã tạo và tự động chọn</div>}
                
                <div className="mt-1">
                  <button
                    onClick={handleGenerateKey}
                    disabled={genStatus === 'loading'}
                    className="w-full bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded py-1.5 text-xs hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                  >
                    {genStatus === 'loading' ? 'Đang tạo...' : 'Tạo Key & Chọn'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-[0.08em] mb-3 mt-1">Màu sắc</div>
        <div className="flex gap-2.5 mb-2">
          {COLORS.map(c => (
            <div 
              key={c} 
              onClick={() => set('color', c)} 
              className="w-7 h-7 rounded-full cursor-pointer"
              style={{
                background: c,
                border: form.color === c ? `3px solid #fff` : '3px solid transparent',
              }} 
            />
          ))}
        </div>

        <div className="flex gap-2.5 mt-5">
          <button 
            className="flex-1 p-2.5 rounded-lg text-sm font-medium cursor-pointer border border-[#1e2d3d] bg-transparent text-slate-500 hover:bg-white/5 transition-colors"
            onClick={onCancel}
          >
            Hủy
          </button>
          <button 
            className="flex-1 p-2.5 rounded-lg text-sm font-medium cursor-pointer border-none bg-gradient-to-br from-blue-500 to-indigo-500 text-white hover:opacity-90 transition-opacity"
            onClick={handleSave}
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
