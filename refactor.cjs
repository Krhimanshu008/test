const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const appsDir = path.join(srcDir, 'apps');
const oldAppsDir = path.join(srcDir, 'components', 'Apps');

if (!fs.existsSync(appsDir)) fs.mkdirSync(appsDir);

const appsInfo = [
  { id: 'about',       name: 'AboutMe', title: 'About Me',       icon: '<User size={32} color="#0067C0" />', lucideIcon: 'User' },
  { id: 'projects',    name: 'Projects', title: 'Projects',        icon: '<Folder size={32} color="#F8D775" fill="#F8D775" />', lucideIcon: 'Folder' },
  { id: 'code',        name: 'CodeEditorApp', title: 'Code Editor',     icon: '<Code2 size={32} color="#569cd6" />', lucideIcon: 'Code2' },
  { id: 'terminal',    name: 'TerminalApp', title: 'Terminal',         icon: '<Terminal size={32} color="#4ec9b0" />', lucideIcon: 'Terminal' },
  { id: 'explorer',    name: 'FileExplorerApp', title: 'File Explorer',   icon: '<FolderOpen size={32} color="#F8D775" fill="#F8D775" />', lucideIcon: 'FolderOpen' },
  { id: 'notepad',     name: 'NotepadApp', title: 'Notepad',         icon: '<Pencil size={32} color="#febb08" />', lucideIcon: 'Pencil' },
  { id: 'browser',     name: 'BrowserApp', title: 'Browser',         icon: '<Globe size={32} color="#0097b2" />', lucideIcon: 'Globe' },
  { id: 'resume',      name: 'PDFViewerApp', title: 'Resume PDF',      icon: '<FileText size={32} color="#e81123" />', lucideIcon: 'FileText' },
  { id: 'imageviewer', name: 'ImageViewerApp', title: 'Image Viewer',    icon: '<ImageIcon size={32} color="#00a4ef" />', lucideIcon: 'Image as ImageIcon' },
  { id: 'mediaplayer', name: 'MediaPlayerApp', title: 'VLC Media Player',icon: '<Video size={32} color="#ff8c00" />', lucideIcon: 'Video' },
  { id: 'chess',       name: 'ChessApp', title: 'Chess',           icon: '<Target size={32} color="#444" />', lucideIcon: 'Target' },
  { id: 'sudoku',      name: 'SudokuApp', title: 'Sudoku',          icon: '<Grid size={32} color="#7fba00" />', lucideIcon: 'Grid' },
  { id: 'settings',    name: 'SettingsApp', title: 'Settings',        icon: '<Settings size={32} color="#757575" />', lucideIcon: 'Settings' },
];

let registryImports = "import React from 'react';\n";
let registryArray = "export const APP_REGISTRY = [\n";

for (const app of appsInfo) {
  const folderName = app.name.replace(/App$/, ''); // e.g. SettingsApp -> Settings
  const appFolder = path.join(appsDir, folderName);
  if (!fs.existsSync(appFolder)) fs.mkdirSync(appFolder);

  // Move JSX
  const oldJsxPath = path.join(oldAppsDir, app.name + '.jsx');
  const newJsxPath = path.join(appFolder, 'index.jsx');
  if (fs.existsSync(oldJsxPath)) {
    fs.renameSync(oldJsxPath, newJsxPath);
  } else {
    fs.writeFileSync(newJsxPath, `import React from 'react';\nexport default function ${app.name}() { return <div>${app.title}</div>; }\n`);
  }

  // Move CSS if exists
  const oldCssPath = path.join(oldAppsDir, app.name + '.css');
  const newCssPath = path.join(appFolder, 'style.css');
  if (fs.existsSync(oldCssPath)) {
    fs.renameSync(oldCssPath, newCssPath);
    // Replace css import in JSX
    let jsxContent = fs.readFileSync(newJsxPath, 'utf8');
    jsxContent = jsxContent.replace(new RegExp(`import\\s+['"]./${app.name}.css['"];?`), `import './style.css';`);
    fs.writeFileSync(newJsxPath, jsxContent);
  }

  // Generate config.js
  const configContent = `import React from 'react';
import { ${app.lucideIcon} } from 'lucide-react';
import Component from './index';

export const config = {
  id: '${app.id}',
  title: '${app.title}',
  icon: ${app.icon},
  component: <Component />
};
`;
  fs.writeFileSync(path.join(appFolder, 'config.jsx'), configContent);

  // Add to registry
  registryImports += `import { config as ${folderName}Config } from './${folderName}/config';\n`;
  registryArray += `  ${folderName}Config,\n`;
}

registryArray += "];\n";

fs.writeFileSync(path.join(appsDir, 'registry.jsx'), registryImports + "\n" + registryArray);

console.log("Migration complete!");
