import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { LayoutGrid, Wifi, Volume2, Battery, Bell } from 'lucide-react';
import StartMenu from './StartMenu';
import './Taskbar.css';

const Taskbar = ({ openApps, focusedApp, onAppClick, onOpenApp }) => {
  const [time, setTime] = useState(new Date());
  const [showStartMenu, setShowStartMenu] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const startRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close start menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (startRef.current && !startRef.current.contains(e.target)) {
        setShowStartMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDate = time.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <>
      <div className="taskbar glass-panel-dark">
        <div className="taskbar-left" />

        <div className="taskbar-center">
          {/* Start button */}
          <div ref={startRef} style={{ position: 'relative' }}>
            <button
              id="start-btn"
              className={`taskbar-icon start-icon ${showStartMenu ? 'active' : ''}`}
              onClick={() => setShowStartMenu(prev => !prev)}
              title="Start"
            >
              <LayoutGrid color="#0067C0" fill="#0067C0" size={22} />
            </button>

            <AnimatePresence>
              {showStartMenu && (
                <StartMenu
                  onClose={() => setShowStartMenu(false)}
                  openApps={openApps}
                  onOpenApp={(id) => { onOpenApp(id); setShowStartMenu(false); }}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Open app buttons */}
          {openApps.map(app => (
            <button
              key={app.id}
              className={`taskbar-icon ${focusedApp === app.id ? 'active' : 'open'}`}
              onClick={() => {
                onAppClick(app.id);
                setShowStartMenu(false);
              }}
              title={app.title}
            >
              <div className="taskbar-icon-img">{app.icon}</div>
              <div className={`indicator ${focusedApp === app.id ? 'indicator-active' : ''}`} />
            </button>
          ))}
        </div>

        <div className="taskbar-right">
          {/* System tray */}
          <div className="system-tray">
            <div className="tray-icon"><Wifi size={14} /></div>
            <div className="tray-icon"><Volume2 size={14} /></div>
            <div className="tray-icon"><Battery size={14} /></div>
            <div
              className="tray-icon"
              onClick={() => setShowNotifPanel(prev => !prev)}
              title="Notifications"
            >
              <Bell size={14} />
            </div>
          </div>

          <div className="taskbar-divider" />

          {/* Clock */}
          <div className="time-date">
            <span className="time">{formattedTime}</span>
            <span className="date">{formattedDate}</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Taskbar;
