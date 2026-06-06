import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Volume2, VolumeX, BatteryFull, BatteryMedium, BatteryLow, Moon, Sun, Settings } from 'lucide-react';
import useOsStore from '../../store/osStore';
import './ControlCenter.css';

const ControlCenter = ({ onClose }) => {
  const volume = useOsStore(s => s.volume);
  const setVolume = useOsStore(s => s.setVolume);
  const wifiEnabled = useOsStore(s => s.wifiEnabled);
  const setWifiEnabled = useOsStore(s => s.setWifiEnabled);
  
  const [batteryLevel, setBatteryLevel] = useState(85);
  const [isCharging, setIsCharging] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    let bat;
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        bat = battery;
        const updateBattery = () => {
          setBatteryLevel(Math.round(battery.level * 100));
          setIsCharging(battery.charging);
        };
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      }).catch(() => {});
    }
    return () => {
      if (bat) {
        bat.removeEventListener('levelchange', () => {});
        bat.removeEventListener('chargingchange', () => {});
      }
    };
  }, []);

  return (
    <div className="control-center glass-panel-dark" onClick={(e) => e.stopPropagation()}>
      <div className="cc-grid">
        <button 
          className={`cc-tile ${wifiEnabled ? 'active' : ''}`} 
          onClick={() => setWifiEnabled(!wifiEnabled)}
        >
          {wifiEnabled ? <Wifi size={20} /> : <WifiOff size={20} />}
          <span>{wifiEnabled ? 'BrowserOS Net' : 'Wi-Fi Off'}</span>
        </button>
        <button 
          className={`cc-tile ${darkMode ? 'active' : ''}`}
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? <Moon size={20} /> : <Sun size={20} />}
          <span>{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
        </button>
      </div>

      <div className="cc-slider-container">
        {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
        <input 
          type="range" 
          min="0" max="100" 
          value={volume} 
          onChange={(e) => setVolume(parseInt(e.target.value))}
          className="cc-slider"
        />
        <span className="cc-val">{volume}%</span>
      </div>

      <div className="cc-footer">
        <div className="cc-battery">
          {batteryLevel > 70 ? <BatteryFull size={16} /> : batteryLevel > 30 ? <BatteryMedium size={16} /> : <BatteryLow size={16} />}
          <span>{batteryLevel}% {isCharging ? '(Charging)' : ''}</span>
        </div>
        <button className="cc-settings-btn" title="Settings">
          <Settings size={16} />
        </button>
      </div>
    </div>
  );
};

export default ControlCenter;
