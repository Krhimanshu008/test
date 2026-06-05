import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, X, Star, Globe } from 'lucide-react';
import './style.css';

const BOOKMARKS = [
  { label: 'Google', url: 'https://www.google.com/webhp?igu=1' },
  { label: 'Wikipedia', url: 'https://en.m.wikipedia.org/wiki/Main_Page' },
  { label: 'MDN Docs', url: 'https://developer.mozilla.org/en-US/' },
  { label: 'GitHub', url: 'https://github.com' },
  { label: 'YouTube', url: 'https://www.youtube.com' },
];

const BrowserApp = () => {
  const [url, setUrl] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [history, setHistory] = useState([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [error, setError] = useState('');
  const iframeRef = useRef(null);

  const navigate = (target) => {
    let finalUrl = target.trim();
    if (!finalUrl) return;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }
    setError('');
    setUrl(finalUrl);
    setInputUrl(finalUrl);
    const newHist = [...history.slice(0, histIdx + 1), finalUrl];
    setHistory(newHist);
    setHistIdx(newHist.length - 1);
  };

  const goBack = () => {
    if (histIdx > 0) { const ni = histIdx - 1; setHistIdx(ni); setUrl(history[ni]); setInputUrl(history[ni]); }
  };

  const goForward = () => {
    if (histIdx < history.length - 1) { const ni = histIdx + 1; setHistIdx(ni); setUrl(history[ni]); setInputUrl(history[ni]); }
  };

  const refresh = () => { if (url && iframeRef.current) iframeRef.current.src = url; };

  return (
    <div className="browser-app">
      {/* Address bar */}
      <div className="browser-toolbar">
        <button className="br-btn" onClick={goBack} disabled={histIdx <= 0}><ChevronLeft size={16} /></button>
        <button className="br-btn" onClick={goForward} disabled={histIdx >= history.length - 1}><ChevronRight size={16} /></button>
        <button className="br-btn" onClick={refresh}><RotateCcw size={14} /></button>

        <div className="br-addressbar">
          <Globe size={13} color={url ? '#0067c0' : '#aaa'} />
          <input
            className="br-input"
            value={inputUrl}
            onChange={e => setInputUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && navigate(inputUrl)}
            placeholder="Enter URL or search…"
          />
          {inputUrl && <button className="br-clear" onClick={() => setInputUrl('')}><X size={12} /></button>}
        </div>

        <button className="br-btn" onClick={() => navigate(inputUrl)}>
          Go
        </button>
      </div>

      {/* Bookmarks bar */}
      <div className="browser-bookmarks">
        {BOOKMARKS.map(b => (
          <button key={b.label} className="bm-item" onClick={() => navigate(b.url)}>
            <Star size={11} /> {b.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="browser-content">
        {!url ? (
          <div className="browser-newtab">
            <div className="newtab-logo">
              <Globe size={48} color="#0067c0" />
              <h2>Browser OS</h2>
              <p>Enter a URL above or choose a bookmark</p>
            </div>
            <div className="newtab-quicklinks">
              {BOOKMARKS.map(b => (
                <div key={b.label} className="quicklink" onClick={() => navigate(b.url)}>
                  <div className="ql-icon"><Globe size={20} color="#0067c0" /></div>
                  <span>{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={url}
            title="browser"
            className="browser-frame"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            onError={() => setError('Could not load this page. The site may block embedding.')}
          />
        )}
        {error && <div className="browser-error">{error}</div>}
      </div>
    </div>
  );
};

export default BrowserApp;
