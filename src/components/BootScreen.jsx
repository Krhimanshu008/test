import React from 'react';
import { motion } from 'framer-motion';
import './BootScreen.css';

const BootScreen = ({ onBoot }) => {
  const handleBoot = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      console.log('Fullscreen denied:', e);
    }
    onBoot();
  };

  return (
    <motion.div 
      className="boot-screen" 
      onClick={handleBoot}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: "easeInOut" }}
    >
      <div className="boot-background-gradient" />

      {/* Modern Minimal Content */}
      <div className="boot-content">
        <motion.div 
          className="boot-logo-wrapper"
          initial={{ opacity: 0, scale: 0.8, x: "-50%", y: "-50%" }}
          animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          exit={{ 
            scale: 60, 
            opacity: 0, 
            x: "-50%", 
            y: "-50%",
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            transition: { duration: 1, ease: "easeInOut", delay: 0 }
          }}
        >
          <motion.div 
            className="boot-logo-dot"
            animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            exit={{ scale: 0, opacity: 0, transition: { duration: 0.5 } }}
          />
        </motion.div>

        <motion.div 
          className="boot-text-container"
          initial={{ opacity: 0, y: 10, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
          exit={{ 
            opacity: 0, 
            y: 10, 
            x: "-50%",
            scale: 0.9,
            transition: { duration: 0.5, ease: "easeOut", delay: 0 }
          }}
          style={{ top: 'calc(50% + 60px)' }}
        >
          <h1 className="boot-title">Web OS</h1>
          <motion.p 
            className="boot-subtitle"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            Click to start
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default BootScreen;
