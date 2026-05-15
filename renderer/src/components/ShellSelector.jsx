export default function ShellSelector({ onSelect, onCancel }) {
  const shells = [
    { id: 'powershell', name: 'PowerShell', icon: '⚡', desc: 'Windows PowerShell', color: '#2563eb' },
    { id: 'cmd', name: 'CMD', icon: '▸', desc: 'Command Prompt', color: '#64748b' },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm animate-fadeIn"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-[#141c27] border border-[#1e2d3d] rounded-xl p-6 w-[360px] shadow-[0_25px_60px_rgba(0,0,0,0.5)] animate-scaleIn">
        <div className="text-base font-semibold text-slate-200 mb-1">Mở Terminal</div>
        <div className="text-[13px] text-slate-500 mb-5">Chọn loại shell bạn muốn sử dụng</div>

        <div className="flex flex-col gap-2.5">
          {shells.map(shell => (
            <button
              key={shell.id}
              onClick={() => onSelect(shell.id)}
              className="flex items-center gap-4 p-4 bg-[#0f1820] border border-[#1e2d3d] rounded-xl cursor-pointer hover:border-blue-500/40 hover:bg-blue-500/5 transition-all group text-left"
            >
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center text-xl shrink-0 transition-transform group-hover:scale-110"
                style={{ background: `${shell.color}15`, border: `1px solid ${shell.color}30`, color: shell.color }}
              >
                {shell.icon}
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{shell.name}</div>
                <div className="text-[11px] text-slate-500">{shell.desc}</div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={onCancel}
          className="w-full mt-4 py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer bg-transparent border-none"
        >
          Hủy
        </button>
      </div>
    </div>
  );
}
