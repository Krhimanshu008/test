import React from 'react';
import { Folder } from 'lucide-react';
import FileExplorerApp from '../FileExplorer/index';

export const config = {
  id: 'projects',
  title: 'Projects',
  icon: <Folder size={32} color="#F8D775" fill="#F8D775" />,
  component: <FileExplorerApp initialPath="/Desktop/Projects" />
};
