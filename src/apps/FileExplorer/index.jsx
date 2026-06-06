import React, { useState, useEffect, useRef } from 'react';
import {
  Folder, FileText, File, ChevronRight, ChevronLeft, Home,
  Trash2, Plus, Download, FolderPlus, RefreshCw, Search,
  UploadCloud, Copy, Scissors, Clipboard, Edit, Upload, FolderOpen
} from 'lucide-react';
import useOsStore from '../../store/osStore';
import { APP_REGISTRY } from '../../apps/registry';
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

const FileExplorerApp = ({ onOpenFile, initialPath = '/home/user' }) => {
  const virtualFS = useOsStore(s => s.virtualFS);
  const writeFile = useOsStore(s => s.writeFile);
  const deleteFile = useOsStore(s => s.deleteFile);
  const openWindow = useOsStore(s => s.openWindow);
  const addNotification = useOsStore(s => s.addNotification);
  const clipboard = useOsStore(s => s.clipboard);
  const copyFile = useOsStore(s => s.copyFile);
  const cutFile = useOsStore(s => s.cutFile);
  const pasteFile = useOsStore(s => s.pasteFile);
  const addAuditLog = useOsStore(s => s.addAuditLog);

  const [cwd, setCwd] = useState(initialPath);
  const [history, setHistory] = useState([initialPath]);
  const [histIdx, setHistIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  
  // Renaming state
  const [renaming, setRenaming] = useState(null); // path of the file/folder being renamed
  const [newName, setNewName] = useState('');

  // Creation state
  const [creating, setCreating] = useState(false); // 'file' | 'folder' | false
  const [createName, setCreateName] = useState('');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);

  // Custom context menu state
  const [contextMenu, setContextMenu] = useState(null);

  const fileInputRef = useRef(null);

  // Close context menu on global click
  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Build directory tree with alphabet sorting and folders first
  const getEntries = (dir) => {
    const prefix = dir === '/' ? '/' : dir + '/';
    const seen = new Set();
    const files = [];
    const folders = [];

    Object.keys(virtualFS).forEach(path => {
      if (!path.startsWith(prefix)) return;
      const rel = path.slice(prefix.length);
      const parts = rel.split('/');

      // Ignore hidden placeholders at this level
      if (parts[0] === '.keep') return;

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

    // Sort folders first, then files alphabetically
    folders.sort((a, b) => a.name.localeCompare(b.name));
    files.sort((a, b) => a.name.localeCompare(b.name));

    return [...folders, ...files];
  };

  const navigate = (path) => {
    if (path === cwd) return;
    addAuditLog('EXPLORER_NAVIGATE', `Opened folder ${path}`);
    const newHist = [...history.slice(0, histIdx + 1), path];
    setHistory(newHist);
    setHistIdx(newHist.length - 1);
    setCwd(path);
    setSelected(null);
    setSearchQuery('');
  };

  const goBack = () => {
    if (histIdx > 0) {
      const newIdx = histIdx - 1;
      setHistIdx(newIdx);
      setCwd(history[newIdx]);
      setSelected(null);
      setSearchQuery('');
    }
  };

  const goForward = () => {
    if (histIdx < history.length - 1) {
      const newIdx = histIdx + 1;
      setHistIdx(newIdx);
      setCwd(history[newIdx]);
      setSelected(null);
      setSearchQuery('');
    }
  };

  const breadcrumbs = cwd.split('/').filter(Boolean);

  const createItem = () => {
    if (!createName.trim()) { setCreating(false); return; }
    const path = cwd === '/' ? '/' + createName.trim() : cwd + '/' + createName.trim();
    
    // Enforce name uniqueness case-insensitively
    const currentEntries = getEntries(cwd);
    if (currentEntries.some(e => e.name.toLowerCase() === createName.trim().toLowerCase())) {
      addNotification(`An item named "${createName.trim()}" already exists.`);
      setCreating(false);
      setCreateName('');
      return;
    }

    if (creating === 'file') {
      writeFile(path, '');
      addNotification(`Created file: ${createName}`);
    } else if (creating === 'folder') {
      // Create empty folder via hidden placeholder file
      writeFile(path + '/.keep', '');
      addNotification(`Created folder: ${createName}`);
    }
    
    setCreating(false);
    setCreateName('');
  };

  const downloadFile = (path) => {
    setContextMenu(null);
    const content = virtualFS[path] || '';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = path.split('/').pop();
    a.click();
    URL.revokeObjectURL(url);
    addNotification(`Downloaded: ${path.split('/').pop()}`);
  };

  // Inline Rename commit
  const commitRename = () => {
    if (!newName.trim() || renaming === null) {
      setRenaming(null);
      return;
    }
    const oldPath = renaming;
    const parts = oldPath.split('/');
    const oldName = parts[parts.length - 1];
    parts[parts.length - 1] = newName.trim();
    const newPath = parts.join('/');

    if (newPath === oldPath) {
      setRenaming(null);
      return;
    }

    // Enforce name uniqueness case-insensitively on rename
    const currentEntries = getEntries(cwd);
    if (currentEntries.some(e => e.name.toLowerCase() === newName.trim().toLowerCase())) {
      addNotification(`An item named "${newName.trim()}" already exists.`);
      setRenaming(null);
      return;
    }

    const isDir = !virtualFS[oldPath];

    if (isDir) {
      // Recursively rename folder contents
      const oldPrefix = oldPath + '/';
      const newPrefix = newPath + '/';
      Object.entries(virtualFS).forEach(([fPath, content]) => {
        if (fPath.startsWith(oldPrefix)) {
          const subRel = fPath.slice(oldPrefix.length);
          writeFile(newPrefix + subRel, content);
          deleteFile(fPath);
        }
      });
      // Rename empty folder .keep file if exists
      if (virtualFS[oldPath + '/.keep'] !== undefined) {
        writeFile(newPath + '/.keep', '');
        deleteFile(oldPath + '/.keep');
      }
      addNotification(`Renamed folder: ${newName}`);
    } else {
      // Rename file
      const content = virtualFS[oldPath] || '';
      writeFile(newPath, content);
      deleteFile(oldPath);
      addNotification(`Renamed file: ${newName}`);
    }

    setRenaming(null);
  };

  // Local File Upload handlers
  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target.result;
          writeFile(cwd === '/' ? '/' + file.name : cwd + '/' + file.name, content);
          addNotification(`Uploaded file: ${file.name}`);
        };
        reader.readAsText(file);
      });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX >= rect.right ||
      e.clientY < rect.top ||
      e.clientY >= rect.bottom
    ) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target.result;
          writeFile(cwd === '/' ? '/' + file.name : cwd + '/' + file.name, content);
          addNotification(`Uploaded file: ${file.name}`);
        };
        reader.readAsText(file);
      });
    }
  };

  // Context Menu Handlers (localized and clamped to container bounds)
  const containerRef = useRef(null);

  const handleItemContextMenu = (e, entry) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const menuWidth = 175;
    const menuHeight = 235;
    
    const clampedX = Math.min(clickX, rect.width - menuWidth);
    const clampedY = Math.min(clickY, rect.height - menuHeight);

    setContextMenu({
      x: Math.max(0, clampedX),
      y: Math.max(0, clampedY),
      targetItem: entry
    });
  };

  const handleGridContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target.closest('.fe-item')) return;
    
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const menuWidth = 175;
    const menuHeight = 160;
    
    const clampedX = Math.min(clickX, rect.width - menuWidth);
    const clampedY = Math.min(clickY, rect.height - menuHeight);

    setContextMenu({
      x: Math.max(0, clampedX),
      y: Math.max(0, clampedY),
      targetItem: null
    });
  };

  const handleOpenItem = (item) => {
    setContextMenu(null);
    if (item.isDir) {
      navigate(item.path);
    } else {
      addAuditLog('EXPLORER_FILE_OPEN', `Opened file ${item.path}`);
      const notepadConfig = APP_REGISTRY.find(a => a.id === 'notepad');
      if (notepadConfig) {
        openWindow(notepadConfig, {
          initialPath: item.path,
          initialContent: virtualFS[item.path]
        });
      }
    }
  };

  // Filter entries based on Search Query recursively
  const entries = getEntries(cwd);
  const filteredEntries = searchQuery.trim()
    ? (() => {
        const query = searchQuery.toLowerCase();
        const results = [];
        const seenPaths = new Set();
        const prefix = cwd === '/' ? '/' : cwd + '/';

        Object.keys(virtualFS).forEach(path => {
          if (!path.startsWith(prefix)) return;
          const rel = path.slice(prefix.length);
          const parts = rel.split('/');

          let currentPath = prefix;
          parts.forEach((part, idx) => {
            if (part === '.keep') return;
            const pathNode = idx === 0 ? prefix + part : currentPath + '/' + part;
            currentPath = pathNode;

            if (part.toLowerCase().includes(query) && !seenPaths.has(pathNode)) {
              seenPaths.add(pathNode);
              const isDir = idx < parts.length - 1 || !virtualFS[pathNode];
              results.push({ name: part, path: pathNode, isDir });
            }
          });
        });

        // Sort results
        results.sort((a, b) => {
          if (a.isDir && !b.isDir) return -1;
          if (!a.isDir && b.isDir) return 1;
          return a.name.localeCompare(b.name);
        });

        return results;
      })()
    : entries;

  return (
    <div className="file-explorer-app" ref={containerRef}>
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

        {/* Address Breadcrumb */}
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

        {/* Search Input */}
        <div className="fe-search-container">
          <Search size={13} className="fe-search-icon" />
          <input
            className="fe-search-input"
            placeholder="Search current folder…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ flex: 1 }} />
        
        {/* Upload File Input Button */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileUpload}
          multiple
        />
        
        <button className="fe-btn" onClick={() => fileInputRef.current?.click()} title="Upload Local File">
          <Upload size={14} /> Upload
        </button>
        <button className="fe-btn" onClick={() => setCreating('file')} title="New File">
          <Plus size={15} /> File
        </button>
        <button className="fe-btn" onClick={() => setCreating('folder')} title="New Folder">
          <FolderPlus size={15} /> Folder
        </button>
      </div>

      {/* Main body area with drag over listeners */}
      <div 
        className="fe-body"
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onContextMenu={handleGridContextMenu}
      >
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

        {/* Grid viewport */}
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
            {filteredEntries.length === 0 && (
              <div className="fe-empty">
                {searchQuery.trim() ? 'No files match search query' : 'This folder is empty'}
              </div>
            )}
            {filteredEntries.map(entry => (
              <div
                key={entry.path}
                className={`fe-item ${selected === entry.path ? 'selected' : ''}`}
                onClick={() => setSelected(entry.path)}
                onDoubleClick={() => handleOpenItem(entry)}
                onContextMenu={(e) => handleItemContextMenu(e, entry)}
              >
                {entry.isDir
                  ? <Folder size={36} color="#F8D775" fill="#F8D775" />
                  : <span className="fe-file-icon">{getIcon(entry.name)}</span>
                }
                
                {renaming === entry.path ? (
                  <input
                    autoFocus
                    className="fe-rename-input"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={e => {
                      if (e.key === 'Enter') commitRename();
                      if (e.key === 'Escape') setRenaming(null);
                    }}
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <span className="fe-item-name">{entry.name}</span>
                )}
              </div>
            ))}
          </div>

          {/* Drag & Drop Upload Overlay */}
          {isDragging && (
            <div className="fe-drag-overlay">
              <UploadCloud size={48} className="fe-drag-icon" />
              <p>Drop files here to upload to Browser OS VFS</p>
            </div>
          )}

          {/* Status bar (visible for both files and folders, download only for files) */}
          {selected && (
            <div className="fe-statusbar">
              <span>{selected.split('/').pop()}</span>
              <div className="fe-actions">
                {virtualFS[selected] !== undefined && (
                  <button onClick={() => downloadFile(selected)}>
                    <Download size={13} /> Download
                  </button>
                )}
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

      {/* Floating Custom Grid Context Menu */}
      {contextMenu && (
        <div
          className="fe-context-menu glass-panel-dark"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={e => e.stopPropagation()}
        >
          {contextMenu.targetItem ? (
            <>
              <button className="fe-ctx-item" onClick={() => handleOpenItem(contextMenu.targetItem)}>
                <FolderOpen className="fe-ctx-icon" size={14} /> Open
              </button>
              <div className="ctx-separator" />
              <button className="fe-ctx-item" onClick={() => { copyFile(contextMenu.targetItem.path); setContextMenu(null); addNotification('Copied to clipboard'); }}>
                <Copy className="fe-ctx-icon" size={14} /> Copy
              </button>
              <button className="fe-ctx-item" onClick={() => { cutFile(contextMenu.targetItem.path); setContextMenu(null); addNotification('Cut to clipboard'); }}>
                <Scissors className="fe-ctx-icon" size={14} /> Cut
              </button>
              <button className="fe-ctx-item" onClick={() => { setRenaming(contextMenu.targetItem.path); setNewName(contextMenu.targetItem.name); setContextMenu(null); }}>
                <Edit className="fe-ctx-icon" size={14} /> Rename
              </button>
              <div className="ctx-separator" />
              <button className="fe-ctx-item" onClick={() => downloadFile(contextMenu.targetItem.path)}>
                <Download className="fe-ctx-icon" size={14} /> Download
              </button>
              <button className="fe-ctx-item danger" onClick={() => {
                deleteFile(contextMenu.targetItem.path);
                setContextMenu(null);
                addNotification(`Deleted: ${contextMenu.targetItem.name}`);
              }}>
                <Trash2 className="fe-ctx-icon" size={14} /> Delete
              </button>
            </>
          ) : (
            <>
              <button className="fe-ctx-item" onClick={() => { setCreating('file'); setContextMenu(null); }}>
                <Plus className="fe-ctx-icon" size={14} /> New File
              </button>
              <button className="fe-ctx-item" onClick={() => { setCreating('folder'); setContextMenu(null); }}>
                <FolderPlus className="fe-ctx-icon" size={14} /> New Folder
              </button>
              <div className="ctx-separator" />
              <button 
                className="fe-ctx-item" 
                onClick={() => { pasteFile(cwd); setContextMenu(null); addNotification('Pasted item'); }}
                disabled={!clipboard.action || !clipboard.path}
              >
                <Clipboard className="fe-ctx-icon" size={14} /> Paste
              </button>
              <button className="fe-ctx-item" onClick={() => { setContextMenu(null); addNotification('Folder refreshed'); }}>
                <RefreshCw className="fe-ctx-icon" size={14} /> Refresh
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default FileExplorerApp;
