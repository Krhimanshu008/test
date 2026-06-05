import React, { useState } from 'react';
import Viewer from 'react-viewer';

const ImageViewerApp = () => {
  const [visible, setVisible] = useState(true);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }}>
      <button onClick={() => setVisible(true)} style={{ padding: '10px 20px', cursor: 'pointer' }}>Open Image Viewer</button>
      <Viewer
        visible={visible}
        onClose={() => { setVisible(false); }}
        images={[{src: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=2000', alt: 'Programming Image'}]}
        container={null}
      />
    </div>
  );
};

export default ImageViewerApp;
