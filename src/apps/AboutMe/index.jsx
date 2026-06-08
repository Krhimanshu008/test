import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Plus, Briefcase, GraduationCap, Code } from 'lucide-react';
import useOsStore from '../../store/osStore';
import './style.css';

const DEFAULT_TIMELINE = [
  {
    id: 1,
    year: 'Oct 2025 - Present',
    title: 'Business Operations Specialist at Elcom Digital Solutions',
    desc: 'Overseeing full-cycle financial operations, monthly reconciliations, management reporting, and spearheading process automation initiatives.',
    category: 'Work'
  },
  {
    id: 2,
    year: 'Jul 2023 - Jul 2025',
    title: 'Senior Associate at Anjali Jain & Associates',
    desc: 'Managed statutory audits for 15+ corporate clients, conducted tax audits, prepared financial statements, and built internal control systems.',
    category: 'Work'
  },
  {
    id: 3,
    year: 'Oct 2022 - Jul 2023',
    title: 'Associate at Ram S Chopra & Associates',
    desc: 'Coordinated MCA filings and TDS returns for 20+ clients, conducted financial audits, and managed IP modifications.',
    category: 'Work'
  },
  {
    id: 4,
    year: 'Aug 2020 - Oct 2022',
    title: 'Junior Associate at Anjali Jain & Associates',
    desc: 'Assisted in stock audits for high-profile clients, supported statutory audits, and managed bookkeeping responsibilities.',
    category: 'Work'
  },
  {
    id: 5,
    year: 'Present',
    title: 'Tech & Automation Builder',
    desc: 'Building tools with Python, JS, RAG, and COMFYUI to automate repetitive parts of finance work.',
    category: 'Tech'
  },
  {
    id: 6,
    year: 'In Progress',
    title: 'CA Intermediate — Group 1 Cleared',
    desc: 'Institute of Chartered Accountants of India (ICAI)',
    category: 'Education'
  },
  {
    id: 7,
    year: '2022',
    title: 'Bachelor of Commerce (B.Com)',
    desc: 'CCS University, India',
    category: 'Education'
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
            <span className="skill-chip">Budgeting & MIS</span>
            <span className="skill-chip">Corporate & MCA Compliance</span>
            <span className="skill-chip">IP Rights</span>
            <span className="skill-chip">Tally/Zoho/Xero</span>
          </div>

          <h3 style={{ marginTop: '16px' }}>Tech Skills</h3>
          <div className="skills-chips">
            <span className="skill-chip">Python</span>
            <span className="skill-chip">JavaScript</span>
            <span className="skill-chip">HTML/CSS</span>
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
            navigating a statutory audit, or building a cleaner compliance process. With 5+ years across CA firms and 
            industry, I've worked across accounting, auditing, taxation, budgeting, MIS reporting, and cost analysis. 
            I'm currently pursuing CA and have a parallel interest in tech — I build tools to automate the repetitive parts of finance work.
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
