import React, { useRef } from 'react';
import useOsStore, { WALLPAPER_THEMES } from '../../store/osStore';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, PresentationControls, ContactShadows } from '@react-three/drei';
import './Wallpaper.css';

const RotatingCube = () => {
  const meshRef = useRef();

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <boxGeometry args={[2, 2, 2]} />
      <meshPhysicalMaterial 
        color="#0067C0"
        metalness={0.8}
        roughness={0.2}
        clearcoat={1}
        clearcoatRoughness={0.1}
      />
    </mesh>
  );
};

const ThreeDCardWallpaper = () => {
  const isInteractive = useOsStore(s => s.interactiveWallpaper);

  return (
    <div className="wallpaper-3d-container">
      {/* Background Gradient for the 3D card wallpaper */}
      <div className="wallpaper-gradient" style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }} />
      
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <PresentationControls 
          enabled={isInteractive}
          global={true} 
          rotation={[0.13, 0.1, 0]} 
          polar={[-0.4, 0.2]} 
          azimuth={[-1, 0.75]} 
          config={{ mass: 2, tension: 400 }} 
          // Removed snap physics as it can cause sudden NaN scale glitches on click
        >
          <RotatingCube />
        </PresentationControls>

        <ContactShadows position={[0, -2.5, 0]} opacity={0.5} scale={20} blur={2} far={4} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
};

const Wallpaper = () => {
  const wallpaperTheme = useOsStore(s => s.wallpaperTheme);
  const themeDef = WALLPAPER_THEMES[wallpaperTheme] || WALLPAPER_THEMES.midnight;

  if (themeDef.type === '3d_card') {
    return (
      <div className="wallpaper-container">
        <ThreeDCardWallpaper />
      </div>
    );
  }

  if (themeDef.type === 'image') {
    return (
      <div className="wallpaper-container">
        <img src={themeDef.value} alt="Wallpaper" className="wallpaper-image" />
      </div>
    );
  }

  if (themeDef.type === 'video') {
    return (
      <div className="wallpaper-container">
        <video src={themeDef.value} autoPlay loop muted playsInline className="wallpaper-video" />
      </div>
    );
  }

  // Default: Gradient
  return (
    <div className="wallpaper-container">
      <div 
        className="wallpaper-gradient animated-gradient" 
        style={{ background: themeDef.value }}
      />
    </div>
  );
};

export default Wallpaper;
