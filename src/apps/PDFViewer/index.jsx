import React from 'react';

const PDFViewerApp = () => {
  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#525659' }}>
      <iframe src="/Himanshu_CV.pdf" width="100%" height="100%" style={{ border: 'none' }} title="Resume" />
    </div>
  );
};

export default PDFViewerApp;
