import { useState, useEffect, useRef } from 'react';

export default function Sidebar({
  NAV,
  activeNav,
  search,
  setSearch,
  groups,
  filteredProfiles,
  tabs,
  activeTab,
  setActiveTab,
  openConnect,
  setProfileModal,
  deleteProfile,
  exportHosts,
  importHosts,
  profilesLength,
}) {
  const [width, setWidth] = useState(252);
  const [isResizing, setIsResizing] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [contextMenu, setContextMenu] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, name }
  const menuRef = useRef(null);

  // Click outside đóng context menu
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setContextMenu(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleGroup = (group) => {
    setCollapsedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const startResizing = (e) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = width;

    const onMouseMove = (moveEvent) => {
      const newWidth = Math.max(200, Math.min(600, startWidth + (moveEvent.clientX - startX)));
      setWidth(newWidth);
    };

    const onMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <>
    <div 
      className={`bg-termix-sidebar border-r border-termix-border flex flex-col shrink-0 relative transition-opacity duration-300 ${isResizing ? 'select-none pointer-events-none' : ''}`}
      style={{ width: `${width}px` }}
    >
      <div className={`resize-handle ${isResizing ? 'active' : ''}`} onMouseDown={startResizing} style={{ pointerEvents: 'auto' }} />
      
      {/* Sidebar header */}
      <div className="px-3.5 pt-3.5 pb-2.5 border-b border-termix-border">
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-[11px] font-semibold text-termix-textMuted uppercase tracking-[0.09em]">
            {NAV.find(n => n.id === activeNav)?.label}
          </span>
          <button
            onClick={() => setProfileModal({})}
            className="bg-blue-500/10 border border-blue-500/25 text-blue-400 rounded-md px-2.5 py-[3px] text-xs cursor-pointer hover:bg-blue-500/20 transition-colors"
          >
            + New
          </button>
        </div>
        {/* Export / Import */}
        <div className="flex gap-1.5 mb-2.5">
          <button onClick={exportHosts} title="Export Hosts" className="flex-1 bg-transparent border border-termix-border text-termix-textDark rounded-md py-[3px] text-[10px] cursor-pointer hover:bg-white/5 hover:text-slate-400 transition-colors">
            ↓ Export
          </button>
          <button onClick={importHosts} title="Import Hosts" className="flex-1 bg-transparent border border-termix-border text-termix-textDark rounded-md py-[3px] text-[10px] cursor-pointer hover:bg-white/5 hover:text-slate-400 transition-colors">
            ↑ Import
          </button>
        </div>
        <div className="relative">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2"
            style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            placeholder="Tìm host..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-termix-input border border-termix-inputborder rounded-lg py-[7px] pr-2.5 pl-7 text-termix-text text-xs outline-none font-sans focus:border-blue-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Host list */}
      <div className="flex-1 overflow-y-auto py-1.5 scrollbar-custom animate-fadeIn">
        {groups.map(group => {
          const groupHosts = filteredProfiles.filter(p => p.group === group);
          if (!groupHosts.length) return null;
          const isCollapsed = collapsedGroups[group];
          
          return (
            <div key={group} className="mb-1">
              <div 
                className="flex items-center justify-between px-3.5 pt-2 pb-1.5 cursor-pointer hover:bg-white/5 transition-colors group"
                onClick={() => toggleGroup(group)}
              >
                <div className="text-[10px] font-bold text-termix-textDark uppercase tracking-widest group-hover:text-termix-textMuted transition-colors">
                  {group}
                </div>
                <div className={`text-termix-textDark text-[10px] transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}>
                  ▼
                </div>
              </div>
              
              <div className={`overflow-hidden transition-all duration-300 origin-top ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'}`}>
                {groupHosts.map(profile => {
                  const isOpen = tabs.some(t => t.profileId === profile.id);
                  const tab = tabs.find(t => t.profileId === profile.id);
                  const isActive = isOpen && activeTab === tab?.id;
                  
                  return (
                    <div
                      key={profile.id}
                      onClick={() => isOpen ? setActiveTab(tab.id) : openConnect(profile)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({ x: e.clientX, y: e.clientY, profile });
                      }}
                      className={`px-3.5 py-[7px] cursor-pointer flex items-center gap-[9px] transition-colors duration-100 ${
                        isActive ? 'bg-blue-500/10' : 'hover:bg-white/[0.03] bg-transparent'
                      }`}
                      style={{ borderLeft: isOpen ? `2px solid ${profile.color}` : '2px solid transparent' }}
                    >
                      {/* Icon */}
                      <div
                        className="w-[30px] h-[30px] rounded-[7px] shrink-0 flex items-center justify-center text-[13px] relative transition-transform hover:scale-105"
                        style={{ background: `${profile.color}18`, border: `1px solid ${profile.color}30`, color: profile.color }}
                      >
                        ⬡
                        {/* Online dot */}
                        <div
                          className={`absolute -bottom-[2px] -right-[2px] w-[7px] h-[7px] rounded-full border-[1.5px] border-[#0c1420] transition-colors ${
                            tab?.connected ? 'bg-termix-success' : isOpen ? 'bg-termix-warning' : 'bg-termix-border'
                          }`}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-termix-text truncate transition-colors">
                          {profile.name}
                        </div>
                        <div className="text-[11px] text-termix-textDark truncate">
                          {profile.username}@{profile.host}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filteredProfiles.length === 0 && (
          <div className="p-6 text-center text-termix-textDark text-[13px] animate-fadeIn">
            Không tìm thấy host nào
          </div>
        )}
      </div>

      {/* Bottom stats */}
      <div className="px-3.5 py-2.5 border-t border-termix-border flex gap-3.5">
        <span className="text-[11px] text-termix-textDark">
          <span className="text-termix-success animate-pulse inline-block">●</span> {tabs.filter(t => t.connected).length} connected
        </span>
        <span className="text-[11px] text-termix-textDark">{profilesLength} hosts</span>
      </div>
    </div>

    {/* Context Menu */}
    {contextMenu && (
      <div
        ref={menuRef}
        className="fixed z-[200] bg-[#141c27] border border-[#1e2d3d] rounded-lg shadow-[0_8px_30px_rgba(0,0,0,0.5)] py-1 min-w-[160px] animate-scaleIn"
        style={{ left: contextMenu.x, top: contextMenu.y }}
      >
        <button
          className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-blue-500/15 hover:text-blue-400 transition-colors cursor-pointer"
          onClick={() => { openConnect(contextMenu.profile); setContextMenu(null); }}
        >
          ▶ Kết nối
        </button>
        <button
          className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 transition-colors cursor-pointer"
          onClick={() => { setProfileModal(contextMenu.profile); setContextMenu(null); }}
        >
          ✏ Sửa
        </button>
        <button
          className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 transition-colors cursor-pointer"
          onClick={() => {
            navigator.clipboard.writeText(contextMenu.profile.host);
            setContextMenu(null);
          }}
        >
          📋 Copy IP
        </button>
        <div className="border-t border-[#1e2d3d] my-1" />
        <button
          className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
          onClick={() => {
            setConfirmDelete({ id: contextMenu.profile.id, name: contextMenu.profile.name });
            setContextMenu(null);
          }}
        >
          🗑 Xóa
        </button>
      </div>
    )}

    {/* Delete Confirmation Modal */}
    {confirmDelete && (
      <div 
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] backdrop-blur-sm animate-fadeIn"
        onClick={() => setConfirmDelete(null)}
      >
        <div className="bg-[#141c27] border border-[#1e2d3d] rounded-xl p-6 w-[340px] shadow-[0_25px_60px_rgba(0,0,0,0.5)] animate-scaleIn" onClick={e => e.stopPropagation()}>
          <div className="text-base font-semibold text-slate-200 mb-2">Xác nhận xóa</div>
          <div className="text-sm text-slate-400 mb-5">
            Bạn có chắc muốn xóa host <span className="text-red-400 font-medium">"{confirmDelete.name}"</span>?
          </div>
          <div className="flex gap-2.5">
            <button 
              className="flex-1 p-2 rounded-lg text-sm font-medium cursor-pointer border border-[#1e2d3d] bg-transparent text-slate-500 hover:bg-white/5 transition-colors"
              onClick={() => setConfirmDelete(null)}
            >
              Hủy
            </button>
            <button 
              className="flex-1 p-2 rounded-lg text-sm font-medium cursor-pointer border-none bg-gradient-to-br from-red-500 to-red-700 text-white hover:opacity-90 transition-opacity"
              onClick={() => { deleteProfile(confirmDelete.id); setConfirmDelete(null); }}
            >
              Xóa
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
