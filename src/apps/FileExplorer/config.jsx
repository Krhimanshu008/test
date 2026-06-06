import React from 'react';
import { FolderOpen } from 'lucide-react';
import Component from './index';

export const config = {
  id: 'explorer',
  title: 'File Explorer',
  icon: <FolderOpen size={32} color="#F8D775" fill="#F8D775" />,
  component: <Component />
};
