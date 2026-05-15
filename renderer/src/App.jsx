import { useState, useEffect, useCallback } from 'react';
import ConnectModal from './components/ConnectModal.jsx';
import ProfileModal from './components/ProfileModal.jsx';
import TerminalTab from './components/TerminalTab.jsx';
import TunnelPanel from './components/TunnelPanel.jsx';
import SftpPanel from './components/SftpPanel.jsx';
import Sidebar from './components/Sidebar.jsx';
import TabBar from './components/TabBar.jsx';
import SshKeysPanel from './components/SshKeysPanel.jsx';
import WelcomeScreen from './components/WelcomeScreen.jsx';
import ShellSelector from './components/ShellSelector.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import { IconHosts, IconGroups, IconSftp, IconKeys, IconTunnel, IconSettings } from './components/Icons.jsx';

const NAV = [
  { id: 'hosts', label: 'Hosts', Icon: IconHosts },
  { id: 'groups', label: 'Groups', Icon: IconGroups },
  { id: 'sftp', label: 'SFTP', Icon: IconSftp },
  { id: 'keys', label: 'Keys', Icon: IconKeys },
  { id: 'tunnel', label: 'Tunnels', Icon: IconTunnel },
];

export default function App() {
  const [profiles, setProfiles] = useState([]);
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [activeNav, setActiveNav] = useState('hosts');
  const [search, setSearch] = useState('');
  const [showSftp, setShowSftp] = useState(false);
  const [connectModal, setConnectModal] = useState(null); // { profile }
  const [profileModal, setProfileModal] = useState(null); // null | profile | {}
  const [showTunnel, setShowTunnel] = useState(false);
  const [showShellSelector, setShowShellSelector] = useState(false);
  const [userSettings, setUserSettings] = useState({ userName: 'QA', userAvatar: '' });

  // Load user settings
  const loadSettings = () => {
    if (window.termix && window.termix.settings) {
      window.termix.settings.get().then(s => {
        if (s) setUserSettings({ userName: s.userName || 'QA', userAvatar: s.userAvatar || '' });
      });
    }
  };

  useEffect(() => {
    loadSettings();
    const handleUpdate = () => loadSettings();
    window.addEventListener('termix:settings-updated', handleUpdate);
    return () => window.removeEventListener('termix:settings-updated', handleUpdate);
  }, []);

  // Load profiles on mount
  useEffect(() => {
    if (window.termix) {
      window.termix.profiles.list().then(setProfiles);
    } else {
      // Dev fallback (browser without Electron)
      setProfiles([]);
    }
  }, []);

  // Listen for ssh:closed
  useEffect(() => {
    if (!window.termix) return;
    const unsub = window.termix.ssh.onClosed(({ sessionId }) => {
      setTabs(prev => prev.map(t =>
        t.sessionId === sessionId ? { ...t, connected: false } : t
      ));
    });
    return unsub;
  }, []);

  const openConnect = (profile) => {
    // Check validation first
    if (!profile.host || !profile.username) {
      alert('Vui lòng nhập Host IP và Username trong cài đặt Profile trước khi kết nối.');
      return;
    }

    // Check if already open
    const existing = tabs.find(t => t.profileId === profile.id);
    if (existing) { setActiveTab(existing.id); return; }
    
    // Auto-connect if it's a key or password is saved
    if (profile.authType === 'key' || (profile.authType === 'password' && profile.savePassword && profile.password)) {
      handleConnect({}, profile);
    } else {
      setConnectModal({ profile });
    }
  };

  const handleConnect = async ({ password }, directProfile = null) => {
    const profile = directProfile || connectModal?.profile;
    if (!profile) return;
    
    const sessionId = `sess_${Date.now()}`;
    const tabId = `tab_${Date.now()}`;

    // Add tab (loading state)
    const newTab = { id: tabId, profileId: profile.id, sessionId, name: profile.name, color: profile.color, connected: false };
    setTabs(prev => [...prev, newTab]);
    setActiveTab(tabId);
    if (!directProfile) setConnectModal(null);

    if (!window.termix) return; // dev mode - no real SSH

    try {
      await window.termix.ssh.connect({ sessionId, profile, password: password || profile.password });
      setTabs(prev => prev.map(t => t.id === tabId ? { ...t, connected: true } : t));
      
      // Auto save Quick Connect host
      if (window.termix) {
        setProfiles(prev => {
          if (!prev.some(p => p.id === profile.id)) {
            window.termix.profiles.save(profile).then(updated => setProfiles(updated));
          }
          return prev;
        });
      }
    } catch (err) {
      setTabs(prev => prev.map(t => t.id === tabId ? { ...t, error: err.message } : t));
      throw err;
    }
  };

  const closeTab = (e, tabId) => {
    e.stopPropagation();
    const tab = tabs.find(t => t.id === tabId);
    if (tab && window.termix) {
      window.termix.ssh.disconnect({ sessionId: tab.sessionId });
    }
    setTabs(prev => {
      const next = prev.filter(t => t.id !== tabId);
      if (activeTab === tabId) setActiveTab(next[next.length - 1]?.id || null);
      return next;
    });
  };

  const openLocalShell = async (shellType) => {
    setShowShellSelector(false);
    const sessionId = `local_${Date.now()}`;
    const shellName = shellType === 'powershell' ? 'PowerShell' : 'CMD';

    const newTab = {
      id: sessionId,
      sessionId,
      name: shellName,
      color: shellType === 'powershell' ? '#2563eb' : '#64748b',
      connected: false,
      profileId: null,
      isLocal: true,
      shellType,
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTab(sessionId);

    if (window.termix && window.termix.shell) {
      const result = await window.termix.shell.spawn({ sessionId, shellType });
      if (result.ok) {
        setTabs(prev => prev.map(t => t.id === sessionId ? { ...t, connected: true } : t));
      }
    }
  };

  const saveProfile = async (profile) => {
    if (!window.termix) { setProfileModal(null); return; }
    const updated = await window.termix.profiles.save(profile);
    setProfiles(updated);
    setProfileModal(null);
  };

  const deleteProfile = async (id) => {
    if (!window.termix) {
      setProfiles(prev => prev.filter(p => p.id !== id));
      return;
    }
    const updated = await window.termix.profiles.delete(id);
    setProfiles(updated);
  };

  const exportHosts = () => {
    const dataStr = JSON.stringify(profiles, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `termix-hosts-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importHosts = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const imported = JSON.parse(text);
        if (!Array.isArray(imported)) return;
        // Merge: giữ host cũ, thêm host mới từ file
        const existingIds = new Set(profiles.map(p => p.id));
        const newHosts = imported.filter(h => !existingIds.has(h.id));
        const merged = [...profiles, ...newHosts];
        setProfiles(merged);
        // Lưu xuống backend nếu có
        if (window.termix) {
          for (const h of newHosts) {
            await window.termix.profiles.save(h);
          }
        }
      } catch (err) {
        console.error('Import failed:', err);
      }
    };
    input.click();
  };

  const groups = [...new Set(profiles.map(p => p.group))];
  const filtered = profiles.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.host.toLowerCase().includes(search.toLowerCase())
  );

  const activeTabObj = tabs.find(t => t.id === activeTab);

  return (
    <div className="flex h-screen w-full bg-termix-bg text-termix-text overflow-hidden font-sans">
      {/* ── Icon Nav ── */}
      <div className="w-[54px] bg-termix-panel border-r border-termix-border flex flex-col items-center py-2.5 gap-0.5 shrink-0">
        {/* Logo */}
        <div className="w-[34px] h-[34px] rounded-[9px] bg-gradient-to-br from-blue-500 to-indigo-400 flex items-center justify-center mb-3.5 text-lg shadow-[0_0_16px_rgba(99,102,241,0.35)]">
          ⚡
        </div>

        {NAV.map(({ id, label, Icon: Ico }) => (
          <button
            key={id}
            title={label}
            onClick={() => setActiveNav(id)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-150 ${
              activeNav === id ? 'bg-blue-500/15 text-blue-400' : 'bg-transparent text-termix-textDark'
            }`}
          >
            <Ico />
          </button>
        ))}

        <div className="flex-1" />

        <button
          title="Settings"
          onClick={() => setActiveNav('settings')}
          className={`w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-150 ${
            activeNav === 'settings' ? 'bg-blue-500/15 text-blue-400' : 'bg-transparent text-termix-textDark'
          }`}
        >
          <IconSettings />
        </button>

        {/* Avatar */}
        <div 
          className="w-[30px] h-[30px] rounded-full mt-1.5 bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white cursor-pointer shrink-0 overflow-hidden shadow-sm"
          title={userSettings.userName}
        >
          {userSettings.userAvatar ? (
            <img src={userSettings.userAvatar} alt="avatar" className="w-full h-full object-cover" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='block'; }} />
          ) : null}
          <span style={{ display: userSettings.userAvatar ? 'none' : 'block' }}>
            {userSettings.userName ? userSettings.userName.charAt(0).toUpperCase() : 'U'}
          </span>
        </div>
      </div>

      {/* ── Sidebar (chỉ hiện khi đang ở hosts/groups) ── */}
      {(activeNav === 'hosts' || activeNav === 'groups') && (
        <Sidebar
          NAV={NAV}
          activeNav={activeNav}
          search={search}
          setSearch={setSearch}
          groups={groups}
          filteredProfiles={filtered}
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          openConnect={openConnect}
          setProfileModal={setProfileModal}
          deleteProfile={deleteProfile}
          exportHosts={exportHosts}
          importHosts={importHosts}
          profilesLength={profiles.length}
        />
      )}

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Tab bar */}
        <TabBar
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          closeTab={closeTab}
          setActiveNav={setActiveNav}
          activeTabObj={activeTabObj}
          setShowTunnel={setShowTunnel}
          showSftp={showSftp}
          setShowSftp={setShowSftp}
          onNewTab={() => setShowShellSelector(true)}
        />

        {/* Terminal area */}
        <div className="flex-1 flex min-h-0 relative">
          {/* SSH Keys panel */}
          {activeNav === 'keys' && <SshKeysPanel />}
          {/* Settings panel */}
          {activeNav === 'settings' && <SettingsPanel />}

          {/* Main terminal + SFTP */}
          <div className={`${(activeNav === 'keys' || activeNav === 'settings') ? 'hidden' : 'flex'} flex-1 min-h-0 relative`}>
            {tabs.length === 0 ? (
              <WelcomeScreen openConnect={openConnect} />
            ) : (
              tabs.map(tab => (
                <TerminalTab
                  key={tab.id}
                  tab={tab}
                  active={activeTab === tab.id}
                  showSftp={false}
                />
              ))
            )}
          </div>

          {/* SFTP Panel: hiện khi bấm nút SFTP trên TabBar HOẶC khi click icon SFTP sidebar */}
          {(showSftp || activeNav === 'sftp') && activeTabObj?.connected && !activeTabObj?.isLocal && (
            <SftpPanel sessionId={activeTabObj.sessionId} />
          )}
        </div>

        {/* Status bar */}
        <div className="h-[22px] bg-termix-panel border-t border-termix-border flex items-center px-3.5 gap-4.5 text-[11px] text-termix-textDark shrink-0 select-none">
          {activeTabObj ? (
            <>
              <span>
                <span className={activeTabObj.connected ? 'text-termix-success' : 'text-termix-warning'}>●</span>
                {' '}{activeTabObj.connected ? 'Connected' : 'Connecting...'}
              </span>
              <span>{activeTabObj.name}</span>
              {activeTabObj.connected && <span>AES-256-CTR · HMAC-SHA2-256</span>}
            </>
          ) : (
            <span>Termix v1.0.0</span>
          )}
          <div className="flex-1" />
          <span>{new Date().toLocaleTimeString('vi-VN')}</span>
        </div>
      </div>

      {/* ── Modals ── */}
      {connectModal && (
        <ConnectModal
          profile={connectModal.profile}
          onConnect={handleConnect}
          onCancel={() => setConnectModal(null)}
        />
      )}

      {profileModal !== null && (
        <ProfileModal
          profile={Object.keys(profileModal).length ? profileModal : null}
          onSave={saveProfile}
          onCancel={() => setProfileModal(null)}
        />
      )}

      {showTunnel && activeTabObj && (
        <TunnelPanel
          sessionId={activeTabObj.sessionId}
          onClose={() => setShowTunnel(false)}
        />
      )}

      {showShellSelector && (
        <ShellSelector
          onSelect={openLocalShell}
          onCancel={() => setShowShellSelector(false)}
        />
      )}

    </div>
  );
}
