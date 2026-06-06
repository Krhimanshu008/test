import React from 'react';
import { Bell, Trash2 } from 'lucide-react';
import useOsStore from '../../store/osStore';
import './ControlCenter.css';

const NotificationsPanel = ({ onClose }) => {
  const notificationHistory = useOsStore(s => s.notificationHistory);
  const clearNotificationHistory = useOsStore(s => s.clearNotificationHistory);

  return (
    <div className="notifications-panel glass-panel-dark" onClick={(e) => e.stopPropagation()}>
      <div className="np-header">
        <div className="np-title">
          <Bell size={16} /> Notifications
        </div>
        <button className="np-clear-btn" onClick={clearNotificationHistory} title="Clear all">
          <Trash2 size={14} /> Clear
        </button>
      </div>

      <div className="np-body">
        {notificationHistory.length === 0 ? (
          <div className="np-empty">No new notifications</div>
        ) : (
          <ul className="np-list">
            {notificationHistory.map((n, i) => (
              <li key={n.id + '-' + i} className="np-item">
                <div className="np-item-time">{new Date(n.time).toLocaleTimeString()}</div>
                <div className="np-item-msg">{n.msg}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationsPanel;
