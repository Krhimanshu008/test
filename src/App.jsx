import { useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import BootScreen from './components/BootScreen';
import Taskbar from './components/Taskbar/Taskbar';
import DesktopIcon from './components/Desktop/DesktopIcon';
import WindowContainer from './components/Window/WindowContainer';
import ContextMenu from './components/ContextMenu/ContextMenu';
import Wallpaper from './components/Desktop/Wallpaper';
import { useState } from 'react';

import useOsStore, { GRID_CONFIGS } from './store/osStore';
import './App.css';

import { APP_REGISTRY, DESKTOP_APPS } from './apps/registry';
import { Folder, FileText } from 'lucide-react';

function App() {
  const [isBooted, setIsBooted] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [gridDim, setGridDim] = useState({ cols: 0, rows: 0 });
  const [selectionBox, setSelectionBox] = useState(null);

  const openWindows  = useOsStore(s => s.openWindows);
  const focusedWindowId = useOsStore(s => s.focusedWindowId);
  const openWindow   = useOsStore(s => s.openWindow);
  const closeWindow  = useOsStore(s => s.closeWindow);
  const minimizeWindow = useOsStore(s => s.minimizeWindow);
  const focusWindow  = useOsStore(s => s.focusWindow);
  const notifications = useOsStore(s => s.notifications);
  const dismissNotification = useOsStore(s => s.dismissNotification);
  const isShuttingDown = useOsStore(s => s.isShuttingDown);
  const wallpaperTheme = useOsStore(s => s.wallpaperTheme);
  const osScale = useOsStore(s => s.osScale);
  const draggingIconId = useOsStore(s => s.draggingIconId);
  const iconSize = useOsStore(s => s.iconSize || 'medium');
  const virtualFS = useOsStore(s => s.virtualFS);
  const addAuditLog = useOsStore(s => s.addAuditLog);
  const clearIconSelection = useOsStore(s => s.clearIconSelection);
  const setSelectedIcons = useOsStore(s => s.setSelectedIcons);

  const getDesktopVFSItems = useCallback(() => {
    const items = [];
    const seen = new Set();
    Object.keys(virtualFS).forEach(path => {
      if (!path.startsWith('/Desktop/')) return;
      const rel = path.slice('/Desktop/'.length);
      const parts = rel.split('/');
      if (parts[0] === '.keep') return;
      
      if (parts.length === 1) {
        items.push({
          id: `vfs-${path}`,
          title: parts[0],
          icon: <FileText size={32} color="#ffffff" />,
          isVFS: true,
          path: path,
          isDir: false
        });
      } else {
        if (!seen.has(parts[0])) {
          seen.add(parts[0]);
          items.push({
            id: `vfs-/Desktop/${parts[0]}`,
            title: parts[0],
            icon: <Folder size={32} color="#F8D775" fill="#F8D775" />,
            isVFS: true,
            path: `/Desktop/${parts[0]}`,
            isDir: true
          });
        }
      }
    });
    return items;
  }, [virtualFS]);

  const allDesktopItems = [
    ...APP_REGISTRY.filter(a => DESKTOP_APPS.includes(a.id)),
    ...getDesktopVFSItems()
  ];

  useEffect(() => {
    const config = GRID_CONFIGS[iconSize];
    const updateGrid = () => {
      const maxRows = Math.max(1, Math.floor((window.innerHeight - 80) / config.cellHeight));
      const maxCols = Math.max(1, Math.floor((window.innerWidth - config.padding) / config.cellWidth));
      setGridDim({ cols: maxCols, rows: maxRows });
    };
    updateGrid();
    window.addEventListener('resize', updateGrid);
    return () => window.removeEventListener('resize', updateGrid);
  }, [iconSize]);

  useEffect(() => {
    // Only set CSS variable for scale. Let CSS handle the math.
    const scaleFactor = osScale / 100;
    document.documentElement.style.setProperty('--os-scale', scaleFactor);
    document.documentElement.style.zoom = ''; // Clear buggy zoom
  }, [osScale]);

  // Initial setup and input trapping
  useEffect(() => {
    // Auto arrange icons on load
    useOsStore.getState().arrangeIcons(allDesktopItems.map(a => a.id));

    if (!isBooted) return;
    const handleContextMenu = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      if (
        (e.ctrlKey && e.key === 's') ||
        (e.ctrlKey && e.key === 'p') ||
        e.key === 'F5' ||
        (e.ctrlKey && e.key === 'r')
      ) e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isBooted]);

  // Handle auto-close on shutdown
  useEffect(() => {
    if (isShuttingDown) {
      const timer = setTimeout(() => {
        // Attempt to close the browser tab.
        // Note: Browsers usually block this unless the tab was opened by a script.
        try {
          window.close();
        } catch (e) {
          console.log("Browser prevented window.close()");
        }
        
        // Fallback: Complete black screen (monitor off)
        document.body.innerHTML = '';
        document.body.style.backgroundColor = 'black';
      }, 2500); // Wait 2.5 seconds for the shutdown animation to play out
      return () => clearTimeout(timer);
    }
  }, [isShuttingDown]);

  const openApp = useCallback((id) => {
    const def = APP_REGISTRY.find(a => a.id === id);
    if (def) openWindow(def);
  }, [openWindow]);

  const handleDesktopRightClick = (e) => {
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleBootComplete = () => {
    setIsBooted(true);
    addAuditLog('SYSTEM_BOOT', 'Browser OS successfully booted');
  };

  const handleDesktopMouseDown = (e) => {
    if (
      e.target.closest('.desktop-icon') || 
      e.target.closest('.window') || 
      e.target.closest('.taskbar') ||
      e.target.closest('.glass-panel-dark')
    ) {
      return;
    }

    clearIconSelection();
    setContextMenu(null);

    const state = useOsStore.getState();
    const isInteractiveCube = state.wallpaperTheme === 'live_3d_cube' && state.interactiveWallpaper;
    if (isInteractiveCube && e.target.closest('canvas')) {
      return;
    }

    setSelectionBox({ startX: e.clientX, startY: e.clientY, endX: e.clientX, endY: e.clientY });
  };

  const handleDesktopMouseMove = (e) => {
    if (selectionBox) {
      setSelectionBox(prev => ({ ...prev, endX: e.clientX, endY: e.clientY }));
    }
  };

  const handleDesktopMouseUp = (e) => {
    if (selectionBox) {
      const boxRect = {
        left: Math.min(selectionBox.startX, selectionBox.endX),
        top: Math.min(selectionBox.startY, selectionBox.endY),
        right: Math.max(selectionBox.startX, selectionBox.endX),
        bottom: Math.max(selectionBox.startY, selectionBox.endY)
      };

      const selected = [];
      const positions = useOsStore.getState().iconPositions;
      const config = GRID_CONFIGS[iconSize];
      
      allDesktopItems.forEach(app => {
         const pos = positions[app.id] || { col: 0, row: 0 };
         const iconLeft = config.padding + pos.col * config.cellWidth;
         const iconTop = config.padding + pos.row * config.cellHeight;
         const iconRight = iconLeft + config.cellWidth;
         const iconBottom = iconTop + config.cellHeight;
         
         const overlap = !(iconRight < boxRect.left || 
                           iconLeft > boxRect.right || 
                           iconBottom < boxRect.top || 
                           iconTop > boxRect.bottom);
         if (overlap) {
            selected.push(app.id);
         }
      });
      
      if (selected.length > 0) {
        setSelectedIcons(selected);
      }
      setSelectionBox(null);
    }
  };

  return (
    <div
      className="desktop"
      onMouseDown={handleDesktopMouseDown}
      onMouseMove={handleDesktopMouseMove}
      onMouseUp={handleDesktopMouseUp}
      onMouseLeave={handleDesktopMouseUp}
      onContextMenu={handleDesktopRightClick}
    >
      {/* Boot Screen Overlay */}
      <AnimatePresence>
        {!isBooted && (
          <BootScreen onBoot={handleBootComplete} />
        )}
      </AnimatePresence>

      <Wallpaper />

      <div className="desktop-icons">
        {allDesktopItems.map(app => (
          <DesktopIcon
            key={app.id}
            app={app}
            onDoubleClick={() => {
              if (app.isVFS) {
                if (app.isDir) {
                  const explorer = APP_REGISTRY.find(a => a.id === 'explorer');
                  if (explorer) openWindow(explorer, { initialPath: app.path });
                } else {
                  const notepad = APP_REGISTRY.find(a => a.id === 'notepad');
                  if (notepad) openWindow(notepad, { initialPath: app.path, initialContent: virtualFS[app.path] });
                }
              } else {
                openApp(app.id);
              }
            }}
          />
        ))}
      </div>

      {/* Selection Box */}
      {selectionBox && (
        <div
          className="desktop-selection-box"
          style={{
            left: Math.min(selectionBox.startX, selectionBox.endX),
            top: Math.min(selectionBox.startY, selectionBox.endY),
            width: Math.abs(selectionBox.endX - selectionBox.startX),
            height: Math.abs(selectionBox.endY - selectionBox.startY)
          }}
        />
      )}

      {/* Open windows */}
      {openWindows.map(win => (
        <WindowContainer
          key={win.id}
          app={win}
          isFocused={focusedWindowId === win.id}
          isMinimized={win.minimized}
          zIndex={win.zIndex}
          onFocus={() => focusWindow(win.id)}
          onClose={() => closeWindow(win.id)}
          onMinimize={() => minimizeWindow(win.id)}
        >
          {win.component}
        </WindowContainer>
      ))}

      {/* Taskbar */}
      <Taskbar
        openApps={openWindows}
        focusedApp={focusedWindowId}
        onAppClick={focusWindow}
        onOpenApp={openApp}
      />

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onOpenApp={openApp}
          desktopItemIds={allDesktopItems.map(a => a.id)}
        />
      )}

      {/* Notification Toasts */}
      <div className="notifications-container">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              className="notification-toast"
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 60 }}
              transition={{ duration: 0.22 }}
              onClick={() => dismissNotification(n.id)}
            >
              <div className="notif-icon" />
              <span>{n.msg}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Shutdown overlay */}
      <AnimatePresence>
        {isShuttingDown && (
          <motion.div
            className="shutdown-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="shutdown-logo">
              <div className="shutdown-tile shutdown-tile-1" />
              <div className="shutdown-tile shutdown-tile-2" />
              <div className="shutdown-tile shutdown-tile-3" />
              <div className="shutdown-tile shutdown-tile-4" />
            </div>
            <p className="shutdown-text">Shutting down…</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
