import React, { useState, useEffect } from 'react';
import { Save, Download, Trash2, FileText, AlignLeft } from 'lucide-react';
import useOsStore from '../../store/osStore';
import './style.css';

const NotepadApp = ({ initialPath, initialContent }) => {
  const virtualFS = useOsStore(s => s.virtualFS);
  const writeFile = useOsStore(s => s.writeFile);
  const addNotification = useOsStore(s => s.addNotification);
  const addAuditLog = useOsStore(s => s.addAuditLog);

  const [filename, setFilename] = useState(initialPath?.split('/').pop() || 'untitled.txt');
  const [content, setContent] = useState(initialContent ?? virtualFS[initialPath] ?? '');
  const [saved, setSaved] = useState(true);
  const [wordWrap, setWordWrap] = useState(true);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const lineCount = content.split('\n').length;

  const save = () => {
    const path = '/home/user/' + filename;
    writeFile(path, content);
    addAuditLog('NOTEPAD_SAVE', `Saved file ${path}`);
    setSaved(true);
    addNotification(`Saved: ${filename}`);
  };

  const download = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    addNotification(`Downloaded: ${filename}`);
  };

  return (
    <div className="notepad-app">
      <div className="notepad-toolbar">
        <div className="notepad-filename">
          <FileText size={14} />
          <input
            className="filename-input"
            value={filename}
            onChange={e => { setFilename(e.target.value); setSaved(false); }}
          />
          {!saved && <span className="unsaved-dot" title="Unsaved changes" />}
        </div>

        <div style={{ flex: 1 }} />

        <button
          className={`np-btn ${wordWrap ? 'active' : ''}`}
          onClick={() => setWordWrap(!wordWrap)}
          title="Toggle Word Wrap"
        >
          <AlignLeft size={13} /> Wrap
        </button>
        <button className="np-btn" onClick={save} title="Save (Ctrl+S)">
          <Save size={13} /> Save
        </button>
        <button className="np-btn" onClick={download} title="Download">
          <Download size={13} />
        </button>
      </div>

      <textarea
        className="notepad-body"
        value={content}
        onChange={e => { setContent(e.target.value); setSaved(false); }}
        spellCheck={true}
        style={{ whiteSpace: wordWrap ? 'pre-wrap' : 'pre' }}
        placeholder="Start typing…"
      />

      <div className="notepad-statusbar">
        <span>Line {lineCount}</span>
        <span>{charCount} chars</span>
        <span>{wordCount} words</span>
        <span style={{ flex: 1 }} />
        <span>{saved ? '✓ Saved' : '● Unsaved'}</span>
      </div>
    </div>
  );
};

export default NotepadApp;
