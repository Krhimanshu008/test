import { useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import BootScreen from './components/BootScreen';
import Taskbar from './components/Taskbar/Taskbar';
import DesktopIcon from './components/Desktop/DesktopIcon';
import WindowContainer from './components/Window/WindowContainer';
import ContextMenu from './components/ContextMenu/ContextMenu';
import Wallpaper from './components/Desktop/Wallpaper';
import { useState } from 'react';

import useOsStore from './store/osStore';
import './App.css';

import { APP_REGISTRY } from './apps/registry';

// Desktop icons (subset shown on desktop)
const DESKTOP_APPS = ['about', 'projects', 'code', 'terminal', 'explorer', 'notepad',
                       'browser', 'resume', 'chess', 'sudoku', 'settings'];

function App() {
  const [isBooted, setIsBooted] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);

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

  useEffect(() => {
    // Only set CSS variable for scale. Let CSS handle the math.
    const scaleFactor = osScale / 100;
    document.documentElement.style.setProperty('--os-scale', scaleFactor);
    document.documentElement.style.zoom = ''; // Clear buggy zoom
  }, [osScale]);

  // Input trapping after boot
  useEffect(() => {
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

  const openApp = useCallback((id) => {
    const def = APP_REGISTRY.find(a => a.id === id);
    if (def) openWindow(def);
  }, [openWindow]);

  const handleDesktopRightClick = (e) => {
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleDesktopClick = () => {
    setContextMenu(null);
  };

  if (!isBooted) {
    return <BootScreen onBoot={() => setIsBooted(true)} />;
  }

  return (
    <div
      className="desktop"
      onClick={handleDesktopClick}
      onContextMenu={handleDesktopRightClick}
    >
      <Wallpaper />
      {/* Desktop icons */}
      <div className="desktop-icons">
        {APP_REGISTRY.filter(a => DESKTOP_APPS.includes(a.id)).map(app => (
          <DesktopIcon
            key={app.id}
            app={app}
            onDoubleClick={() => openApp(app.id)}
          />
        ))}
      </div>

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
