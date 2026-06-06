import React from 'react';
import { create } from 'zustand';
import wallpaper1 from '../assets/Wallpaper-1.jpg';
import wallpaper2 from '../assets/5531.jpg';
import wallpaper3 from '../assets/g4au_t8ix_210816.jpg';

export const WALLPAPER_THEMES = {
  custom_1: {
    name: 'Custom Wallpaper 1',
    type: 'image',
    value: wallpaper1,
  },
  custom_2: {
    name: 'Custom Wallpaper 2',
    type: 'image',
    value: wallpaper2,
  },
  custom_3: {
    name: 'Custom Wallpaper 3',
    type: 'image',
    value: wallpaper3,
  },
  midnight: {
    name: 'Midnight Blue',
    type: 'gradient',
    value: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e, #1a0040)',
  },
  aurora: {
    name: 'Aurora',
    type: 'gradient',
    value: 'linear-gradient(135deg, #0d1b2a, #1b4332, #2d6a4f, #1a1a2e, #0d1b2a)',
  },
  sunset: {
    name: 'Sunset',
    type: 'gradient',
    value: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460, #533483, #1a1a2e)',
  },
  ocean: {
    name: 'Deep Ocean',
    type: 'gradient',
    value: 'linear-gradient(135deg, #000428, #004e92, #1a5276, #000428)',
  },
  forest: {
    name: 'Forest Night',
    type: 'gradient',
    value: 'linear-gradient(135deg, #0b0c10, #1f2833, #0b5e2e, #1f2833, #0b0c10)',
  },
  live_3d_cube: {
    name: '3D Interactive Cube',
    type: '3d_card',
    value: null,
  }
};

export const GRID_CONFIGS = {
  small: {
    padding: 12,
    cellWidth: 76,
    cellHeight: 80,
  },
  medium: {
    padding: 16,
    cellWidth: 90,
    cellHeight: 100,
  },
  large: {
    padding: 20,
    cellWidth: 110,
    cellHeight: 120,
  }
};

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const DEFAULT_FS = {
  '/home/user/hello.py': '# Welcome to the Code Editor!\nprint("Hello, World!")\n\nfor i in range(5):\n    print(f"Count: {i}")',
  '/home/user/style.css': '/* CSS Live Preview */\nbody {\n  background: linear-gradient(135deg, #667eea, #764ba2);\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  height: 100vh;\n  margin: 0;\n  font-family: Arial, sans-serif;\n}\n\nh1 {\n  color: white;\n  font-size: 3rem;\n  text-shadow: 0 2px 10px rgba(0,0,0,0.3);\n}',
  '/home/user/app.js': '// JavaScript Sandbox\nconst greet = (name) => `Hello, ${name}!`;\nconsole.log(greet("Browser OS"));\n\nconst nums = [1, 2, 3, 4, 5];\nconst squares = nums.map(n => n * n);\nconsole.log("Squares:", squares);',
  '/home/user/notes.txt': 'My Notes\n========\n\n- Build a browser OS\n- Add Python sandbox\n- Make it look stunning\n\nIdeas:\n- Add a music player\n- Custom wallpapers\n- Calculator app',
  '/Desktop/readme.txt': 'Welcome to Browser OS!\n\nDouble-click any icon on the desktop to open an app.\nRight-click the desktop for options.\n\nApps:\n- About Me\n- Projects\n- Code Editor (Python + JS + CSS)\n- Terminal\n- File Explorer\n- Notepad\n- Browser\n- Settings\n- Chess\n- Sudoku',
  '/Desktop/Projects/.keep': '',
  '/var/log/syslog.log': '--- Browser OS Event Audit Log ---\n',
};

const loadInitialState = () => {
  const now = Date.now();
  const defaultTimestamps = {};
  Object.keys(DEFAULT_FS).forEach(k => {
    defaultTimestamps[k] = now;
  });

  try {
    const raw = localStorage.getItem('browserOS_persisted_state');
    if (!raw) {
      return {
        virtualFS: DEFAULT_FS,
        fileTimestamps: defaultTimestamps,
        iconSize: 'medium',
        iconPositions: {},
        wallpaperTheme: 'custom_2',
      };
    }

    const parsed = JSON.parse(raw);

    // If inactive for > 7 days, wipe and reset everything
    if (parsed.lastActive && now - parsed.lastActive > SEVEN_DAYS_MS) {
      return {
        virtualFS: DEFAULT_FS,
        fileTimestamps: defaultTimestamps,
        iconSize: 'medium',
        iconPositions: {},
        wallpaperTheme: 'custom_2',
      };
    }

    // Clean files older than 7 days
    const cleanFS = { ...parsed.virtualFS };
    const cleanTimestamps = { ...parsed.fileTimestamps } || {};

    Object.keys(cleanFS).forEach(path => {
      const timestamp = cleanTimestamps[path];
      if (timestamp && now - timestamp > SEVEN_DAYS_MS) {
        delete cleanFS[path];
        delete cleanTimestamps[path];
      }
    });

    if (Object.keys(cleanFS).length === 0) {
      Object.assign(cleanFS, DEFAULT_FS);
      Object.keys(DEFAULT_FS).forEach(k => {
        cleanTimestamps[k] = now;
      });
    }

    return {
      virtualFS: cleanFS,
      fileTimestamps: cleanTimestamps,
      iconSize: parsed.iconSize || 'medium',
      iconPositions: parsed.iconPositions || {},
      wallpaperTheme: parsed.wallpaperTheme || 'custom_2',
    };
  } catch (e) {
    console.error('Failed to load persisted state:', e);
    return {
      virtualFS: DEFAULT_FS,
      fileTimestamps: defaultTimestamps,
      iconSize: 'medium',
      iconPositions: {},
      wallpaperTheme: 'custom_2',
    };
  }
};

const initialState = loadInitialState();

let zCounter = 200;

const useOsStore = create((set, get) => ({
  // Audit Log
  addAuditLog: (action, details) => {
    set(state => {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] [${action}] ${details}\n`;
      const currentLog = state.virtualFS['/var/log/syslog.log'] || '--- Browser OS Event Audit Log ---\n';
      return {
        virtualFS: { ...state.virtualFS, ['/var/log/syslog.log']: currentLog + logEntry },
        fileTimestamps: { ...state.fileTimestamps, ['/var/log/syslog.log']: Date.now() }
      };
    });
  },

  // Window management
  openWindows: [],
  focusedWindowId: null,

  openWindow: (appDef, customProps = {}) => {
    const { openWindows } = get();
    const existing = openWindows.find(w => w.id === appDef.id);
    zCounter++;

    let component = appDef.component;
    if (React.isValidElement(component)) {
      component = React.cloneElement(component, customProps);
    }

    if (existing) {
      set({
        openWindows: openWindows.map(w =>
          w.id === appDef.id ? { ...w, component, minimized: false, zIndex: zCounter } : w
        ),
        focusedWindowId: appDef.id,
      });
      get().addAuditLog('APP_FOCUSED', `App ${appDef.id} focused`);
    } else {
      set({
        openWindows: [...openWindows, { ...appDef, component, minimized: false, zIndex: zCounter }],
        focusedWindowId: appDef.id,
      });
      get().addAuditLog('APP_OPENED', `App ${appDef.id} launched`);
    }
  },

  closeWindow: (id) => {
    const { openWindows, focusedWindowId } = get();
    set({
      openWindows: openWindows.filter(w => w.id !== id),
      focusedWindowId: focusedWindowId === id ? null : focusedWindowId,
    });
  },

  minimizeWindow: (id) => {
    const { openWindows, focusedWindowId } = get();
    set({
      openWindows: openWindows.map(w =>
        w.id === id ? { ...w, minimized: true } : w
      ),
      focusedWindowId: focusedWindowId === id ? null : focusedWindowId,
    });
  },

  focusWindow: (id) => {
    const { openWindows } = get();
    zCounter++;
    set({
      openWindows: openWindows.map(w =>
        w.id === id ? { ...w, minimized: false, zIndex: zCounter } : w
      ),
      focusedWindowId: id,
    });
  },

  // Wallpaper
  wallpaperTheme: initialState.wallpaperTheme,
  setWallpaperTheme: (theme) => set({ wallpaperTheme: theme }),
  interactiveWallpaper: false,
  setInteractiveWallpaper: (val) => set({ interactiveWallpaper: val }),

  // Taskbar Auto-hide
  isTaskbarLocked: false,
  toggleTaskbarLock: () => set(state => ({ isTaskbarLocked: !state.isTaskbarLocked })),

  // Display Scale
  osScale: 100,
  setOsScale: (scale) => set({ osScale: scale }),

  // Desktop Icons
  iconSize: initialState.iconSize,
  setIconSize: (size) => set((state) => {
    const config = GRID_CONFIGS[size];
    const maxRows = Math.max(1, Math.floor((window.innerHeight - 80) / config.cellHeight));
    const maxCols = Math.max(1, Math.floor((window.innerWidth - config.padding) / config.cellWidth));

    const updatedPositions = { ...state.iconPositions };
    const newPositions = {};

    Object.entries(updatedPositions).forEach(([id, pos]) => {
      if (!pos) return;
      
      let col = Math.min(pos.col, maxCols - 1);
      let row = Math.min(pos.row, maxRows - 1);
      
      let tries = 0;
      while (
        Object.entries(newPositions).some(
          ([otherId, otherPos]) =>
            otherPos.col === col && otherPos.row === row
        ) && tries < 100
      ) {
        row++;
        if (row >= maxRows) {
          row = 0;
          col++;
        }
        tries++;
      }
      
      newPositions[id] = { col, row };
    });

    return { iconSize: size, iconPositions: newPositions };
  }),
  draggingIconId: null,
  setDraggingIconId: (id) => set({ draggingIconId: id }),
  renamingIconId: null,
  setRenamingIconId: (id) => set({ renamingIconId: id }),
  iconPositions: initialState.iconPositions,
  selectedIcons: [],
  lastSelectedIconId: null,
  setSelectedIcons: (ids) => set({ selectedIcons: ids, lastSelectedIconId: ids[ids.length - 1] || null }),
  toggleIconSelection: (id) => set(state => {
    if (state.selectedIcons.includes(id)) {
      return { selectedIcons: state.selectedIcons.filter(i => i !== id) };
    }
    return { selectedIcons: [...state.selectedIcons, id], lastSelectedIconId: id };
  }),
  selectRange: (endId) => set(state => {
    if (!state.lastSelectedIconId) return { selectedIcons: [endId], lastSelectedIconId: endId };
    
    // Sort all placed icons by column then row
    const sortedIds = Object.keys(state.iconPositions).sort((a, b) => {
      const posA = state.iconPositions[a];
      const posB = state.iconPositions[b];
      if (posA.col !== posB.col) return posA.col - posB.col;
      return posA.row - posB.row;
    });

    const startIndex = sortedIds.indexOf(state.lastSelectedIconId);
    const endIndex = sortedIds.indexOf(endId);

    if (startIndex === -1 || endIndex === -1) return { selectedIcons: [...state.selectedIcons, endId], lastSelectedIconId: endId };

    const min = Math.min(startIndex, endIndex);
    const max = Math.max(startIndex, endIndex);
    const rangeIds = sortedIds.slice(min, max + 1);
    
    // Combine with current selection (or replace, depending on standard OS behavior. Usually Shift+click replaces previous selection except the anchor, but let's just combine for simplicity or replace)
    // Actually, standard OS shift-click REPLACES the selection with the range, ignoring disjoint Ctrl selections.
    return { selectedIcons: rangeIds };
  }),
  clearIconSelection: () => set({ selectedIcons: [], lastSelectedIconId: null }),

  // Quick Settings State
  volume: 80,
  wifiEnabled: true,
  notificationHistory: [],

  arrangeIcons: (appIds) => set(state => {
    if (!appIds || !appIds.length) return { iconPositions: {} };
    const size = state.iconSize || 'medium';
    const config = GRID_CONFIGS[size];
    const positions = {};
    let col = 0;
    let row = 0;
    const maxRows = Math.max(1, Math.floor((window.innerHeight - 80) / config.cellHeight));
    appIds.forEach(id => {
      positions[id] = { col, row };
      row++;
      if (row >= maxRows) {
        row = 0;
        col++;
      }
    });
    return { iconPositions: positions };
  }),
  updateIconPosition: (id, col, row) => set(state => ({
    iconPositions: { ...state.iconPositions, [id]: { col, row } }
  })),

  getAvailableDesktopPosition: () => {
    const state = get();
    const config = GRID_CONFIGS[state.iconSize || 'medium'];
    const maxRows = Math.max(1, Math.floor((window.innerHeight - 80) / config.cellHeight));
    const maxCols = Math.max(1, Math.floor((window.innerWidth - config.padding) / config.cellWidth));
    
    let col = 0;
    let row = 0;
    
    while (col < maxCols) {
      const isOccupied = Object.values(state.iconPositions).some(pos => pos.col === col && pos.row === row);
      if (!isOccupied) return { col, row };
      
      row++;
      if (row >= maxRows) {
        row = 0;
        col++;
      }
    }
    return { col: 0, row: 0 };
  },

  // Notifications
  notifications: [],
  addNotification: (msg) => {
    const id = Date.now().toString();
    const notifObj = { id, msg, time: new Date() };
    set(state => ({
      notifications: [...state.notifications, notifObj],
      notificationHistory: [notifObj, ...state.notificationHistory].slice(0, 50) // Keep last 50
    }));
    setTimeout(() => {
      set(state => ({ notifications: state.notifications.filter(n => n.id !== id) }));
    }, 4000);
  },
  dismissNotification: (id) => set(state => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),

  setVolume: (vol) => set({ volume: vol }),
  setWifiEnabled: (enabled) => set({ wifiEnabled: enabled }),
  clearNotificationHistory: () => set({ notificationHistory: [] }),

  // Shutdown
  isShuttingDown: false,
  shutdown: () => set({ isShuttingDown: true }),
  triggerShutdown: () => set({ isShuttingDown: true }),
  cancelShutdown: () => set({ isShuttingDown: false }),

  // Virtual File System with Timestamps
  virtualFS: initialState.virtualFS,
  fileTimestamps: initialState.fileTimestamps,

  // Clipboard
  clipboard: { action: null, path: null },
  copyFile: (path) => set({ clipboard: { action: 'copy', path } }),
  cutFile: (path) => set({ clipboard: { action: 'cut', path } }),
  pasteFile: (destDir) => set(state => {
    const { action, path } = state.clipboard;
    if (!action || !path) return {};

    const fileName = path.split('/').pop();
    const destPath = destDir === '/' ? '/' + fileName : destDir + '/' + fileName;

    const newFS = { ...state.virtualFS };
    const newTimestamps = { ...state.fileTimestamps };

    if (action === 'copy') {
      const prefix = path + '/';
      const isDir = !state.virtualFS[path]; 

      if (isDir) {
        Object.keys(state.virtualFS).forEach(fPath => {
          if (fPath.startsWith(prefix)) {
            const subRel = fPath.slice(prefix.length);
            const subDest = destPath + '/' + subRel;
            newFS[subDest] = state.virtualFS[fPath];
            newTimestamps[subDest] = Date.now();
          }
        });
      } else {
        newFS[destPath] = state.virtualFS[path];
        newTimestamps[destPath] = Date.now();
      }
      return { virtualFS: newFS, fileTimestamps: newTimestamps };
    } else if (action === 'cut') {
      const prefix = path + '/';
      const isDir = !state.virtualFS[path];

      if (isDir) {
        Object.keys(state.virtualFS).forEach(fPath => {
          if (fPath.startsWith(prefix)) {
            const subRel = fPath.slice(prefix.length);
            const subDest = destPath + '/' + subRel;
            newFS[subDest] = state.virtualFS[fPath];
            newTimestamps[subDest] = Date.now();
            delete newFS[fPath];
            delete newTimestamps[fPath];
          }
        });
      } else {
        newFS[destPath] = state.virtualFS[path];
        newTimestamps[destPath] = Date.now();
        delete newFS[path];
        delete newTimestamps[path];
      }
      return { virtualFS: newFS, fileTimestamps: newTimestamps, clipboard: { action: null, path: null } };
    }
    return {};
  }),

  writeFile: (path, content) =>
    set(state => {
      if (path !== '/var/log/syslog.log') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [FILE_WRITE] Wrote file ${path}\n`;
        const currentLog = state.virtualFS['/var/log/syslog.log'] || '--- Browser OS Event Audit Log ---\n';
        return {
          virtualFS: { ...state.virtualFS, [path]: content, ['/var/log/syslog.log']: currentLog + logEntry },
          fileTimestamps: { ...state.fileTimestamps, [path]: Date.now(), ['/var/log/syslog.log']: Date.now() }
        };
      }
      return {
        virtualFS: { ...state.virtualFS, [path]: content },
        fileTimestamps: { ...state.fileTimestamps, [path]: Date.now() }
      };
    }),
  deleteFile: (path) =>
    set(state => {
      const newFS = { ...state.virtualFS };
      const newTimestamps = { ...state.fileTimestamps };
      const prefix = path + '/';
      
      let deletedCount = 0;
      Object.keys(newFS).forEach(k => {
        if (k.startsWith(prefix) || k === path) {
          delete newFS[k];
          delete newTimestamps[k];
          deletedCount++;
        }
      });

      if (deletedCount > 0) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [FILE_DELETE] Deleted path ${path} (${deletedCount} items)\n`;
        newFS['/var/log/syslog.log'] = (newFS['/var/log/syslog.log'] || '--- Browser OS Event Audit Log ---\n') + logEntry;
        newTimestamps['/var/log/syslog.log'] = Date.now();
      }

      return { virtualFS: newFS, fileTimestamps: newTimestamps };
    }),
}));

// Auto-persist changes to localStorage
useOsStore.subscribe((state) => {
  try {
    const dataToPersist = {
      virtualFS: state.virtualFS,
      fileTimestamps: state.fileTimestamps,
      iconSize: state.iconSize,
      iconPositions: state.iconPositions,
      wallpaperTheme: state.wallpaperTheme,
      lastActive: Date.now(),
    };
    localStorage.setItem('browserOS_persisted_state', JSON.stringify(dataToPersist));
  } catch (e) {
    console.error('Failed to save state to localStorage:', e);
  }
});

export default useOsStore;
