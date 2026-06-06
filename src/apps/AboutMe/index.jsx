import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Plus, Briefcase, GraduationCap, Code } from 'lucide-react';
import useOsStore from '../../store/osStore';
import './style.css';

const DEFAULT_TIMELINE = [
  {
    id: 1,
    year: 'Present',
    title: 'Tech & Automation Builder',
    desc: 'Building tools with Python, JS, RAG, and COMFYUI to automate repetitive parts of finance work.',
    category: 'Tech'
  },
  {
    id: 2,
    year: 'Present',
    title: 'Chartered Accountancy Journey',
    desc: 'Currently pursuing CA (Group 1 Cleared), mastering the intricacies of corporate finance and law.',
    category: 'Education'
  },
  {
    id: 3,
    year: 'Past 5 Years',
    title: 'Finance Professional',
    desc: 'Worked across CA firms and industry. Handled accounting, statutory/tax/bank audits, budgeting, MIS reporting, and cost analysis.',
    category: 'Work'
  }
];

const AboutMe = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ year: '', title: '', desc: '', category: 'Work' });
  
  const [timeline, setTimeline] = useState(DEFAULT_TIMELINE);
  const addNotification = useOsStore(s => s.addNotification);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('aboutMeTimeline');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Combine default with saved
        setTimeline([...parsed, ...DEFAULT_TIMELINE]);
      } catch (e) {
        console.error('Failed to parse timeline data', e);
      }
    }
  }, []);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === 'admin') {
      setIsAdmin(true);
      setShowPasswordModal(false);
      setPasswordInput('');
      addNotification('Admin Mode Unlocked');
    } else {
      addNotification('Incorrect Password!');
    }
  };

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!newEvent.year || !newEvent.title || !newEvent.desc) {
      addNotification('Please fill all fields');
      return;
    }

    const eventToSave = {
      ...newEvent,
      id: Date.now()
    };

    const updatedTimeline = [eventToSave, ...timeline];
    setTimeline(updatedTimeline);
    
    // Save custom events to localStorage (filtering out defaults)
    const customEvents = updatedTimeline.filter(item => !DEFAULT_TIMELINE.find(d => d.id === item.id));
    localStorage.setItem('aboutMeTimeline', JSON.stringify(customEvents));

    setShowAddModal(false);
    setNewEvent({ year: '', title: '', desc: '', category: 'Work' });
    addNotification('New milestone added!');
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'Work': return <Briefcase size={14} />;
      case 'Education': return <GraduationCap size={14} />;
      case 'Tech': return <Code size={14} />;
      default: return <Briefcase size={14} />;
    }
  };

  return (
    <div className="about-app">
      {/* Sidebar Profile */}
      <div className="about-sidebar glass-panel">
        <motion.div 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }} 
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="profile-pic"
        >
          H
        </motion.div>
        <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          Himanshu Kumar
        </motion.h2>
        <motion.p className="tagline" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          Finance Professional & Tech Enthusiast
        </motion.p>

        <motion.div className="skills-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <h3>Financial Skills</h3>
          <div className="skills-chips">
            <span className="skill-chip">Statutory & Tax Audits</span>
            <span className="skill-chip">GST & Income Tax</span>
            <span className="skill-chip">MIS Reporting</span>
            <span className="skill-chip">Corporate Law</span>
          </div>

          <h3 style={{ marginTop: '16px' }}>Tech Skills</h3>
          <div className="skills-chips">
            <span className="skill-chip">Python</span>
            <span className="skill-chip">JavaScript</span>
            <span className="skill-chip">SQL</span>
            <span className="skill-chip">RAG</span>
            <span className="skill-chip">COMFYUI</span>
          </div>
        </motion.div>

        {/* Admin Lock Button */}
        <button 
          className={`admin-lock-btn ${isAdmin ? 'unlocked' : ''}`} 
          onClick={() => isAdmin ? setIsAdmin(false) : setShowPasswordModal(true)}
          title={isAdmin ? "Lock Admin Mode" : "Unlock Admin Mode"}
        >
          {isAdmin ? <Unlock size={18} /> : <Lock size={18} />}
        </button>
      </div>

      {/* Main Timeline Content */}
      <div className="about-content">
        <div className="timeline-header">
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            My Journey
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            I'm a finance professional who genuinely enjoys the detail work — whether that's untangling a messy ledger, 
            navigating a statutory audit, or building a cleaner compliance process. Here is a timeline of my milestones.
          </motion.p>
        </div>

        {isAdmin && (
          <motion.button 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="add-event-btn"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={18} /> Add New Milestone
          </motion.button>
        )}

        <div className="timeline">
          {timeline.map((item, index) => (
            <motion.div 
              key={item.id}
              className="timeline-item"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <div className="timeline-dot" />
              <div className="timeline-card">
                <div className="timeline-year">
                  {getCategoryIcon(item.category)} {item.year}
                </div>
                <h3 className="timeline-title">{item.title}</h3>
                <p className="timeline-desc">{item.desc}</p>
                <span className="timeline-category">{item.category}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div 
            className="about-modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div className="about-modal glass-panel" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
              <h3>Enter Admin Password</h3>
              <form onSubmit={handlePasswordSubmit}>
                <input 
                  type="password" 
                  autoFocus
                  placeholder="Password" 
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                />
                <div className="about-modal-actions">
                  <button type="button" className="about-btn secondary" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                  <button type="submit" className="about-btn primary">Unlock</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Add Event Modal */}
        {showAddModal && (
          <motion.div 
            className="about-modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div className="about-modal glass-panel" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} style={{ width: '400px' }}>
              <h3>Add Timeline Milestone</h3>
              <form onSubmit={handleAddEvent}>
                <input 
                  type="text" placeholder="Year / Date (e.g. 2024)" required
                  value={newEvent.year} onChange={e => setNewEvent({...newEvent, year: e.target.value})}
                />
                <input 
                  type="text" placeholder="Title" required
                  value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                />
                <textarea 
                  placeholder="Description..." required
                  value={newEvent.desc} onChange={e => setNewEvent({...newEvent, desc: e.target.value})}
                />
                <select value={newEvent.category} onChange={e => setNewEvent({...newEvent, category: e.target.value})}>
                  <option value="Work">Work</option>
                  <option value="Education">Education</option>
                  <option value="Tech">Tech</option>
                </select>
                
                <div className="about-modal-actions">
                  <button type="button" className="about-btn secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="about-btn primary">Add Event</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AboutMe;
