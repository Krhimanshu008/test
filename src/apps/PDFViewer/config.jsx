import React from 'react';
import { FileText } from 'lucide-react';
import Component from './index';

export const config = {
  id: 'resume',
  title: 'Resume PDF',
  icon: <FileText size={32} color="#e81123" />,
  component: <Component />
};
