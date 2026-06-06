import React from 'react';
import ReactPlayer from 'react-player';

const MediaPlayerApp = () => {
  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <ReactPlayer 
        url='https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4' 
        controls={true}
        width='100%'
        height='100%'
      />
    </div>
  );
};

export default MediaPlayerApp;
