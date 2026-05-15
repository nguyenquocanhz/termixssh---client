import { useState, useEffect, useCallback, useRef } from 'react';

const fmt = (bytes) => {
  if (bytes == null || bytes === 0) return '-';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
};

const FileList = ({ 
  title, path, files, loading, error, 
  onNavigate, onRefresh, 
  selected, onSelect, onDrop, onDragStart, paneType
}) => {
  const pathParts = path.split(/[\/\\]/).filter(Boolean);
  const sep = paneType === 'local' && navigator.userAgent.includes('Win') ? '\\' : '/';

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-blue-500/10');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('bg-blue-500/10');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-blue-500/10');
    // from OS desktop
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && e.dataTransfer.getData('application/termix-sftp') === '') {
       const paths = Array.from(e.dataTransfer.files).map(f => f.path);
       if (paths.length > 0) onDrop(paths, 'os');
       return;
    }
    // from other pane
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/termix-sftp'));
      if (data.sourcePane !== paneType) {
        onDrop(data.files, data.sourcePane);
      }
    } catch (err) {}
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 border-r border-[#1e2d3d] last:border-0 relative">
      <div className="py-2 px-3 border-b border-[#111827] bg-[#111827] flex justify-between items-center shrink-0">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{title}</span>
        <button onClick={onRefresh} className="text-slate-500 hover:text-white transition-colors cursor-pointer text-sm">↻</button>
      </div>
      <div className="py-1.5 px-3 border-b border-termix-border bg-[#0a0e14] shrink-0 flex items-center gap-1 text-xs truncate">
        <span 
          onClick={() => onNavigate(paneType === 'local' && navigator.userAgent.includes('Win') ? 'C:\\' : '/')} 
          className="text-slate-500 cursor-pointer hover:text-white"
        >
          _ROOT_
        </span>
        {pathParts.map((p, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="text-slate-600">{sep}</span>
            <span 
              onClick={() => onNavigate(pathParts.slice(0, i + 1).join(sep) + (paneType === 'local' && navigator.userAgent.includes('Win') && i===0 ? sep : ''))}
              className="text-slate-300 cursor-pointer hover:text-white"
            >{p}</span>
          </span>
        ))}
      </div>
      <div 
        className="flex-1 overflow-y-auto scrollbar-custom bg-[#0d1117]"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {loading && <div className="p-4 text-center text-xs text-slate-500">Đang tải...</div>}
        {error && <div className="p-4 text-center text-xs text-red-400">{error}</div>}
        {!loading && files.map((f, i) => {
          const isSelected = selected.has(f.name);
          return (
            <div 
              key={f.name + i}
              draggable={f.name !== '..'}
              onDragStart={(e) => {
                const selectedFiles = isSelected ? Array.from(selected) : [f.name];
                e.dataTransfer.setData('application/termix-sftp', JSON.stringify({ sourcePane: paneType, files: selectedFiles }));
                onDragStart && onDragStart();
              }}
              onClick={(e) => onSelect(e, f.name)}
              onDoubleClick={() => f.type === 'dir' && onNavigate(f.name === '..' 
                ? (path.split(sep).slice(0, -1).join(sep) || (paneType === 'local' && navigator.userAgent.includes('Win') ? 'C:\\' : '/')) 
                : (path.endsWith(sep) ? path + f.name : path + sep + f.name)
              )}
              className={`flex items-center px-3 py-1.5 text-[12px] border-b border-white/5 cursor-pointer transition-colors select-none ${
                isSelected ? 'bg-blue-500/20 text-blue-200' : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <span className="shrink-0 w-5 text-center">
                {f.name === '..' ? '↑' : f.type === 'dir' ? '📁' : '📄'}
              </span>
              <span className="flex-1 truncate mx-2">{f.name}</span>
              <span className="shrink-0 text-[11px] text-slate-500">{fmt(f.size)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function SftpPanel({ sessionId }) {
  const [width, setWidth] = useState(600);
  const [isResizing, setIsResizing] = useState(false);
  
  const [localPath, setLocalPath] = useState('');
  const [remotePath, setRemotePath] = useState('/');
  const [localFiles, setLocalFiles] = useState([]);
  const [remoteFiles, setRemoteFiles] = useState([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [remoteError, setRemoteError] = useState('');
  
  const [localSelected, setLocalSelected] = useState(new Set());
  const [remoteSelected, setRemoteSelected] = useState(new Set());
  const [transfers, setTransfers] = useState([]);

  // Loaders
  const loadLocal = async (p) => {
    if (!window.termix || !window.termix.localFs) return;
    setLocalLoading(true); setLocalError('');
    try {
      if (!p) p = await window.termix.localFs.home();
      const list = await window.termix.localFs.list(p);
      setLocalFiles(list);
      setLocalPath(p);
      setLocalSelected(new Set());
    } catch (e) {
      setLocalError(e.message || 'Lỗi đọc local');
    } finally {
      setLocalLoading(false);
    }
  };

  const loadRemote = async (p) => {
    if (!window.termix || !window.termix.sftp) return;
    setRemoteLoading(true); setRemoteError('');
    try {
      const list = await window.termix.sftp.list(sessionId, p);
      setRemoteFiles(list);
      setRemotePath(p);
      setRemoteSelected(new Set());
    } catch (e) {
      setRemoteError(e.message || 'Lỗi đọc remote');
    } finally {
      setRemoteLoading(false);
    }
  };

  useEffect(() => {
    loadLocal();
    loadRemote('/');
  }, [sessionId]);

  // Transfer Progress
  useEffect(() => {
    if (!window.termix || !window.termix.sftp) return;
    const unsub = window.termix.sftp.onProgress((p) => {
      if (p.sessionId !== sessionId) return;
      setTransfers(prev => {
        const key = p.remotePath || p.localPath;
        const idx = prev.findIndex(t => t.key === key);
        const entry = { key, type: p.type, transferred: p.transferred, total: p.total };
        if (idx >= 0) { const n = [...prev]; n[idx] = entry; return n; }
        return [...prev, entry];
      });
    });
    return unsub;
  }, [sessionId]);

  // Selection Logic
  const handleSelect = (e, fileName, filesList, selectedSet, setSelection) => {
    if (fileName === '..') return;
    const newSet = new Set(selectedSet);
    if (e.ctrlKey || e.metaKey) {
      newSet.has(fileName) ? newSet.delete(fileName) : newSet.add(fileName);
    } else if (e.shiftKey && newSet.size > 0) {
      const lastSelected = Array.from(newSet).pop();
      const idx1 = filesList.findIndex(f => f.name === lastSelected);
      const idx2 = filesList.findIndex(f => f.name === fileName);
      const start = Math.min(idx1, idx2);
      const end = Math.max(idx1, idx2);
      for (let i = start; i <= end; i++) {
        if (filesList[i].name !== '..') newSet.add(filesList[i].name);
      }
    } else {
      newSet.clear();
      newSet.add(fileName);
    }
    setSelection(newSet);
  };

  // Actions
  const uploadFiles = async (fileNames) => {
    if (!window.termix) return;
    const sep = navigator.userAgent.includes('Win') ? '\\' : '/';
    for (const name of fileNames) {
      const lPath = localPath.endsWith(sep) ? localPath + name : localPath + sep + name;
      const rPath = remotePath.endsWith('/') ? remotePath + name : remotePath + '/' + name;
      try {
        await window.termix.sftp.upload(sessionId, lPath, rPath);
      } catch (e) {
        console.error('Upload failed:', e);
      }
    }
    loadRemote(remotePath);
  };

  const downloadFiles = async (fileNames) => {
    if (!window.termix) return;
    const sep = navigator.userAgent.includes('Win') ? '\\' : '/';
    for (const name of fileNames) {
      const rPath = remotePath.endsWith('/') ? remotePath + name : remotePath + '/' + name;
      const lPath = localPath.endsWith(sep) ? localPath + name : localPath + sep + name;
      try {
        await window.termix.sftp.download(sessionId, rPath, lPath);
      } catch (e) {
        console.error('Download failed:', e);
      }
    }
    loadLocal(localPath);
  };

  const handleDropToLocal = async (filesOrPaths, sourcePane) => {
    if (sourcePane === 'remote') {
      await downloadFiles(filesOrPaths);
    }
  };

  const handleDropToRemote = async (filesOrPaths, sourcePane) => {
    if (sourcePane === 'local') {
      await uploadFiles(filesOrPaths);
    } else if (sourcePane === 'os') {
      // OS drop
      for (const p of filesOrPaths) {
         const name = p.split(/[\/\\]/).pop();
         const rPath = remotePath.endsWith('/') ? remotePath + name : remotePath + '/' + name;
         await window.termix.sftp.upload(sessionId, p, rPath);
      }
      loadRemote(remotePath);
    }
  };

  // Keyboard copy paste
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isResizing) return;
      // Copy: Ctrl+C
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        if (localSelected.size > 0) {
          window.sessionStorage.setItem('termix-clipboard', JSON.stringify({ pane: 'local', files: Array.from(localSelected) }));
        } else if (remoteSelected.size > 0) {
          window.sessionStorage.setItem('termix-clipboard', JSON.stringify({ pane: 'remote', files: Array.from(remoteSelected) }));
        }
      }
      // Paste: Ctrl+V
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        const clip = window.sessionStorage.getItem('termix-clipboard');
        if (clip) {
          const data = JSON.parse(clip);
          if (data.pane === 'local' && remoteSelected.size === 0) {
            uploadFiles(data.files);
          } else if (data.pane === 'remote' && localSelected.size === 0) {
            downloadFiles(data.files);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [localSelected, remoteSelected, localPath, remotePath]);

  // Resizing
  const startResizing = (e) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = width;
    const onMouseMove = (moveEvent) => setWidth(Math.max(400, Math.min(1200, startWidth - (moveEvent.clientX - startX))));
    const onMouseUp = () => { setIsResizing(false); document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div 
      className={`border-l border-termix-border bg-[#0a0e14] flex flex-col shrink-0 font-sans relative ${isResizing ? 'select-none pointer-events-none' : ''}`}
      style={{ width: `${width}px` }}
    >
      <div className={`resize-handle-left ${isResizing ? 'active' : ''}`} onMouseDown={startResizing} style={{ pointerEvents: 'auto' }} />
      
      {/* Dual Pane Layout */}
      <div className="flex-1 flex min-h-0">
        <FileList 
          title="💻 Local PC" 
          paneType="local"
          path={localPath} 
          files={localFiles} 
          loading={localLoading} 
          error={localError}
          onNavigate={loadLocal}
          onRefresh={() => loadLocal(localPath)}
          selected={localSelected}
          onSelect={(e, f) => handleSelect(e, f, localFiles, localSelected, setLocalSelected)}
          onDrop={handleDropToLocal}
        />
        <FileList 
          title="🌐 Remote Server" 
          paneType="remote"
          path={remotePath} 
          files={remoteFiles} 
          loading={remoteLoading} 
          error={remoteError}
          onNavigate={loadRemote}
          onRefresh={() => loadRemote(remotePath)}
          selected={remoteSelected}
          onSelect={(e, f) => handleSelect(e, f, remoteFiles, remoteSelected, setRemoteSelected)}
          onDrop={handleDropToRemote}
        />
      </div>

      {/* Transfer Bar */}
      {transfers.length > 0 && (
        <div className="border-t border-[#111827] bg-[#0d1117] px-3 py-2 max-h-[100px] overflow-y-auto w-full">
          {transfers.map((t, i) => (
            <div key={i} className="mb-2 last:mb-0">
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span className="truncate max-w-[80%]">{t.type === 'upload' ? '↑' : '↓'} {(t.key || '').split(/[\/\\]/).pop()}</span>
                <span>{t.total ? Math.round((t.transferred / t.total) * 100) + '%' : '...'}</span>
              </div>
              <div className="h-1 bg-[#1e2d3d] rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-200 ${t.type === 'upload' ? 'bg-blue-500' : 'bg-emerald-500'}`}
                  style={{ width: t.total ? (t.transferred / t.total * 100) + '%' : '0%' }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
