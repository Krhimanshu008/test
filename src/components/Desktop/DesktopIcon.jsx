import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Edit2, Play } from 'lucide-react';
import useOsStore, { GRID_CONFIGS } from '../../store/osStore';
import './DesktopIcon.css';

const DesktopIcon = ({ app, onDoubleClick }) => {
  const position = useOsStore(s => s.iconPositions[app.id]) || { col: 0, row: 0 };
  const updatePosition = useOsStore(s => s.updateIconPosition);
  const iconSize = useOsStore(s => s.iconSize) || 'medium';
  const draggingIconId = useOsStore(s => s.draggingIconId);
  const setDraggingIconId = useOsStore(s => s.setDraggingIconId);
  const deleteFile = useOsStore(s => s.deleteFile);
  const virtualFS = useOsStore(s => s.virtualFS);
  const writeFile = useOsStore(s => s.writeFile);
  const addNotification = useOsStore(s => s.addNotification);
  
  const renamingIconId = useOsStore(s => s.renamingIconId);
  const setRenamingIconId = useOsStore(s => s.setRenamingIconId);
  const selectedIcons = useOsStore(s => s.selectedIcons);
  const setSelectedIcons = useOsStore(s => s.setSelectedIcons);
  const toggleIconSelection = useOsStore(s => s.toggleIconSelection);
  const selectRange = useOsStore(s => s.selectRange);
  
  const isRenaming = renamingIconId === app.id;
  const isSelected = selectedIcons.includes(app.id);
  const isDragging = draggingIconId === app.id;
  const [editName, setEditName] = useState(app.title);

  const [contextMenu, setContextMenu] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (isRenaming) setEditName(app.title);
  }, [isRenaming, app.title]);

  const handleRenameSubmit = () => {
    if (!isRenaming) return;
    const newName = editName.trim();
    if (newName && newName !== app.title) {
      const oldPath = app.path;
      const parentDir = oldPath.substring(0, oldPath.lastIndexOf('/'));
      const newPath = `${parentDir}/${newName}`;
      
      if (app.isDir) {
        writeFile(`${newPath}/.keep`, '');
        updatePosition(`vfs-${newPath}`, position.col, position.row);
        deleteFile(oldPath);
      } else {
        const content = virtualFS[oldPath];
        writeFile(newPath, content);
        updatePosition(`vfs-${newPath}`, position.col, position.row);
        deleteFile(oldPath);
      }
    } else {
      setEditName(app.title); // revert if empty
    }
    setRenamingIconId(null);
  };

  const config = GRID_CONFIGS[iconSize];
  const x = config.padding + position.col * config.cellWidth;
  const y = config.padding + position.row * config.cellHeight;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setContextMenu(null);
      }
    };
    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenu]);

  return (
    <motion.div 
      drag
      dragMomentum={false}
      animate={{ x, y }}
      onDragStart={() => setDraggingIconId(app.id)}
      onDragEnd={(e, info) => {
        setDraggingIconId(null);
        const targetX = x + info.offset.x;
        const targetY = y + info.offset.y;
        
        // Find closest grid column and row
        const snapCol = Math.max(0, Math.round((targetX - config.padding) / config.cellWidth));
        const snapRow = Math.max(0, Math.round((targetY - config.padding) / config.cellHeight));
        
        // Clamp to screen bounds
        const maxRows = Math.max(1, Math.floor((window.innerHeight - 80) / config.cellHeight));
        const maxCols = Math.max(1, Math.floor((window.innerWidth - config.padding) / config.cellWidth));
        const finalCol = Math.min(snapCol, maxCols - 1);
        const finalRow = Math.min(snapRow, maxRows - 1);

        const snapX = config.padding + finalCol * config.cellWidth;
        const snapY = config.padding + finalRow * config.cellHeight;
        
        // Collision check
        const positions = useOsStore.getState().iconPositions;
        let collisionId = null;
        for (const id in positions) {
          if (id !== app.id && positions[id].col === finalCol && positions[id].row === finalRow) {
            collisionId = id;
            break;
          }
        }

        if (collisionId) {
          // Swap places with the existing icon
          updatePosition(collisionId, position.col, position.row);
          updatePosition(app.id, finalCol, finalRow);
        } else {
          updatePosition(app.id, finalCol, finalRow);
        }
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        zIndex: contextMenu || isDragging ? 9999 : (isSelected ? 10 : 1) 
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: 40, y: 40 }); // Show menu relative to the icon
        if (!isSelected) {
          setSelectedIcons([app.id]);
        }
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (e.ctrlKey || e.metaKey) {
          toggleIconSelection(app.id);
        } else if (e.shiftKey) {
          selectRange(app.id);
        } else {
          setSelectedIcons([app.id]);
        }
      }}
    >
      <div className={`desktop-icon ${iconSize} ${isSelected ? 'selected' : ''}`} onDoubleClick={onDoubleClick}>
        <div className="icon-wrapper">
          {app.icon}
        </div>
        {isRenaming ? (
          <input 
            autoFocus
            className="icon-rename-input"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit();
              if (e.key === 'Escape') {
                setEditName(app.title);
                setRenamingIconId(null);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="icon-title" style={{ display: 'block' }}>{app.title}</span>
        )}
      </div>

      {contextMenu && (
        <div 
          ref={menuRef}
          className="context-menu glass-panel-dark" 
          style={{ position: 'absolute', left: contextMenu.x, top: contextMenu.y, zIndex: 100000 }}
          onMouseDown={(e) => e.stopPropagation()} // Prevent dragging when interacting with menu
        >
          <button className="ctx-item" onClick={(e) => { e.stopPropagation(); onDoubleClick(); setContextMenu(null); }}>
            <span className="ctx-icon"><Play size={14} /></span> Open
          </button>
          
          {app.isVFS && (
            <>
              <button className="ctx-item" onClick={(e) => { 
                e.stopPropagation();
                setContextMenu(null);
                setRenamingIconId(app.id);
              }}>
                <span className="ctx-icon"><Edit2 size={14} /></span> Rename
              </button>

              <button className="ctx-item" style={{ color: '#ff4d4d' }} onClick={(e) => { 
                e.stopPropagation(); 
                setContextMenu(null);
                deleteFile(app.path);
              }}>
                <span className="ctx-icon"><Trash2 size={14} /></span> Delete
              </button>
            </>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default DesktopIcon;
