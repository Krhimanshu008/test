import React, { useState, useRef } from 'react';
import { Rnd } from 'react-rnd';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Square, X, Copy } from 'lucide-react';
import useOsStore from '../../store/osStore';
import './WindowContainer.css';

const WindowContainer = ({ app, isFocused, isMinimized, onFocus, onClose, onMinimize, zIndex, children }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const rndRef = useRef(null);
  const osScale = useOsStore(s => s.osScale);
  const isTaskbarLocked = useOsStore(s => s.isTaskbarLocked);

  const initialWidth = Math.min(860, window.innerWidth * 0.85);
  const initialHeight = Math.min(620, window.innerHeight * 0.85);
  
  const currentPosRef = useRef({ 
    x: Math.max(10, 80 + Math.random() * 50), 
    y: Math.max(10, 40 + Math.random() * 40), 
    width: initialWidth, 
    height: initialHeight 
  });
  const prevPosRef = useRef({ ...currentPosRef.current });

  const toggleMaximize = (e) => {
    if (e) e.stopPropagation();
    if (!rndRef.current) return;
    if (!isMaximized) {
      prevPosRef.current = { ...currentPosRef.current };
      // Take scale into account for maximization
      const scaleFactor = osScale / 100;
      const taskbarOffset = isTaskbarLocked ? 48 : 0;
      rndRef.current.updateSize({ width: window.innerWidth / scaleFactor, height: (window.innerHeight - taskbarOffset) / scaleFactor });
      rndRef.current.updatePosition({ x: 0, y: 0 });
    } else {
      rndRef.current.updateSize({ width: prevPosRef.current.width, height: prevPosRef.current.height });
      rndRef.current.updatePosition({ x: prevPosRef.current.x, y: prevPosRef.current.y });
    }
    setIsMaximized(!isMaximized);
  };

  React.useEffect(() => {
    if (isMaximized && rndRef.current) {
      const scaleFactor = osScale / 100;
      const taskbarOffset = isTaskbarLocked ? 48 : 0;
      rndRef.current.updateSize({ width: window.innerWidth / scaleFactor, height: (window.innerHeight - taskbarOffset) / scaleFactor });
      rndRef.current.updatePosition({ x: 0, y: 0 });
    }
  }, [isTaskbarLocked, isMaximized, osScale]);

  React.useEffect(() => {
    const handleResize = () => {
      if (isMaximized && rndRef.current) {
        const scaleFactor = osScale / 100;
        const taskbarOffset = isTaskbarLocked ? 48 : 0;
        rndRef.current.updateSize({ width: window.innerWidth / scaleFactor, height: (window.innerHeight - taskbarOffset) / scaleFactor });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMaximized, isTaskbarLocked, osScale]);


  return (
    <AnimatePresence>
      {!isMinimized && (
        <Rnd
          ref={rndRef}
          scale={osScale / 100}
          default={{
            x: currentPosRef.current.x,
            y: currentPosRef.current.y,
            width: currentPosRef.current.width,
            height: currentPosRef.current.height,
          }}
          onDragStop={(e, d) => {
            currentPosRef.current.x = d.x;
            currentPosRef.current.y = d.y;
          }}
          onResizeStop={(e, direction, ref, delta, position) => {
            currentPosRef.current.width = parseInt(ref.style.width, 10);
            currentPosRef.current.height = parseInt(ref.style.height, 10);
            currentPosRef.current.x = position.x;
            currentPosRef.current.y = position.y;
          }}
          disableDragging={isMaximized}
          enableResizing={isMaximized ? false : undefined}
          minWidth={320}
          minHeight={220}
          dragHandleClassName="window-titlebar"
          className={`window ${isFocused ? 'window-focused' : ''}`}
          style={{ zIndex: zIndex || 10 }}
          onMouseDown={onFocus}
        >
          <motion.div
            className="window-content glass-window"
            initial={{ scale: 0.93, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.93, opacity: 0, y: 10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {/* Title bar */}
            <div className="window-titlebar" onDoubleClick={toggleMaximize}>
              <div className="titlebar-left">
                <div className="titlebar-icon">{app.icon}</div>
                <span className="titlebar-title">{app.title}</span>
              </div>
              <div className="titlebar-controls">
                <button className="ctrl-btn ctrl-minimize" onClick={(e) => { e.stopPropagation(); onMinimize(); }} title="Minimize">
                  <Minus size={14} />
                </button>
                <button className="ctrl-btn ctrl-maximize" onClick={toggleMaximize} title={isMaximized ? 'Restore' : 'Maximize'}>
                  {isMaximized ? <Copy size={12} /> : <Square size={12} />}
                </button>
                <button className="ctrl-btn ctrl-close" onClick={onClose} title="Close">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="window-body">
              {children}
            </div>
          </motion.div>
        </Rnd>
      )}
    </AnimatePresence>
  );
};

export default WindowContainer;
