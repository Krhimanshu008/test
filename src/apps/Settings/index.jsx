import React from 'react';
import { Monitor, Palette, Volume2, Info, Cpu, Globe, Box } from 'lucide-react';
import useOsStore, { WALLPAPER_THEMES } from '../../store/osStore';
import './style.css';

const ACCENT_COLORS = [
  { name: 'Windows Blue', value: '#0078d4' },
  { name: 'Purple', value: '#7b29f4' },
  { name: 'Teal', value: '#0097b2' },
  { name: 'Green', value: '#107c10' },
  { name: 'Red', value: '#c42b1c' },
  { name: 'Gold', value: '#f8a000' },
];

const Section = ({ icon: Icon, title, children }) => (
  <div className="settings-section">
    <div className="settings-section-header">
      <Icon size={16} />
      <h3>{title}</h3>
    </div>
    <div className="settings-section-body">{children}</div>
  </div>
);

const SettingsApp = () => {
  const wallpaperTheme = useOsStore(s => s.wallpaperTheme);
  const setWallpaperTheme = useOsStore(s => s.setWallpaperTheme);
  const addNotification = useOsStore(s => s.addNotification);
  const osScale = useOsStore(s => s.osScale);
  const setOsScale = useOsStore(s => s.setOsScale);
  const interactiveWallpaper = useOsStore(s => s.interactiveWallpaper);
  const setInteractiveWallpaper = useOsStore(s => s.setInteractiveWallpaper);
  const iconSize = useOsStore(s => s.iconSize || 'medium');
  const setIconSize = useOsStore(s => s.setIconSize);

  const applyTheme = (key) => {
    setWallpaperTheme(key);
    addNotification(`Wallpaper changed to "${WALLPAPER_THEMES[key].name}"`);
  };

  return (
    <div className="settings-app">
      {/* Sidebar nav */}
      <div className="settings-sidebar">
        <div className="settings-avatar">H</div>
        <p className="settings-username">Himanshu Kumar</p>
        {[
          { icon: Palette, label: 'Personalization' },
          { icon: Monitor, label: 'Display' },
          { icon: Volume2, label: 'Sound' },
          { icon: Globe, label: 'System' },
          { icon: Info, label: 'About' },
        ].map(item => (
          <div key={item.label} className="settings-nav-item">
            <item.icon size={16} />
            {item.label}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="settings-content">
        <h2 className="settings-page-title">Settings</h2>

        <Section icon={Palette} title="Personalization — Wallpaper">
          <p className="settings-desc">Choose an animated wallpaper theme for your desktop.</p>
          <div className="wallpaper-grid">
            {Object.entries(WALLPAPER_THEMES).map(([key, theme]) => (
              <div
                key={key}
                className={`wallpaper-swatch ${wallpaperTheme === key ? 'active' : ''}`}
                style={{ 
                  background: theme.type === 'gradient' 
                    ? theme.value 
                    : 'linear-gradient(135deg, #2a2a35, #111)' 
                }}
                onClick={() => applyTheme(key)}
                title={theme.name}
              >
                {theme.type === '3d_card' && (
                  <div style={{ position: 'absolute', top: '10px', left: '10px', color: 'rgba(255,255,255,0.5)' }}>
                    <Box size={24} />
                  </div>
                )}
                <span className="swatch-label">{theme.name}</span>
                {wallpaperTheme === key && <span className="swatch-check">✓</span>}
              </div>
            ))}
          </div>
          {WALLPAPER_THEMES[wallpaperTheme]?.type === '3d_card' && (
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="checkbox" 
                id="interactive-toggle"
                checked={interactiveWallpaper}
                onChange={(e) => setInteractiveWallpaper(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="interactive-toggle" style={{ fontSize: '13px', color: '#333', cursor: 'pointer' }}>
                Enable 3D Interaction (Mouse Drag)
              </label>
            </div>
          )}
        </Section>

        <Section icon={Palette} title="Accent Color">
          <div className="accent-grid">
            {ACCENT_COLORS.map(c => (
              <div
                key={c.value}
                className="accent-dot"
                style={{ background: c.value }}
                title={c.name}
                onClick={() => {
                  document.documentElement.style.setProperty('--accent-color', c.value);
                  addNotification(`Accent color: ${c.name}`);
                }}
              />
            ))}
          </div>
        </Section>

        <Section icon={Monitor} title="Display Scaling">
          <p className="settings-desc">Adjust the size of apps, text, and other items on the screen.</p>
          <div className="scale-controls">
            <span className="scale-value">{osScale}%</span>
            <input 
              type="range" 
              min="50" 
              max="150" 
              step="10" 
              value={osScale} 
              onChange={(e) => setOsScale(Number(e.target.value))}
              className="scale-slider"
            />
            <button 
              className="scale-reset-btn" 
              onClick={() => setOsScale(100)}
            >
              Reset to 100%
            </button>
          </div>
        </Section>

        <Section icon={Monitor} title="Desktop Icons Size">
          <p className="settings-desc">Adjust the dimensions and container grid of your desktop icons.</p>
          <div className="icon-size-settings" style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            {['small', 'medium', 'large'].map(size => (
              <button
                key={size}
                className={`scale-reset-btn ${iconSize === size ? 'active' : ''}`}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: iconSize === size ? 'var(--accent-color, #0078d4)' : 'rgba(255,255,255,0.06)',
                  color: iconSize === size ? '#fff' : 'rgba(255,255,255,0.85)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  fontWeight: 500,
                  transition: 'background 0.15s, color 0.15s'
                }}
                onClick={() => {
                  setIconSize(size);
                  addNotification(`Desktop icons set to ${size} size`);
                }}
              >
                {size}
              </button>
            ))}
          </div>
        </Section>

        <Section icon={Cpu} title="System Information">
          <table className="sys-table">
            <tbody>
              {[
                ['OS Name', 'Browser OS 1.0'],
                ['Host', window.location.hostname || 'localhost'],
                ['Browser', navigator.userAgent.split(')')[0].split('(')[1] || 'Web Browser'],
                ['Platform', navigator.platform || 'Web'],
                ['Screen', `${screen.width} × ${screen.height}`],
                ['Window', `${window.innerWidth} × ${window.innerHeight}`],
                ['Language', navigator.language],
                ['Memory', `${(performance.memory?.usedJSHeapSize / 1024 / 1024 || 64).toFixed(1)} MB used`],
              ].map(([label, val]) => (
                <tr key={label}>
                  <td className="sys-label">{label}</td>
                  <td className="sys-value">{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section icon={Info} title="About Browser OS">
          <p className="settings-desc">
            A fully interactive browser-based OS built with <strong>React + Vite</strong>.<br />
            Features: Live Python sandbox (Pyodide), JS/CSS execution, Terminal, File Explorer, and more.
          </p>
          <p className="settings-desc" style={{ marginTop: 8 }}>
            Built by <strong>Himanshu Kumar</strong> · v1.0.0
          </p>
        </Section>
      </div>
    </div>
  );
};

export default SettingsApp;
