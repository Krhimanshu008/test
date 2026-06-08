import React, { lazy } from 'react';
import { FileText } from 'lucide-react';
import Component from './index';

export const config = {
  id: 'resume',
  title: 'Himanshu_CV',
  icon: <FileText size={20} color="#ff4b4b" />,
  component: lazy(() => import('./index.jsx'))
};
