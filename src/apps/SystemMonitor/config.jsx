import React from 'react';
import { Activity } from 'lucide-react';
import SystemMonitorApp from './index';

export const config = {
  id: 'sysmonitor',
  title: 'System Monitor',
  icon: <Activity size={32} color="#ff5b5b" />,
  component: <SystemMonitorApp />
};
