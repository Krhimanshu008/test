import React from 'react';
import './DesktopIcon.css';

const DesktopIcon = ({ app, onDoubleClick }) => {
  return (
    <div className="desktop-icon" onDoubleClick={onDoubleClick}>
      <div className="icon-wrapper">
        {app.icon}
      </div>
      <span className="icon-title">{app.title}</span>
    </div>
  );
};

export default DesktopIcon;
