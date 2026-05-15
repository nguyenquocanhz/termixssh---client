import { useState } from 'react';

export default function ConnectModal({ profile, onConnect, onCancel }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    if (!password && profile.authType !== 'key') {
      setError('Nhập password đi mày'); return;
    }
    setLoading(true);
    setError('');
    try {
      await onConnect({ password });
    } catch (err) {
      setError(err.message || 'Kết nối thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm animate-fadeIn"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-[#141c27] border border-[#1e2d3d] rounded-xl p-7 w-[420px] shadow-[0_25px_60px_rgba(0,0,0,0.5)] animate-scaleIn">
        <div className="text-base font-semibold text-slate-200 mb-1">Kết nối SSH</div>
        <div className="text-[13px] text-slate-600 mb-6">
          {profile.username}@{profile.host}:{profile.port}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg py-2 px-3 text-[13px] text-red-400 mb-4">
            {error}
          </div>
        )}

        {profile.authType !== 'key' ? (
          <div className="mb-4">
            <label className="text-xs text-slate-500 mb-1.5 block font-medium">Password</label>
            <input
              type="password"
              className="w-full bg-[#1a2332] border border-[#1e2d3d] rounded-lg py-[9px] px-3 text-slate-200 text-sm outline-none font-sans focus:border-blue-500/50 transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
              autoFocus
              placeholder="••••••••"
            />
          </div>
        ) : (
          <div className="mb-4">
            <div className="w-full bg-termix-input border border-[#1e2d3d] rounded-lg py-[9px] px-3 text-slate-600 text-sm outline-none font-sans">
              🔑 Dùng key: {profile.keyPath || '~/.ssh/id_rsa'}
            </div>
          </div>
        )}

        <div className="flex gap-2.5 mt-2">
          <button 
            className="flex-1 p-2.5 rounded-lg text-sm font-medium cursor-pointer border border-[#1e2d3d] bg-transparent text-slate-500 hover:bg-white/5 transition-colors"
            onClick={onCancel}
          >
            Hủy
          </button>
          <button 
            className="flex-1 p-2.5 rounded-lg text-sm font-medium cursor-pointer border-none bg-gradient-to-br from-blue-500 to-indigo-500 text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleConnect} 
            disabled={loading}
          >
            {loading ? 'Đang kết nối...' : 'Kết nối'}
          </button>
        </div>
      </div>
    </div>
  );
}
