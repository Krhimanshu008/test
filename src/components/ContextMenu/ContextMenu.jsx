import React, { useEffect, useRef } from 'react';
import { Palette, RefreshCw, FolderPlus, Info, Terminal } from 'lucide-react';
import useOsStore, { WALLPAPER_THEMES } from '../../store/osStore';
import './ContextMenu.css';

const ContextMenu = ({ x, y, onClose, onOpenApp }) => {
  const ref = useRef(null);
  const setWallpaperTheme = useOsStore(s => s.setWallpaperTheme);
  const wallpaperTheme = useOsStore(s => s.wallpaperTheme);
  const addNotification = useOsStore(s => s.addNotification);
  const interactiveWallpaper = useOsStore(s => s.interactiveWallpaper);
  const setInteractiveWallpaper = useOsStore(s => s.setInteractiveWallpaper);

  // Clamp to screen
  const clampedX = Math.min(x, window.innerWidth - 240);
  const clampedY = Math.min(y, window.innerHeight - 280);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const cycleWallpaper = () => {
    const keys = Object.keys(WALLPAPER_THEMES);
    const idx = keys.indexOf(wallpaperTheme);
    const next = keys[(idx + 1) % keys.length];
    setWallpaperTheme(next);
    document.body.setAttribute('data-theme', next);
    addNotification(`Wallpaper: ${WALLPAPER_THEMES[next].name}`);
    onClose();
  };

  const items = [
    {
      label: 'Change Wallpaper',
      icon: <Palette size={14} />,
      onClick: cycleWallpaper,
    },
    {
      label: 'Open Settings',
      icon: null,
      onClick: () => { onOpenApp('settings'); onClose(); },
    }
  ];

  const themeDef = WALLPAPER_THEMES[wallpaperTheme];
  if (themeDef?.type === '3d_card') {
    items.splice(2, 0, {
      label: interactiveWallpaper ? 'Disable 3D Interaction' : 'Enable 3D Interaction',
      icon: null,
      onClick: () => { 
        setInteractiveWallpaper(!interactiveWallpaper);
        addNotification(`3D Interaction ${!interactiveWallpaper ? 'Enabled' : 'Disabled'}`);
        onClose(); 
      },
    });
  }

  items.push(
    { separator: true },
    {
      label: 'Open Terminal',
      icon: <Terminal size={14} />,
      onClick: () => { onOpenApp('terminal'); onClose(); },
    },
    { separator: true },
    {
      label: 'Refresh Desktop',
      icon: <RefreshCw size={14} />,
      onClick: () => { addNotification('Desktop refreshed'); onClose(); },
    }
  );

  return (
    <div
      ref={ref}
      className="context-menu glass-panel-dark"
      style={{ left: clampedX, top: clampedY }}
    >
      {items.map((item, i) =>
        item.separator
          ? <div key={i} className="ctx-separator" />
          : (
            <button key={i} className="ctx-item" onClick={item.onClick}>
              <span className="ctx-icon">{item.icon}</span>
              {item.label}
            </button>
          )
      )}
    </div>
  );
};

export default ContextMenu;
