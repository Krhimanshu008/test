import React, { useState, useEffect, useRef } from 'react';
import useOsStore from '../../store/osStore';
import './style.css';

const PROMPT = 'user@browser-os:~$ ';

const HELP_TEXT = `
Browser OS Terminal v1.0
========================
Commands:
  help          Show this help
  ls [path]     List directory contents
  cd <dir>      Change directory
  pwd           Print working directory
  cat <file>    Read a file
  echo <text>   Print text
  clear         Clear terminal
  mkdir <name>  Create directory
  rmdir <name>  Remove empty directory
  touch <file>  Create empty file
  rm <file>     Delete a file
  cp <s> <d>    Copy file
  mv <s> <d>    Move file
  history       Show command history
  python        Launch Python REPL (type exit() to quit)
  date          Show current date/time
  whoami        Show current user
  uname         System information
  neofetch      System info display
`.trim();

const NEOFETCH_ART = `
    ██████╗ ██████╗  ██████╗ ██╗    ██╗███████╗███████╗██████╗      ██████╗ ███████╗
    ██╔══██╗██╔══██╗██╔═══██╗██║    ██║██╔════╝██╔════╝██╔══██╗    ██╔═══██╗██╔════╝
    ██████╔╝██████╔╝██║   ██║██║ █╗ ██║███████╗█████╗  ██████╔╝    ██║   ██║███████╗
    ██╔══██╗██╔══██╗██║   ██║██║███╗██║╚════██║██╔══╝  ██╔══██╗    ██║   ██║╚════██║
    ██████╔╝██║  ██║╚██████╔╝╚███╔███╔╝███████║███████╗██║  ██║    ╚██████╔╝███████║
    ╚═════╝ ╚═╝  ╚═╝ ╚═════╝  ╚══╝╚══╝ ╚══════╝╚══════╝╚═╝  ╚═╝     ╚═════╝ ╚══════╝

    OS:       Browser OS 1.0
    Host:     ${window.location.hostname}
    Kernel:   Web 5.0 (Chromium-based)
    Shell:    BashJS v1.0
    Terminal: XtermJS Emulator
    CPU:      Virtual CPU @ 3.6GHz
    Memory:   ${(performance.memory?.usedJSHeapSize / 1024 / 1024 || 64).toFixed(0)}MB / 256MB
    Resolution: ${window.innerWidth}x${window.innerHeight}
    DE:       Browser OS Shell
    WM:       react-rnd
    Theme:    Midnight Blue
    Icons:    Lucide React
`.trim();

let pyodideForTerminal = null;
let pyodideTermLoading = false;

async function loadPyForTerminal(addLine) {
  if (pyodideForTerminal) return pyodideForTerminal;
  if (pyodideTermLoading) {
    while (pyodideTermLoading) await new Promise(r => setTimeout(r, 100));
    return pyodideForTerminal;
  }
  pyodideTermLoading = true;
  addLine('⚙️ Loading Python (Pyodide)… first-time load may take ~15s');
  const { loadPyodide } = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/pyodide/v0.27.5/full/pyodide.mjs');
  pyodideForTerminal = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.5/full/' });
  
  await pyodideForTerminal.runPythonAsync(`
import builtins
import js
def _browser_input(prompt_text=""):
    res = js.prompt(prompt_text)
    if res is None:
        raise EOFError()
    return res
builtins.input = _browser_input
  `);
  
  pyodideTermLoading = false;
  addLine('✅ Python 3.12 ready. Type exit() to quit Python mode.');
  return pyodideForTerminal;
}

const TerminalApp = () => {
  const [lines, setLines] = useState([
    { type: 'output', text: 'Browser OS Terminal v1.0 — Type "help" for commands' },
    { type: 'output', text: '' },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [cwd, setCwd] = useState('/home/user');
  const [pythonMode, setPythonMode] = useState(false);
  const [pyBuffer, setPyBuffer] = useState('');
  const inputRef = useRef(null);
  const outputRef = useRef(null);
  const virtualFS = useOsStore(s => s.virtualFS);
  const writeFile = useOsStore(s => s.writeFile);
  const deleteFile = useOsStore(s => s.deleteFile);
  const addAuditLog = useOsStore(s => s.addAuditLog);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const addLine = (text, type = 'output') => {
    setLines(prev => [...prev, { type, text }]);
  };

  const resolvePath = (p) => {
    if (!p || p === '~') return '/home/user';
    if (p.startsWith('/')) return p;
    return cwd + '/' + p;
  };

  const executeCommand = async (raw) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    addAuditLog('TERMINAL_CMD', trimmed);

    // Python REPL mode
    if (pythonMode) {
      if (trimmed === 'exit()' || trimmed === 'quit()') {
        setPythonMode(false);
        addLine('Exited Python. Back to shell.');
        return;
      }
      try {
        const py = pyodideForTerminal;
        if (!py) { addLine('Python not loaded.'); return; }
        const captured = [];
        py.setStdout({ batched: s => captured.push(s) });
        py.setStderr({ batched: s => captured.push('⚠️ ' + s) });
        const result = await py.runPythonAsync(trimmed);
        if (captured.length) captured.forEach(l => addLine(l));
        else if (result !== undefined && result !== null) addLine(String(result));
      } catch (e) {
        addLine('❌ ' + e.message);
      }
      return;
    }

    const [cmd, ...args] = trimmed.split(' ');
    const arg = args.join(' ');

    switch (cmd) {
      case 'help': addLine(HELP_TEXT); break;
      case 'clear': setLines([]); break;
      case 'pwd': addLine(cwd); break;
      case 'whoami': addLine('user'); break;
      case 'date': addLine(new Date().toString()); break;
      case 'uname': addLine('Browser-OS 1.0 Web x86_64'); break;
      case 'neofetch': addLine(NEOFETCH_ART); break;
      case 'echo': addLine(arg); break;

      case 'ls': {
        const target = arg ? resolvePath(arg) : cwd;
        const entries = Object.keys(virtualFS)
          .filter(k => {
            const rel = k.startsWith(target + '/') ? k.slice(target.length + 1) : null;
            return rel && !rel.includes('/');
          });
        if (entries.length === 0) addLine('(empty directory)');
        else addLine(entries.join('  '));
        break;
      }

      case 'cat': {
        if (!arg) { addLine('Usage: cat <file>'); break; }
        const path = resolvePath(arg);
        const content = virtualFS[path];
        if (content === undefined) addLine(`cat: ${arg}: No such file`);
        else addLine(content);
        break;
      }

      case 'touch': {
        if (!arg) { addLine('Usage: touch <file>'); break; }
        const path = resolvePath(arg);
        writeFile(path, '');
        addLine(`Created: ${path}`);
        break;
      }

      case 'rm': {
        if (!arg) { addLine('Usage: rm <file>'); break; }
        const path = resolvePath(arg);
        if (virtualFS[path] === undefined) addLine(`rm: ${arg}: No such file`);
        else { deleteFile(path); addLine(`Removed: ${path}`); }
        break;
      }

      case 'cd': {
        if (!arg) { setCwd('/home/user'); break; }
        const target = resolvePath(arg);
        setCwd(target);
        break;
      }

      case 'mkdir': {
        if (!arg) { addLine('Usage: mkdir <dir>'); break; }
        const target = resolvePath(arg);
        writeFile(target + '/.keep', '');
        break;
      }

      case 'rmdir': {
        if (!arg) { addLine('Usage: rmdir <dir>'); break; }
        const target = resolvePath(arg);
        const entries = Object.keys(virtualFS).filter(k => k.startsWith(target + '/') && k !== target + '/.keep');
        if (entries.length > 0) { addLine(`rmdir: failed to remove '${arg}': Directory not empty`); break; }
        deleteFile(target + '/.keep');
        break;
      }

      case 'cp': {
        if (args.length < 2) { addLine('Usage: cp <src> <dst>'); break; }
        const src = resolvePath(args[0]);
        const dst = resolvePath(args[1]);
        if (virtualFS[src] === undefined) { addLine(`cp: cannot stat '${args[0]}': No such file`); break; }
        writeFile(dst, virtualFS[src]);
        break;
      }

      case 'mv': {
        if (args.length < 2) { addLine('Usage: mv <src> <dst>'); break; }
        const src = resolvePath(args[0]);
        const dst = resolvePath(args[1]);
        if (virtualFS[src] === undefined) { addLine(`mv: cannot stat '${args[0]}': No such file`); break; }
        writeFile(dst, virtualFS[src]);
        deleteFile(src);
        break;
      }

      case 'history': {
        history.slice().reverse().forEach((h, i) => addLine(`  ${i + 1}  ${h}`));
        break;
      }

      case 'python':
      case 'python3': {
        setPythonMode(true);
        addLine('Python 3.12 (Pyodide/WebAssembly)');
        addLine('Type exit() to return to shell.');
        if (!pyodideForTerminal) {
          loadPyForTerminal(addLine).catch(e => {
            addLine('❌ Failed to load Python: ' + e.message);
            setPythonMode(false);
          });
        }
        break;
      }

      default:
        addLine(`${cmd}: command not found. Type 'help' for available commands.`);
    }
  };

  const handleKeyDown = async (e) => {
    if (e.key === 'Enter') {
      const prompt = pythonMode ? '>>> ' : PROMPT;
      addLine(prompt + input, 'input');
      setHistory(prev => [input, ...prev]);
      setHistIdx(-1);
      await executeCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIdx = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(newIdx);
      setInput(history[newIdx] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIdx = Math.max(histIdx - 1, -1);
      setHistIdx(newIdx);
      setInput(newIdx === -1 ? '' : history[newIdx]);
    }
  };

  return (
    <div className="terminal-app-container" onClick={() => inputRef.current?.focus()}>
      <div className="terminal-app">
        <div className="terminal-output" ref={outputRef}>
          {lines.map((line, i) => (
            <div key={i} className={`term-line term-${line.type}`}>
              <pre>{line.text}</pre>
            </div>
          ))}
        </div>
        <div className="terminal-input-row">
          <span className="term-prompt">
            {pythonMode ? '>>> ' : PROMPT}
          </span>
          <input
            ref={inputRef}
            className="terminal-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
          />
        </div>
      </div>
    </div>
  );
};

export default TerminalApp;
