import React, { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { Play, Download, Trash2, ChevronDown, Code2, Terminal as TermIcon, Eye } from 'lucide-react';
import useOsStore from '../../store/osStore';
import './style.css';

const MonacoEditor = lazy(() => import('@monaco-editor/react'));

const LANGUAGES = [
  { id: 'python', label: 'Python', ext: '.py', mode: 'python' },
  { id: 'javascript', label: 'JavaScript', ext: '.js', mode: 'javascript' },
  { id: 'html', label: 'HTML', ext: '.html', mode: 'html' },
  { id: 'css', label: 'CSS', ext: '.css', mode: 'css' },
  { id: 'json', label: 'JSON', ext: '.json', mode: 'json' },
];

const DEFAULT_CODE = {
  python: `# Python Sandbox — powered by Pyodide (WebAssembly)\nprint("Hello from Browser OS!")\n\nfor i in range(1, 6):\n    print(f"  {i}. {'⭐' * i}")\n\nimport math\nprint(f"\\nπ ≈ {math.pi:.10f}")`,
  javascript: `// JavaScript Sandbox\nconst greet = (name) => \`Hello, \${name}!\`;\nconsole.log(greet("Browser OS"));\n\nconst fib = (n) => n <= 1 ? n : fib(n-1) + fib(n-2);\nconst fibs = Array.from({length: 8}, (_, i) => fib(i));\nconsole.log("Fibonacci:", fibs.join(", "));`,
  html: `<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body {\n      background: linear-gradient(135deg, #667eea, #764ba2);\n      display: flex; justify-content: center; align-items: center;\n      height: 100vh; margin: 0; font-family: Arial, sans-serif;\n    }\n    .card {\n      background: rgba(255,255,255,0.15);\n      backdrop-filter: blur(20px);\n      border: 1px solid rgba(255,255,255,0.3);\n      border-radius: 20px;\n      padding: 40px 60px;\n      text-align: center;\n      color: white;\n    }\n    h1 { font-size: 2.5rem; margin: 0 0 8px; }\n    p { opacity: 0.8; }\n  </style>\n</head>\n<body>\n  <div class="card">\n    <h1>🌐 Live Preview</h1>\n    <p>Edit the HTML and see it instantly!</p>\n  </div>\n</body>\n</html>`,
  css: `/* CSS Live Preview */\nbody {\n  background: conic-gradient(from 180deg at 50% 70%, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #ff6b6b);\n  min-height: 100vh;\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n  align-items: center;\n  font-family: 'Inter', sans-serif;\n  margin: 0;\n}\n\n.box {\n  background: rgba(255,255,255,0.2);\n  border-radius: 16px;\n  padding: 32px;\n  color: white;\n  font-size: 2rem;\n  font-weight: bold;\n  backdrop-filter: blur(10px);\n  border: 1px solid rgba(255,255,255,0.3);\n  animation: spin 3s linear infinite;\n}\n\n@keyframes spin {\n  from { transform: rotate(0deg) scale(1); }\n  50%  { transform: rotate(180deg) scale(1.1); }\n  to   { transform: rotate(360deg) scale(1); }\n}`,
  json: `{\n  "name": "Browser OS",\n  "version": "1.0.0",\n  "features": [\n    "Python sandbox (Pyodide)",\n    "JavaScript execution",\n    "HTML/CSS live preview",\n    "Terminal emulator",\n    "Virtual file system"\n  ],\n  "author": "Himanshu Kumar",\n  "stack": ["React", "Vite", "Three.js", "Monaco Editor"]\n}`,
};

const CSS_PREVIEW_HTML = (css) => `<!DOCTYPE html><html><head><style>${css}</style></head><body><div class="box">✨ CSS Live</div></body></html>`;

let pyodideInstance = null;
let pyodideLoading = false;

async function getPyodide(setStatus) {
  if (pyodideInstance) return pyodideInstance;
  if (pyodideLoading) {
    while (pyodideLoading) await new Promise(r => setTimeout(r, 100));
    return pyodideInstance;
  }
  pyodideLoading = true;
  setStatus('⚙️ Loading Python runtime (Pyodide ~10MB, first time only)…');
  try {
    const { loadPyodide } = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/pyodide/v0.27.5/full/pyodide.mjs');
    pyodideInstance = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.5/full/' });
    pyodideLoading = false;
    setStatus('✅ Python runtime ready!');
    return pyodideInstance;
  } catch (e) {
    pyodideLoading = false;
    throw e;
  }
}

const CodeEditorApp = () => {
  const [lang, setLang] = useState(LANGUAGES[0]);
  const [code, setCode] = useState(DEFAULT_CODE.python);
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('Ready');
  const [activePanel, setActivePanel] = useState('output'); // 'output' | 'preview'
  const [showLangMenu, setShowLangMenu] = useState(false);
  const iframeRef = useRef(null);
  const outputRef = useRef(null);
  const addNotification = useOsStore(s => s.addNotification);

  const switchLang = (l) => {
    setLang(l);
    setCode(DEFAULT_CODE[l.id]);
    setOutput('');
    setShowLangMenu(false);
    if (l.id === 'html' || l.id === 'css') setActivePanel('preview');
    else setActivePanel('output');
  };

  const runCode = async () => {
    setRunning(true);
    setOutput('');
    const isPreview = lang.id === 'html' || lang.id === 'css';
    if (isPreview) setActivePanel('preview');
    else setActivePanel('output');

    try {
      if (lang.id === 'python') {
        const py = await getPyodide(setStatus);
        setStatus('▶ Running Python…');
        const captured = [];
        py.setStdout({ batched: (s) => captured.push(s) });
        py.setStderr({ batched: (s) => captured.push('⚠️ ' + s) });
        
        // Override input() to throw a clear error since custom UI blocking is impossible on main thread
        await py.runPythonAsync(`
import builtins
import js

def _browser_input(prompt_text=""):
    raise Exception(
        "\\n========================================\\n"
        "❌ INTERACTIVE INPUT NOT SUPPORTED\\n"
        "========================================\\n"
        "In this Browser OS environment, we cannot pause the execution \\n"
        "to show a custom UI input box without freezing the entire OS.\\n"
        "The native browser prompt() breaks the OS illusion, so it is disabled.\\n\\n"
        "👉 Solution: Please use hardcoded variables in your code instead of input().\\n"
        "========================================"
    )
builtins.input = _browser_input
`);
        const result = await py.runPythonAsync(code);
        if (result !== undefined && result !== null) captured.push(String(result));
        setOutput(captured.join('\n') || '(no output)');
        setStatus('✅ Finished');
      } else if (lang.id === 'javascript') {
        setStatus('▶ Running JavaScript…');
        const logs = [];
        const origLog = console.log;
        const origErr = console.error;
        const origPrompt = window.prompt;
        const origAlert = window.alert;
        const origConfirm = window.confirm;
        
        console.log = (...args) => { logs.push(args.map(String).join(' ')); origLog(...args); };
        console.error = (...args) => { logs.push('⚠️ ' + args.map(String).join(' ')); origErr(...args); };
        window.prompt = () => { throw new Error("❌ INTERACTIVE INPUT NOT SUPPORTED\\nInteractive prompt() is disabled to prevent freezing the OS. Use variables instead."); };
        window.confirm = () => { throw new Error("❌ INTERACTIVE INPUT NOT SUPPORTED\\nInteractive confirm() is disabled to prevent freezing the OS."); };
        window.alert = (msg) => { logs.push('🔔 Alert: ' + msg); };

        try {
          const fn = new Function(code);
          fn();
        } catch (e) { logs.push('❌ ' + e.message); }
        
        console.log = origLog;
        console.error = origErr;
        window.prompt = origPrompt;
        window.alert = origAlert;
        window.confirm = origConfirm;
        setOutput(logs.join('\n') || '(no output)');
        setStatus('✅ Finished');
      } else if (lang.id === 'html') {
        if (iframeRef.current) iframeRef.current.srcdoc = code;
        setStatus('✅ HTML rendered');
      } else if (lang.id === 'css') {
        if (iframeRef.current) iframeRef.current.srcdoc = CSS_PREVIEW_HTML(code);
        setStatus('✅ CSS rendered');
      } else if (lang.id === 'json') {
        try {
          const parsed = JSON.parse(code);
          setOutput(JSON.stringify(parsed, null, 2));
          setStatus('✅ Valid JSON');
        } catch (e) {
          setOutput('❌ JSON Error: ' + e.message);
          setStatus('❌ Invalid JSON');
        }
      }
    } catch (err) {
      setOutput('❌ Error: ' + err.message);
      setStatus('❌ Error');
      addNotification('Code execution failed: ' + err.message);
    } finally {
      setRunning(false);
    }
  };

  const downloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code${lang.ext}`;
    a.click();
    URL.revokeObjectURL(url);
    addNotification(`Downloaded code${lang.ext}`);
  };

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [output]);

  return (
    <div className="code-editor-app">
      {/* Toolbar */}
      <div className="editor-toolbar">
        <div className="lang-selector" onClick={() => setShowLangMenu(!showLangMenu)}>
          <Code2 size={14} />
          <span>{lang.label}</span>
          <ChevronDown size={12} />
          {showLangMenu && (
            <div className="lang-dropdown">
              {LANGUAGES.map(l => (
                <button key={l.id} className={l.id === lang.id ? 'active' : ''} onClick={() => switchLang(l)}>
                  {l.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="toolbar-spacer" />

        <span className="editor-status">{status}</span>

        <button className="toolbar-btn" onClick={downloadCode} title="Download code">
          <Download size={14} />
        </button>
        <button className="toolbar-btn danger" onClick={() => { setCode(''); setOutput(''); }} title="Clear">
          <Trash2 size={14} />
        </button>
        <button
          className={`run-btn ${running ? 'running' : ''}`}
          onClick={runCode}
          disabled={running}
          title="Run (Ctrl+Enter)"
        >
          <Play size={14} />
          {running ? 'Running…' : 'Run'}
        </button>
      </div>

      {/* Editor + Output panes */}
      <div className="editor-body">
        <div className="editor-pane">
          <Suspense fallback={<div className="editor-loading">Loading editor…</div>}>
            <MonacoEditor
              height="100%"
              language={lang.mode}
              value={code}
              onChange={setCode}
              theme="vs-dark"
              options={{
                fontSize: 13,
                fontFamily: "'Cascadia Code', 'Fira Code', monospace",
                fontLigatures: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                tabSize: 2,
                wordWrap: 'on',
                padding: { top: 12, bottom: 12 },
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                renderLineHighlight: 'gutter',
              }}
            />
          </Suspense>
        </div>

        <div className="output-pane">
          <div className="output-tabs">
            <button
              className={activePanel === 'output' ? 'active' : ''}
              onClick={() => setActivePanel('output')}
            >
              <TermIcon size={12} /> Output
            </button>
            <button
              className={activePanel === 'preview' ? 'active' : ''}
              onClick={() => setActivePanel('preview')}
            >
              <Eye size={12} /> Preview
            </button>
          </div>

          {activePanel === 'output' ? (
            <pre className="output-console" ref={outputRef}>
              {output || <span className="output-placeholder">▶ Press Run to execute code</span>}
            </pre>
          ) : (
            <iframe
              ref={iframeRef}
              title="preview"
              className="preview-frame"
              sandbox="allow-scripts"
              srcdoc={lang.id === 'html' ? code : lang.id === 'css' ? CSS_PREVIEW_HTML(code) : '<p style="padding:16px;color:#888">Preview not available for this language</p>'}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeEditorApp;
