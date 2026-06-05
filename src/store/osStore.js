import { create } from 'zustand';
import wallpaper1 from '../assets/Wallpaper-1.jpg';

export const WALLPAPER_THEMES = {
  custom_1: {
    name: 'Custom Wallpaper',
    type: 'image',
    value: wallpaper1,
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

let zCounter = 200;

const useOsStore = create((set, get) => ({
  // Window management
  openWindows: [],
  focusedWindowId: null,

  openWindow: (appDef) => {
    const { openWindows } = get();
    const existing = openWindows.find(w => w.id === appDef.id);
    zCounter++;
    if (existing) {
      set({
        openWindows: openWindows.map(w =>
          w.id === appDef.id ? { ...w, minimized: false, zIndex: zCounter } : w
        ),
        focusedWindowId: appDef.id,
      });
    } else {
      set({
        openWindows: [...openWindows, { ...appDef, minimized: false, zIndex: zCounter }],
        focusedWindowId: appDef.id,
      });
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
  wallpaperTheme: 'custom_1',
  setWallpaperTheme: (theme) => set({ wallpaperTheme: theme }),
  interactiveWallpaper: false,
  setInteractiveWallpaper: (val) => set({ interactiveWallpaper: val }),

  // Display Scale
  osScale: 100,
  setOsScale: (scale) => set({ osScale: scale }),

  // Notifications
  notifications: [],
  addNotification: (msg) => {
    const id = Date.now();
    set(state => ({ notifications: [...state.notifications, { id, msg, visible: true }] }));
    setTimeout(() => {
      set(state => ({
        notifications: state.notifications.filter(n => n.id !== id),
      }));
    }, 3500);
  },
  dismissNotification: (id) =>
    set(state => ({ notifications: state.notifications.filter(n => n.id !== id) })),

  // Shutdown
  isShuttingDown: false,
  triggerShutdown: () => set({ isShuttingDown: true }),
  cancelShutdown: () => set({ isShuttingDown: false }),

  // Virtual File System (session-only in-memory)
  virtualFS: {
    '/home/user/hello.py': '# Welcome to the Code Editor!\nprint("Hello, World!")\n\nfor i in range(5):\n    print(f"Count: {i}")',
    '/home/user/style.css': '/* CSS Live Preview */\nbody {\n  background: linear-gradient(135deg, #667eea, #764ba2);\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  height: 100vh;\n  margin: 0;\n  font-family: Arial, sans-serif;\n}\n\nh1 {\n  color: white;\n  font-size: 3rem;\n  text-shadow: 0 2px 10px rgba(0,0,0,0.3);\n}',
    '/home/user/app.js': '// JavaScript Sandbox\nconst greet = (name) => `Hello, ${name}!`;\nconsole.log(greet("Browser OS"));\n\nconst nums = [1, 2, 3, 4, 5];\nconst squares = nums.map(n => n * n);\nconsole.log("Squares:", squares);',
    '/home/user/notes.txt': 'My Notes\n========\n\n- Build a browser OS\n- Add Python sandbox\n- Make it look stunning\n\nIdeas:\n- Add a music player\n- Custom wallpapers\n- Calculator app',
    '/Desktop/readme.txt': 'Welcome to Browser OS!\n\nDouble-click any icon on the desktop to open an app.\nRight-click the desktop for options.\n\nApps:\n- About Me\n- Projects\n- Code Editor (Python + JS + CSS)\n- Terminal\n- File Explorer\n- Notepad\n- Browser\n- Settings\n- Chess\n- Sudoku',
  },
  writeFile: (path, content) =>
    set(state => ({ virtualFS: { ...state.virtualFS, [path]: content } })),
  deleteFile: (path) =>
    set(state => {
      const newFS = { ...state.virtualFS };
      delete newFS[path];
      return { virtualFS: newFS };
    }),
}));

export default useOsStore;
