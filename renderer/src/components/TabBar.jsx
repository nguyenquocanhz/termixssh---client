export default function TabBar({
  tabs,
  activeTab,
  setActiveTab,
  closeTab,
  setActiveNav,
  activeTabObj,
  setShowTunnel,
  showSftp,
  setShowSftp,
  onNewTab,
}) {
  return (
    <div className="h-[38px] bg-termix-panel border-b border-termix-border flex items-stretch shrink-0 overflow-x-auto">
      {tabs.map(tab => (
        <div
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`group flex items-center gap-[7px] px-3 cursor-pointer min-w-[130px] max-w-[180px] border-r border-termix-border shrink-0 transition-all duration-200 animate-fadeIn ${
            activeTab === tab.id ? 'bg-termix-sidebar' : 'bg-transparent hover:bg-white/5'
          }`}
          style={{ borderBottom: activeTab === tab.id ? `2px solid ${tab.color}` : '2px solid transparent' }}
        >
          <div
            className={`w-[7px] h-[7px] rounded-full shrink-0 ${!tab.connected && 'bg-termix-textDark'}`}
            style={tab.connected ? { background: tab.color } : {}}
          />
          <span className={`text-xs flex-1 truncate ${activeTab === tab.id ? 'text-termix-text' : 'text-[#475569]'}`}>
            {tab.name}
          </span>
          <span
            onClick={(e) => closeTab(e, tab.id)}
            className="opacity-0 group-hover:opacity-100 text-termix-textDark cursor-pointer text-[15px] leading-none px-[1px] hover:text-red-400 transition-all duration-200"
          >
            ×
          </span>
        </div>
      ))}

      {/* + new tab */}
      <div
        className="px-3 flex items-center text-termix-textDark cursor-pointer text-xl select-none hover:bg-white/5 hover:text-blue-400 transition-colors"
        onClick={onNewTab}
        title="Mở Terminal mới"
      >
        +
      </div>

      <div className="flex-1" />

      {/* Right toolbar */}
      <div className="flex items-center gap-1.5 px-3 shrink-0">
        {activeTabObj?.connected && (
          <button
            onClick={() => setShowTunnel(true)}
            className="bg-transparent border border-termix-border text-[#475569] rounded-md px-2.5 py-[3px] text-[11px] cursor-pointer hover:bg-white/5 transition-colors"
          >
            ⇌ Tunnel
          </button>
        )}
        {activeTabObj?.connected && (
          <button
            onClick={() => setShowSftp(p => !p)}
            className={`border rounded-md px-2.5 py-[3px] text-[11px] cursor-pointer transition-colors ${
              showSftp
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                : 'bg-transparent border-termix-border text-[#475569] hover:bg-white/5'
            }`}
          >
            ⇅ SFTP
          </button>
        )}
      </div>
    </div>
  );
}
