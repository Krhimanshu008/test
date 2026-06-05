import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Power } from 'lucide-react';
import useOsStore from '../../store/osStore';
import { APP_REGISTRY } from '../../apps/registry';
import './StartMenu.css';

const StartMenu = ({ onClose, onOpenApp }) => {
  const [query, setQuery] = useState('');
  const triggerShutdown = useOsStore(s => s.triggerShutdown);

  const filtered = query.trim()
    ? APP_REGISTRY.filter(a => a.title.toLowerCase().includes(query.toLowerCase()))
    : APP_REGISTRY;

  const handlePower = () => {
    onClose();
    triggerShutdown();
  };

  return (
    <motion.div
      className="start-menu glass-panel-dark"
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.97 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      {/* Search */}
      <div className="sm-search">
        <Search size={14} color="rgba(255,255,255,0.5)" />
        <input
          autoFocus
          type="text"
          placeholder="Type to search apps…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {/* Pinned / search results */}
      <div className="sm-section-title">{query ? 'Search Results' : 'All Apps'}</div>

      <div className="sm-apps-grid">
        {filtered.map(app => (
          <button key={app.id} className="sm-app-item" onClick={() => onOpenApp(app.id)}>
            <div className="sm-app-icon">{React.cloneElement(app.icon, { size: 24 })}</div>
            <span className="sm-app-label">{app.title}</span>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="sm-no-results">No apps found for "{query}"</p>
        )}
      </div>

      {/* Footer */}
      <div className="sm-footer">
        <div className="sm-user">
          <div className="sm-avatar">H</div>
          <span>Himanshu Kumar</span>
        </div>
        <button className="sm-power" onClick={handlePower} title="Shutdown">
          <Power size={16} />
        </button>
      </div>
    </motion.div>
  );
};

export default StartMenu;
