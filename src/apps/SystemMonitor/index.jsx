import React, { useState, useMemo } from 'react';
import { Activity, List, HardDrive, Trash2, PieChart, ChevronDown, ChevronUp } from 'lucide-react';
import useOsStore from '../../store/osStore';
import './style.css';

const SystemMonitorApp = () => {
  const [activeTab, setActiveTab] = useState('logs');
  const virtualFS = useOsStore(s => s.virtualFS);
  const openWindows = useOsStore(s => s.openWindows);
  const closeWindow = useOsStore(s => s.closeWindow);

  const logs = useMemo(() => {
    const rawLogs = virtualFS['/var/log/syslog.log'] || '';
    return rawLogs.split('\n')
      .filter(line => line.startsWith('['))
      .reverse(); // Newest first
  }, [virtualFS['/var/log/syslog.log']]);

  const storageStats = useMemo(() => {
    let totalSize = 0;
    const fileCount = Object.keys(virtualFS).length;
    Object.values(virtualFS).forEach(content => {
      totalSize += new Blob([content]).size;
    });
    return {
      fileCount,
      totalSize: (totalSize / 1024).toFixed(2) // KB
    };
  }, [virtualFS]);

  const [expandedApp, setExpandedApp] = useState(null);

  const insights = useMemo(() => {
    const stats = {
      appLaunches: 0,
      browserNavs: 0,
      codeExecutions: 0,
      filesWritten: 0,
      filesDeleted: 0,
      terminalCmds: 0,
      notepadSaves: 0
    };
    
    // Detailed breakdown per app
    const appBreakdown = {
      Browser: [],
      Terminal: [],
      'Code Editor': [],
      'File Explorer': [],
      Notepad: [],
      System: [],
      Other: []
    };

    logs.forEach(log => {
      const match = log.match(/^\[(.*?)\] \[(.*?)\] (.*)$/);
      if (match) {
        const [, time, action, details] = match;
        const entry = { time, action, details };

        if (action === 'APP_OPENED') {
          stats.appLaunches++;
          // Extract app name if possible
          if (details.includes('sysmonitor')) appBreakdown['Other'].push({ ...entry, app: 'System Monitor' });
          else if (details.includes('settings')) appBreakdown['Other'].push({ ...entry, app: 'Settings' });
          else if (details.includes('browser')) appBreakdown['Browser'].push(entry);
          else if (details.includes('terminal')) appBreakdown['Terminal'].push(entry);
          else if (details.includes('code')) appBreakdown['Code Editor'].push(entry);
          else if (details.includes('explorer')) appBreakdown['File Explorer'].push(entry);
          else if (details.includes('notepad')) appBreakdown['Notepad'].push(entry);
          else appBreakdown['Other'].push(entry);
        }
        else if (action === 'BROWSER_NAVIGATE') { stats.browserNavs++; appBreakdown['Browser'].push(entry); }
        else if (action === 'CODE_RUN') { stats.codeExecutions++; appBreakdown['Code Editor'].push(entry); }
        else if (action === 'FILE_WRITE') { stats.filesWritten++; appBreakdown['System'].push(entry); }
        else if (action === 'FILE_DELETE') { stats.filesDeleted++; appBreakdown['System'].push(entry); }
        else if (action === 'TERMINAL_CMD') { stats.terminalCmds++; appBreakdown['Terminal'].push(entry); }
        else if (action === 'NOTEPAD_SAVE') { stats.notepadSaves++; appBreakdown['Notepad'].push(entry); }
        else if (action === 'EXPLORER_NAVIGATE' || action === 'EXPLORER_FILE_OPEN') { appBreakdown['File Explorer'].push(entry); }
        else if (action === 'SYSTEM_BOOT') { appBreakdown['System'].push(entry); }
      }
    });
    
    return { stats, appBreakdown };
  }, [logs]);

  return (
    <div className="sys-monitor-app">
      <div className="sys-sidebar">
        <button 
          className={`sys-tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          <PieChart size={16} /> App Insights
        </button>
        <button 
          className={`sys-tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          <List size={16} /> Audit Logs
        </button>
        <button 
          className={`sys-tab-btn ${activeTab === 'processes' ? 'active' : ''}`}
          onClick={() => setActiveTab('processes')}
        >
          <Activity size={16} /> Processes
        </button>
        <button 
          className={`sys-tab-btn ${activeTab === 'health' ? 'active' : ''}`}
          onClick={() => setActiveTab('health')}
        >
          <HardDrive size={16} /> Health & Storage
        </button>
      </div>

      <div className="sys-content">
        {activeTab === 'logs' && (
          <div className="sys-logs-panel">
            <h3>Event Audit Log</h3>
            <div className="logs-table-container">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr><td colSpan="3">No logs available</td></tr>
                  ) : logs.map((log, i) => {
                    // Parse log line: [Timestamp] [ACTION] Details...
                    const match = log.match(/^\[(.*?)\] \[(.*?)\] (.*)$/);
                    if (match) {
                      const [, time, action, details] = match;
                      return (
                        <tr key={i}>
                          <td>{new Date(time).toLocaleString()}</td>
                          <td><span className={`log-badge log-${action.toLowerCase()}`}>{action}</span></td>
                          <td>{details}</td>
                        </tr>
                      );
                    }
                    return <tr key={i}><td colSpan="3">{log}</td></tr>;
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'processes' && (
          <div className="sys-processes-panel">
            <h3>Running Processes</h3>
            <div className="process-list">
              {openWindows.length === 0 ? (
                <p>No applications currently running.</p>
              ) : (
                openWindows.map(win => (
                  <div key={win.id} className="process-item">
                    <div className="process-info">
                      <div className="process-icon">{win.icon}</div>
                      <span>{win.title}</span>
                    </div>
                    <button className="kill-btn" onClick={() => closeWindow(win.id)}>
                      <Trash2 size={14} /> End Task
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'health' && (
          <div className="sys-health-panel">
            <h3>System Health & Storage</h3>
            <div className="health-card">
              <h4>Virtual File System (VFS)</h4>
              <p>Total Files/Folders: <strong>{storageStats.fileCount}</strong></p>
              <p>Storage Used: <strong>{storageStats.totalSize} KB</strong></p>
              <div className="storage-bar">
                <div 
                  className="storage-fill" 
                  style={{ width: `${Math.min(100, (storageStats.fileCount / 200) * 100)}%` }} 
                />
              </div>
              <p className="health-hint">Limit is arbitrary, but excessive files may slow down persistence.</p>
            </div>

            <div className="health-card">
              <h4>Memory Estimate</h4>
              <p>Current Tab Memory: <strong>{(performance.memory?.usedJSHeapSize / 1024 / 1024 || 64).toFixed(0)} MB</strong></p>
              <div className="storage-bar">
                <div 
                  className="storage-fill mem-fill" 
                  style={{ width: `${Math.min(100, ((performance.memory?.usedJSHeapSize / 1024 / 1024 || 64) / 512) * 100)}%` }} 
                />
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'insights' && (
          <div className="sys-insights-panel">
            <h3>Application Insights & Usage</h3>
            <div className="insights-grid">
              <div className="insight-card">
                <div className="insight-val">{insights.stats.appLaunches}</div>
                <div className="insight-label">Apps Launched</div>
              </div>
              <div className="insight-card">
                <div className="insight-val">{insights.stats.browserNavs}</div>
                <div className="insight-label">Webpages Visited</div>
              </div>
              <div className="insight-card">
                <div className="insight-val">{insights.stats.codeExecutions}</div>
                <div className="insight-label">Code Runs (Dev)</div>
              </div>
              <div className="insight-card">
                <div className="insight-val">{insights.stats.terminalCmds}</div>
                <div className="insight-label">Terminal Commands</div>
              </div>
              <div className="insight-card">
                <div className="insight-val">{insights.stats.notepadSaves}</div>
                <div className="insight-label">Notepad Saves</div>
              </div>
              <div className="insight-card">
                <div className="insight-val">{insights.stats.filesWritten + insights.stats.filesDeleted}</div>
                <div className="insight-label">File Operations</div>
              </div>
            </div>
            
            <div className="app-breakdown-section" style={{ marginTop: '32px' }}>
              <h4 style={{ marginBottom: '16px', color: '#fff' }}>Detailed App Breakdown</h4>
              <div className="accordion-list">
                {Object.entries(insights.appBreakdown)
                  .filter(([appName, events]) => events.length > 0)
                  .map(([appName, events]) => (
                    <div key={appName} className={`accordion-item ${expandedApp === appName ? 'expanded' : ''}`}>
                      <div 
                        className="accordion-header" 
                        onClick={() => setExpandedApp(expandedApp === appName ? null : appName)}
                      >
                        <div className="acc-title">
                          <strong>{appName}</strong>
                          <span className="acc-badge">{events.length} actions</span>
                        </div>
                        {expandedApp === appName ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                      
                      {expandedApp === appName && (
                        <div className="accordion-body">
                          <ul className="detailed-events-list">
                            {events.map((ev, idx) => (
                              <li key={idx}>
                                <span className="ev-time">{new Date(ev.time).toLocaleTimeString()}</span>
                                <span className={`log-badge log-${ev.action.toLowerCase()}`}>{ev.action}</span>
                                <span className="ev-details">{ev.details}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemMonitorApp;
