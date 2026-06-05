import React from 'react';
import { Folder, FileCode2 } from 'lucide-react';
import '../shared.css';

const Projects = () => {
  const projects = [
    { name: 'E-commerce Platform', type: 'folder' },
    { name: 'Weather Dashboard', type: 'folder' },
    { name: 'Portfolio_v1.html', type: 'file' },
    { name: 'TaskTracker.js', type: 'file' }
  ];

  return (
    <div className="app-content file-explorer">
      <div className="explorer-toolbar">
        <button>New</button>
        <button>Sort</button>
        <button>View</button>
      </div>
      <div className="explorer-grid">
        {projects.map((proj, idx) => (
          <div key={idx} className="explorer-item">
            {proj.type === 'folder' ? 
              <Folder size={48} color="#F8D775" fill="#F8D775" /> : 
              <FileCode2 size={48} color="#0067C0" />
            }
            <span>{proj.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Projects;
