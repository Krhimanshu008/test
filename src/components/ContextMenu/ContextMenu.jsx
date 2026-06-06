import React, { useEffect, useRef, useState } from 'react';
import { Palette, RefreshCw, FolderPlus, Info, Terminal, LayoutGrid, ChevronRight, Check } from 'lucide-react';
import useOsStore, { WALLPAPER_THEMES } from '../../store/osStore';
import { DESKTOP_APPS } from '../../apps/registry';
import './ContextMenu.css';

const ContextMenu = ({ x, y, onClose, onOpenApp, desktopItemIds }) => {
  const ref = useRef(null);
  const setWallpaperTheme = useOsStore(s => s.setWallpaperTheme);
  const wallpaperTheme = useOsStore(s => s.wallpaperTheme);
  const addNotification = useOsStore(s => s.addNotification);
  const interactiveWallpaper = useOsStore(s => s.interactiveWallpaper);
  const setInteractiveWallpaper = useOsStore(s => s.setInteractiveWallpaper);
  const arrangeIcons = useOsStore(s => s.arrangeIcons);
  const iconSize = useOsStore(s => s.iconSize || 'medium');
  const setIconSize = useOsStore(s => s.setIconSize);
  const virtualFS = useOsStore(s => s.virtualFS);
  const writeFile = useOsStore(s => s.writeFile);
  const getAvailableDesktopPosition = useOsStore(s => s.getAvailableDesktopPosition);
  const updateIconPosition = useOsStore(s => s.updateIconPosition);
  const setRenamingIconId = useOsStore(s => s.setRenamingIconId);

  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const timeoutRef = useRef(null);

  // Clamp to screen
  const clampedX = Math.min(x, window.innerWidth - 240);
  const clampedY = Math.min(y, window.innerHeight - 280);
  const isSubmenuLeft = clampedX + 210 + 180 > window.innerWidth;

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [onClose]);

  const handleMouseEnter = (submenuId) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (submenuId) {
      setActiveSubmenu(submenuId);
    } else {
      // When hovering a non-submenu item, wait a bit before closing the active submenu.
      // This allows diagonal mouse movement across other items.
      timeoutRef.current = setTimeout(() => {
        setActiveSubmenu(null);
      }, 350);
    }
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setActiveSubmenu(null);
    }, 350); // 350ms delay to make it very easy to move cursor to the submenu
  };

  const cycleWallpaper = () => {
    const keys = Object.keys(WALLPAPER_THEMES);
    const idx = keys.indexOf(wallpaperTheme);
    const next = keys[(idx + 1) % keys.length];
    setWallpaperTheme(next);
    document.body.setAttribute('data-theme', next);
    addNotification(`Wallpaper: ${WALLPAPER_THEMES[next].name}`);
    onClose();
  };

  const createNewFolder = () => {
    let baseName = 'New Folder';
    
    // Ensure unique name
    let finalName = baseName;
    let counter = 1;
    while (Object.keys(virtualFS).some(p => p.startsWith(`/Desktop/${finalName}/`) || p === `/Desktop/${finalName}`)) {
      finalName = `${baseName} (${counter})`;
      counter++;
    }
    
    const folderPath = `/Desktop/${finalName}`;
    writeFile(`${folderPath}/.keep`, '');
    
    const pos = getAvailableDesktopPosition();
    const newId = `vfs-${folderPath}`;
    updateIconPosition(newId, pos.col, pos.row);
    
    // Trigger inline rename
    setRenamingIconId(newId);
    
    onClose();
  };

  const items = [
    {
      label: 'View',
      icon: <LayoutGrid size={14} />,
      hasSubmenu: true,
      submenuId: 'view',
    },
    { separator: true },
    {
      label: 'New Folder',
      icon: <FolderPlus size={14} />,
      onClick: createNewFolder,
    },
    { separator: true },
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

  const viewSubmenuItems = [
    {
      label: 'Large icons',
      checked: iconSize === 'large',
      onClick: () => { setIconSize('large'); onClose(); }
    },
    {
      label: 'Medium icons',
      checked: iconSize === 'medium',
      onClick: () => { setIconSize('medium'); onClose(); }
    },
    {
      label: 'Small icons',
      checked: iconSize === 'small',
      onClick: () => { setIconSize('small'); onClose(); }
    },
    { separator: true },
    {
      label: 'Auto arrange icons',
      onClick: () => { arrangeIcons(desktopItemIds || DESKTOP_APPS); onClose(); }
    }
  ];

  return (
    <div
      ref={ref}
      className="context-menu glass-panel-dark"
      style={{ left: clampedX, top: clampedY }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {items.map((item, i) => {
        if (item.separator) {
          return <div key={i} className="ctx-separator" />;
        }

        if (item.hasSubmenu) {
          return (
            <div
              key={i}
              className="ctx-item-wrapper"
              onMouseEnter={() => handleMouseEnter(item.submenuId)}
              onMouseLeave={handleMouseLeave}
              style={{ position: 'relative' }}
            >
              <button className="ctx-item">
                <span className="ctx-icon">{item.icon}</span>
                <span>{item.label}</span>
                <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.6 }} />
              </button>

              {activeSubmenu === 'view' && (
                <div
                  className="context-menu submenu glass-panel-dark"
                  style={{
                    position: 'absolute',
                    left: isSubmenuLeft ? '-186px' : '202px',
                    top: '-6px',
                    minWidth: '180px',
                  }}
                  onMouseEnter={() => handleMouseEnter('view')}
                  onMouseLeave={handleMouseLeave}
                >
                  {viewSubmenuItems.map((subItem, si) =>
                    subItem.separator ? (
                      <div key={si} className="ctx-separator" />
                    ) : (
                      <button key={si} className="ctx-item" onClick={subItem.onClick}>
                        <span className="ctx-icon">
                          {subItem.checked && <Check size={14} />}
                        </span>
                        {subItem.label}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          );
        }

        return (
          <button
            key={i}
            className="ctx-item"
            onClick={item.onClick}
            onMouseEnter={() => handleMouseEnter(null)}
          >
            <span className="ctx-icon">{item.icon}</span>
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

export default ContextMenu;
