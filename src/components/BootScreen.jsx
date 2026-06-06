import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Wireframe } from '@react-three/drei';
import './BootScreen.css';

// ----------------------------------------------------------------------------
// CONFIGURATION
// You can change this URL to any image you want for the boot screen wallpaper
// ----------------------------------------------------------------------------
const BOOT_WALLPAPER_URL = 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2564&auto=format&fit=crop';

// A minimalist 3D geometric shape that slowly rotates
const Minimal3DShape = () => {
  const meshRef = useRef(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.5, 0]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.15} />
        {/* Adds a cool wireframe effect on top of the solid geometry */}
        <Wireframe stroke={"#ffffff"} thickness={0.02} fillMix={0} />
      </mesh>
    </Float>
  );
};

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
      style={{ backgroundImage: `url(${BOOT_WALLPAPER_URL})` }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
    >
      <div className="boot-overlay" />

      {/* 3D Background Element */}
      <div className="boot-canvas-container">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <ambientLight intensity={1} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} />
          <Minimal3DShape />
        </Canvas>
      </div>

      {/* Glass Content Card */}
      <motion.div 
        className="boot-content glass-card"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <h1 className="boot-title">Browser OS</h1>
        
        <p className="boot-subtitle">
          Click anywhere to start
        </p>

        {/* Minimalist pulsing indicator */}
        <div className="boot-pulse-container">
          <motion.div
            className="boot-pulse"
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BootScreen;
