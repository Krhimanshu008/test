import React, { useState } from 'react';
import {
  Folder, FileText, File, ChevronRight, ChevronLeft, Home,
  Trash2, Plus, Download, FolderPlus, RefreshCw
} from 'lucide-react';
import useOsStore from '../../store/osStore';
import './style.css';

const getIcon = (path) => {
  if (path.endsWith('.py')) return '🐍';
  if (path.endsWith('.js')) return '📜';
  if (path.endsWith('.css')) return '🎨';
  if (path.endsWith('.html')) return '🌐';
  if (path.endsWith('.json')) return '📋';
  if (path.endsWith('.txt')) return '📝';
  if (path.endsWith('.pdf')) return '📄';
  return '📄';
};

const FileExplorerApp = ({ onOpenFile }) => {
  const virtualFS = useOsStore(s => s.virtualFS);
  const writeFile = useOsStore(s => s.writeFile);
  const deleteFile = useOsStore(s => s.deleteFile);
  const addNotification = useOsStore(s => s.addNotification);

  const [cwd, setCwd] = useState('/home/user');
  const [history, setHistory] = useState(['/home/user']);
  const [histIdx, setHistIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [renaming, setRenaming] = useState(null);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false); // 'file' | 'folder' | false
  const [createName, setCreateName] = useState('');

  // Build a directory tree
  const getEntries = (dir) => {
    const prefix = dir === '/' ? '/' : dir + '/';
    const seen = new Set();
    const files = [];
    const folders = [];

    Object.keys(virtualFS).forEach(path => {
      if (!path.startsWith(prefix)) return;
      const rel = path.slice(prefix.length);
      const parts = rel.split('/');
      if (parts.length === 1) {
        files.push({ name: parts[0], path, isDir: false });
      } else {
        const folderName = parts[0];
        if (!seen.has(folderName)) {
          seen.add(folderName);
          folders.push({ name: folderName, path: prefix + folderName, isDir: true });
        }
      }
    });

    return [...folders, ...files];
  };

  const navigate = (path) => {
    const newHist = [...history.slice(0, histIdx + 1), path];
    setHistory(newHist);
    setHistIdx(newHist.length - 1);
    setCwd(path);
    setSelected(null);
  };

  const goBack = () => {
    if (histIdx > 0) {
      const newIdx = histIdx - 1;
      setHistIdx(newIdx);
      setCwd(history[newIdx]);
    }
  };

  const goForward = () => {
    if (histIdx < history.length - 1) {
      const newIdx = histIdx + 1;
      setHistIdx(newIdx);
      setCwd(history[newIdx]);
    }
  };

  const breadcrumbs = cwd.split('/').filter(Boolean);

  const createItem = () => {
    if (!createName.trim()) { setCreating(false); return; }
    const path = cwd + '/' + createName.trim();
    if (creating === 'file') {
      writeFile(path, '');
      addNotification(`Created file: ${createName}`);
    }
    // folders are virtual — just navigate
    setCreating(false);
    setCreateName('');
  };

  const downloadFile = (path) => {
    const content = virtualFS[path];
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = path.split('/').pop();
    a.click();
    URL.revokeObjectURL(url);
    addNotification(`Downloaded: ${path.split('/').pop()}`);
  };

  const entries = getEntries(cwd);

  return (
    <div className="file-explorer-app">
      {/* Toolbar */}
      <div className="fe-toolbar">
        <button className="fe-btn" onClick={goBack} disabled={histIdx === 0} title="Back">
          <ChevronLeft size={16} />
        </button>
        <button className="fe-btn" onClick={goForward} disabled={histIdx === history.length - 1} title="Forward">
          <ChevronRight size={16} />
        </button>
        <button className="fe-btn" onClick={() => navigate('/home/user')} title="Home">
          <Home size={16} />
        </button>

        {/* Breadcrumb */}
        <div className="fe-breadcrumb">
          <span className="bc-root" onClick={() => navigate('/')}>
            <Folder size={13} /> Browser OS
          </span>
          {breadcrumbs.map((part, i) => (
            <React.Fragment key={i}>
              <ChevronRight size={12} className="bc-sep" />
              <span className="bc-part" onClick={() => navigate('/' + breadcrumbs.slice(0, i + 1).join('/'))}>
                {part}
              </span>
            </React.Fragment>
          ))}
        </div>

        <div style={{ flex: 1 }} />
        <button className="fe-btn" onClick={() => setCreating('file')} title="New File">
          <Plus size={15} /> File
        </button>
        <button className="fe-btn" onClick={() => setCreating('folder')} title="New Folder">
          <FolderPlus size={15} />
        </button>
      </div>

      {/* Main content */}
      <div className="fe-body">
        {/* Sidebar */}
        <div className="fe-sidebar">
          <div className="sidebar-section">Quick Access</div>
          {[
            { label: 'Home', path: '/home/user' },
            { label: 'Desktop', path: '/Desktop' },
          ].map(item => (
            <div
              key={item.path}
              className={`sidebar-item ${cwd === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <Folder size={14} color="#F8D775" fill="#F8D775" />
              {item.label}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="fe-grid-area">
          {creating && (
            <div className="fe-create-bar">
              <input
                autoFocus
                className="fe-create-input"
                placeholder={creating === 'file' ? 'filename.txt' : 'folder name'}
                value={createName}
                onChange={e => setCreateName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') createItem();
                  if (e.key === 'Escape') { setCreating(false); setCreateName(''); }
                }}
              />
              <button className="fe-create-ok" onClick={createItem}>Create</button>
              <button className="fe-create-cancel" onClick={() => { setCreating(false); setCreateName(''); }}>Cancel</button>
            </div>
          )}

          <div className="fe-grid">
            {entries.length === 0 && (
              <div className="fe-empty">This folder is empty</div>
            )}
            {entries.map(entry => (
              <div
                key={entry.path}
                className={`fe-item ${selected === entry.path ? 'selected' : ''}`}
                onClick={() => setSelected(entry.path)}
                onDoubleClick={() => {
                  if (entry.isDir) navigate(entry.path);
                  else if (onOpenFile) onOpenFile(entry.path, virtualFS[entry.path]);
                }}
              >
                {entry.isDir
                  ? <Folder size={36} color="#F8D775" fill="#F8D775" />
                  : <span className="fe-file-icon">{getIcon(entry.name)}</span>
                }
                <span className="fe-item-name">{entry.name}</span>
              </div>
            ))}
          </div>

          {/* Status bar */}
          {selected && !virtualFS[selected]?.isDir && virtualFS[selected] !== undefined && (
            <div className="fe-statusbar">
              <span>{selected.split('/').pop()}</span>
              <div className="fe-actions">
                <button onClick={() => downloadFile(selected)}>
                  <Download size={13} /> Download
                </button>
                <button className="danger" onClick={() => {
                  deleteFile(selected);
                  setSelected(null);
                  addNotification(`Deleted: ${selected.split('/').pop()}`);
                }}>
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileExplorerApp;
