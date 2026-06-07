import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { LayoutGrid, Wifi, WifiOff, Volume2, VolumeX, Battery, Bell, Lock, Unlock } from 'lucide-react';
import StartMenu from './StartMenu';
import ControlCenter from './ControlCenter';
import NotificationsPanel from './NotificationsPanel';
import CalendarPanel from './CalendarPanel';
import useOsStore from '../../store/osStore';
import './Taskbar.css';

const Taskbar = ({ openApps, focusedApp, onAppClick, onOpenApp }) => {
  const [time, setTime] = useState(new Date());
  const [showStartMenu, setShowStartMenu] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showControlCenter, setShowControlCenter] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  const [isHovered, setIsHovered] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [isBooting, setIsBooting] = useState(true);

  const startRef = useRef(null);
  const taskbarRef = useRef(null);
  const contextMenuRef = useRef(null);

  const isTaskbarLocked = useOsStore(s => s.isTaskbarLocked);
  const toggleTaskbarLock = useOsStore(s => s.toggleTaskbarLock);
  const volume = useOsStore(s => s.volume);
  const wifiEnabled = useOsStore(s => s.wifiEnabled);
  const notificationHistory = useOsStore(s => s.notificationHistory);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsBooting(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  // Close start menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (startRef.current && !startRef.current.contains(e.target)) {
        setShowStartMenu(false);
      }
      if (
        contextMenu && 
        taskbarRef.current && 
        !taskbarRef.current.contains(e.target) &&
        (!contextMenuRef.current || !contextMenuRef.current.contains(e.target))
      ) {
        setContextMenu(null);
      }
      if (
        (showControlCenter || showNotifPanel || showCalendar) &&
        taskbarRef.current &&
        !taskbarRef.current.contains(e.target)
      ) {
        setShowControlCenter(false);
        setShowNotifPanel(false);
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [contextMenu]);

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const isVisible = isTaskbarLocked || isHovered || showStartMenu || contextMenu || showControlCenter || showNotifPanel || isBooting;

  const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDate = time.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <>
      <div 
        ref={taskbarRef}
        className={`taskbar glass-panel-dark ${!isVisible ? 'auto-hidden' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onContextMenu={handleContextMenu}
      >
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
            <div 
              className="tray-icon" 
              onClick={() => { setShowControlCenter(!showControlCenter); setShowNotifPanel(false); }}
              title="Network & Volume"
            >
              {wifiEnabled ? <Wifi size={14} /> : <WifiOff size={14} />}
            </div>
            <div 
              className="tray-icon"
              onClick={() => { setShowControlCenter(!showControlCenter); setShowNotifPanel(false); }}
              title={`Volume: ${volume}%`}
            >
              {volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </div>
            <div 
              className="tray-icon"
              onClick={() => { setShowControlCenter(!showControlCenter); setShowNotifPanel(false); }}
              title="Battery"
            >
              <Battery size={14} />
            </div>
            <div
              className={`tray-icon ${notificationHistory.length > 0 ? 'has-notifs' : ''}`}
              onClick={() => { setShowNotifPanel(!showNotifPanel); setShowControlCenter(false); }}
              title="Notifications"
            >
              <Bell size={14} />
            </div>
          </div>

          <div className="taskbar-divider" />

          {/* Clock */}
          <div 
            className="time-date" 
            onClick={() => { setShowCalendar(!showCalendar); setShowControlCenter(false); setShowNotifPanel(false); }}
            style={{ cursor: 'pointer' }}
          >
            <span className="time">{formattedTime}</span>
            <span className="date">{formattedDate}</span>
          </div>
        </div>
      </div>

      {/* Taskbar Context Menu */}
      {contextMenu && (
        <div 
          ref={contextMenuRef}
          className="taskbar-context-menu glass-panel-dark"
          style={{ 
            position: 'fixed', 
            left: Math.min(contextMenu.x, window.innerWidth - 180), 
            bottom: 54, 
            zIndex: 10000 
          }}
        >
          <button 
            className="ctx-item"
            onClick={() => {
              toggleTaskbarLock();
              setContextMenu(null);
            }}
          >
            <span className="ctx-icon">
              {isTaskbarLocked ? <Unlock size={14} /> : <Lock size={14} />}
            </span>
            {isTaskbarLocked ? 'Auto-hide Taskbar' : 'Lock Taskbar'}
          </button>
        </div>
      )}

      {/* Popups */}
      <AnimatePresence>
        {showControlCenter && (
          <ControlCenter onClose={() => setShowControlCenter(false)} />
        )}
        {showNotifPanel && (
          <NotificationsPanel onClose={() => setShowNotifPanel(false)} />
        )}
        {showCalendar && (
          <CalendarPanel onClose={() => setShowCalendar(false)} />
        )}
      </AnimatePresence>
    </>
  );
};

export default Taskbar;
