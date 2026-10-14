// AI DECK - proceso principal de Electron.
// Abre una consola real (PTY) por cada agente y la expone al renderer.
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const pty = require('@lydell/node-pty');
const { execFile } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const CONFIG_DIR = path.join(os.homedir(), '.config', 'ai-hub');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const LOG_FILE = path.join(CONFIG_DIR, 'ai-hub.log');

// Catalogo base. El login / API key lo maneja cada CLI dentro de su consola.
// Se le pueden sumar agentes propios desde config.json:
//   "agents": [{ "id": "mi-cli", "title": "MI CLI", "exe": "mi-cli", "tag": "propio" }]
// Si un agente trae `install`, el boton ofrece instalarlo en una consola de la app.
// `resume` son los argumentos que retoman la ultima conversacion de la carpeta; se usan
// al restaurar las consolas al reabrir la app, para que no arranquen de cero.
const BASE_AGENTS = [
  {
    id: 'claude', title: 'CLAUDE', exe: 'claude', tagKey: 'anthropic', resume: '--continue',
    install: { howKey: 'winget', cmd: 'winget install --id Anthropic.ClaudeCode -e --accept-package-agreements --accept-source-agreements' },
  },
  {
    id: 'agy', title: 'ANTIGRAVITY', exe: 'agy', tagKey: 'google', resume: '--continue',
    install: { howKey: 'officialInstaller', cmd: 'irm https://antigravity.google/cli/install.ps1 | iex' },
  },
  // DeepSeek no publica CLI propio. Su documentacion oficial lista OpenCode como
  // integracion soportada: con DEEPSEEK_API_KEY en el entorno, OpenCode expone
  // los modelos deepseek/* sin necesidad de /connect. La key la pide la consola.
  {
    id: 'deepseek', title: 'DEEPSEEK', exe: 'opencode', tagKey: 'viaOpenCode', resume: '--continue',
    install: { howKey: 'winget', cmd: 'winget install --id SST.opencode -e --accept-package-agreements --accept-source-agreements' },
    command: [
      `if (-not $env:DEEPSEEK_API_KEY) {`,
      ` Write-Host '{dsNeedKey}' -ForegroundColor Yellow;`,
      ` Write-Host '{dsGetKey}' -ForegroundColor DarkGray;`,
      // -AsSecureString: la clave no se muestra al escribirla ni queda en el historial.
      ` $sec = Read-Host '{dsPrompt}' -AsSecureString;`,
      ` $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec);`,
      ` $k = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr);`,
      ` [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr);`,
      ` if ($k) { [Environment]::SetEnvironmentVariable('DEEPSEEK_API_KEY', $k, 'User'); $env:DEEPSEEK_API_KEY = $k; Write-Host '{dsSaved}' -ForegroundColor Green }`,
      `};`,
      `if (-not $env:DEEPSEEK_API_KEY) { Write-Host '{dsNoKey}' -ForegroundColor Red } else {`,
      ` Write-Host '{dsOpening}' -ForegroundColor Cyan;`,
      ` {exe} --model deepseek/deepseek-flash`,
      `}`,
    ].join(' '),
  },
  {
    id: 'opencode', title: 'OPENCODE', exe: 'opencode', tagKey: 'openSource', resume: '--continue',
    install: { howKey: 'winget', cmd: 'winget install --id SST.opencode -e --accept-package-agreements --accept-source-agreements' },
  },
  { id: 'shell', title: 'POWERSHELL', exe: null, tagKey: 'terminal' },
];

// --- Consumo -------------------------------------------------------------
// Cada agente trae su propia fuente real de datos; nada se estima a ojo.
// Se ejecuta en PowerShell para heredar el PATH y las variables del usuario.
// cwd fijo: sin el, `claude -p "/usage"` corria en la carpeta temporal del .exe
// portable (una distinta por apertura) y Claude anotaba un proyecto nuevo cada vez.
function runShell(cmd, timeout = 120000) {
  return new Promise((resolve) => {
    execFile(SHELL, ['-NoLogo', '-NonInteractive', '-Command', cmd],
      { timeout, windowsHide: true, maxBuffer: 1024 * 1024, env: shellEnv(), cwd: CONFIG_DIR },
      (err, stdout, stderr) => resolve({ err, out: String(stdout || ''), errOut: String(stderr || '') }));
  });
}

// Textos del proceso principal (dialogos y consolas). El resto vive en el renderer.
const STR = {
  es: {
    installTitle: (t) => `Instalar ${t}`,
    installMsg: (t, how) => `Se instalara ${t} con ${how}.`,
    installDetail: (cmd) => `Se ejecutara en una consola de la app:\n\n${cmd}`,
    install: 'Instalar', cancel: 'Cancelar',
    winget: 'winget', officialInstaller: 'el instalador oficial',
    dsNeedKey: 'DeepSeek necesita una API key.',
    dsGetKey: 'Consiguela en https://platform.deepseek.com/api_keys',
    dsPrompt: 'Pega tu DEEPSEEK_API_KEY (no se vera al escribirla)',
    dsSaved: 'Clave guardada.',
    dsNoKey: 'Sin API key no se puede abrir DeepSeek.',
    dsOpening: 'OpenCode con deepseek/deepseek-flash',
  },
  en: {
    installTitle: (t) => `Install ${t}`,
    installMsg: (t, how) => `${t} will be installed with ${how}.`,
    installDetail: (cmd) => `This will run in a console inside the app:\n\n${cmd}`,
    install: 'Install', cancel: 'Cancel',
    winget: 'winget', officialInstaller: 'the official installer',
    dsNeedKey: 'DeepSeek needs an API key.',
    dsGetKey: 'Get one at https://platform.deepseek.com/api_keys',
    dsPrompt: 'Paste your DEEPSEEK_API_KEY (input stays hidden)',
    dsSaved: 'Key saved.',
    dsNoKey: 'Without an API key DeepSeek cannot start.',
    dsOpening: 'OpenCode with deepseek/deepseek-flash',
  },
};
const lang = () => (readConfig().lang === 'en' ? 'en' : 'es');
const str = () => STR[lang()];

const USAGE = {
  // claude -p "/usage" -> "Current session: 27% used - resets ..."
  claude: async () => {
    const { out } = await runShell('claude -p "/usage"');
    const ses = out.match(/Current session:\s*(\d+)%\s*used/i);
    const wk = out.match(/Current week[^:]*:\s*(\d+)%\s*used/i);
    if (!ses && !wk) return { errorKey: 'noUsageData' };
    const parts = [];
    if (ses) parts.push({ k: 'session', v: `${ses[1]}%` });
    if (wk) parts.push({ k: 'week', v: `${wk[1]}%` });
    return { unit: 'used', parts, raw: out.trim().split('\n').slice(0, 3).join(' · ') };
  },

  // agy -p "/usage" -> filas con tabulaciones: familia, etiqueta, porcentaje, reinicio
  agy: async () => {
    const { out } = await runShell('agy -p "/usage"');
    const rows = out.split('\n').map((l) => l.split('\t').map((s) => s.trim())).filter((r) => r.length >= 3);
    if (!rows.length) return { errorKey: 'noUsageData' };
    const pick = (re) => rows.find((r) => re.test(r[1]));
    const wk = pick(/weekly/i), hr = pick(/five hour|5 hour/i);
    // agy informa lo que QUEDA; se invierte para mostrar lo usado, como los demas.
    const used = (row) => `${(100 - parseFloat(row[2])).toFixed(0)}%`;
    const parts = [];
    if (wk) parts.push({ k: 'week', v: used(wk) });
    if (hr) parts.push({ k: 'fiveHour', v: used(hr) });
    return { unit: 'used', parts, raw: rows.map((r) => r.slice(0, 3).join(' ')).join(' · ') };
  },

  // DeepSeek sí publica saldo restante. La key se lee del entorno del usuario,
  // nunca pasa por esta app ni por su log.
  deepseek: async () => {
    const script =
      `$k = $env:DEEPSEEK_API_KEY; if (-not $k) { $k = [Environment]::GetEnvironmentVariable('DEEPSEEK_API_KEY','User') }; ` +
      `if (-not $k) { 'NOKEY' } else { try { (Invoke-RestMethod -Uri 'https://api.deepseek.com/user/balance' ` +
      `-Headers @{ Authorization = "Bearer $k" } -TimeoutSec 20) | ConvertTo-Json -Compress -Depth 5 } catch { 'ERR ' + $_.Exception.Message } }`;
    const { out } = await runShell(script, 40000);
    const t = out.trim();
    if (t === 'NOKEY') return { errorKey: 'missingKey' };
    if (t.startsWith('ERR')) return { error: t.slice(4, 80) };
    try {
      const b = JSON.parse(t);
      const info = [].concat(b.balance_infos || [])[0];
      if (!info) return { errorKey: 'noBalance' };
      return {
        unit: 'balance',
        parts: [{ raw: info.currency, v: info.total_balance }],
        detail: { key: 'balanceDetail', args: [info.currency, info.granted_balance, info.topped_up_balance] },
      };
    } catch { return { errorKey: 'badResponse' }; }
  },

  // OpenCode usa tu propio proveedor: no hay cuota, se muestra lo gastado.
  opencode: async () => {
    const { out } = await runShell('opencode stats', 90000);
    const cost = out.match(/Total Cost\s*\|?\s*\$?([\d.,]+)/i);
    const sess = out.match(/Sessions\s*\|?\s*([\d.,]+)/i);
    if (!cost) return { errorKey: 'noStats' };
    const parts = [{ k: 'spent', v: `$${cost[1]}` }];
    if (sess) parts.push({ k: 'sessions', v: sess[1] });
    return { unit: 'accumulated', parts, detail: { key: 'spentDetail', args: [`$${cost[1]}`] } };
  },
};

// Base + los que el usuario haya definido en config.json (los suyos mandan si repiten id).
function allAgents() {
  const extra = (readConfig().agents || []).filter((a) => a && a.id && a.exe);
  const byId = new Map(BASE_AGENTS.map((a) => [a.id, a]));
  for (const a of extra) {
    byId.set(a.id, {
      id: a.id, title: (a.title || a.id).toUpperCase(), exe: a.exe, tagKey: null, tag: a.tag || 'custom',
      command: a.command, install: a.install, note: a.note, resume: a.resume,
    });
  }
  return [...byId.values()];
}

fs.mkdirSync(CONFIG_DIR, { recursive: true });

// Una sola instancia: dos copias compartiendo config.json y path.tmp se pisan, y con
// el .exe portable un doble clic repetido abria otra ventana entera. La segunda
// solo avisa a la primera (ver 'second-instance') y se va.
if (!app.requestSingleInstanceLock()) {
  app.exit(0);
}

function log(msg, level = 'INFO') {
  const line = `${new Date().toISOString()} [${level}] ${msg}\n`;
  try {
    if (fs.existsSync(LOG_FILE) && fs.statSync(LOG_FILE).size > 1024 * 1024) {
      fs.renameSync(LOG_FILE, LOG_FILE + '.old');
    }
    fs.appendFileSync(LOG_FILE, line);
  } catch { /* el log nunca debe tumbar la app */ }
  process.stdout.write(line);
}

function readConfig() {
  try {
    // Notepad y PowerShell guardan con BOM, y JSON.parse revienta con el.
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8').replace(/^﻿/, '');
    return JSON.parse(raw);
  } catch (e) {
    if (fs.existsSync(CONFIG_FILE)) log(`config.json ilegible: ${e.message}`, 'WARN');
    return { lastFolder: os.homedir() };
  }
}
function writeConfig(cfg) {
  try { fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2)); }
  catch (e) { log(`no se pudo guardar config: ${e.message}`, 'WARN'); }
}

// Busca un ejecutable en PATH (equivalente a `where`).
function whichExe(name) {
  if (!name) return null;
  const exts = (process.env.PATHEXT || '.EXE;.CMD;.BAT;.PS1').split(';').filter(Boolean);
  const dirs = (process.env.PATH || '').split(path.delimiter).filter(Boolean);
  // Carpetas habituales de instaladores que a veces no llegan al PATH de la app.
  for (const extra of ['.opencode\\bin', '.deepseek\\bin', 'scoop\\shims', 'AppData\\Local\\Programs']) {
    dirs.push(path.join(os.homedir(), extra));
  }
  for (const dir of dirs) {
    for (const ext of ['', ...exts]) {
      const full = path.join(dir, name + ext);
      try { if (fs.statSync(full).isFile()) return full; } catch { /* siguiente */ }
    }
  }
  return null;
}

// Deteccion autoritativa: le pregunta al mismo PowerShell que abrira el agente,
// asi valen alias, funciones, shims y el PATH del perfil del usuario.
function detectWithShell(names) {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') return resolve({});
    const script =
      // Releer el PATH del registro: tras instalar algo, el PATH heredado esta viejo.
      `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + ` +
      `[Environment]::GetEnvironmentVariable('Path','User'); ` +
      `$env:Path | Out-File -FilePath $env:AIHUB_PATHOUT -Encoding utf8; ` +
      `@(${names.map((n) => `'${n}'`).join(',')}) | ForEach-Object { ` +
      `$c = Get-Command $_ -ErrorAction SilentlyContinue | Select-Object -First 1; ` +
      `[pscustomobject]@{ n = $_; p = $(if ($c) { if ($c.Source) { $c.Source } else { $c.Name } }) } } | ` +
      `ConvertTo-Json -Compress`;
    const pathOut = path.join(CONFIG_DIR, 'path.tmp');
    execFile(SHELL, ['-NoLogo', '-NonInteractive', '-Command', script],
      { timeout: 20000, windowsHide: true, env: { ...process.env, AIHUB_PATHOUT: pathOut } }, (err, stdout) => {
        try {
          const p = fs.readFileSync(pathOut, 'utf8').replace(/^﻿/, '').trim();
          if (p) CURRENT_PATH = p;
          fs.unlinkSync(pathOut);
        } catch { /* sin PATH fresco se sigue con el heredado */ }
        if (err) { log(`deteccion por shell fallo: ${err.message}`, 'WARN'); return resolve({}); }
        try {
          // Ojo: PowerShell serializa "no encontrado" como {}, que en JS es truthy.
          const rows = [].concat(JSON.parse(stdout || '[]'));
          const ok = rows.filter((r) => r && typeof r.p === 'string' && r.p.trim());
          resolve(Object.fromEntries(ok.map((r) => [r.n, r.p])));
        } catch (e) { log(`deteccion ilegible: ${e.message}`, 'WARN'); resolve({}); }
      });
  });
}

// Cada deteccion arranca un PowerShell (~1 s). Al abrir la app se pedian varias
// seguidas (init, cada consola restaurada, consumo, foco), asi que se comparte
// la que este en curso y se reusa la reciente cuando el que pide tolera `maxAge`.
let detectCache = { at: 0, found: {}, pending: null };
function detectFound(names, maxAge = 0) {
  if (detectCache.pending) return detectCache.pending;
  if (maxAge && Date.now() - detectCache.at < maxAge) return Promise.resolve(detectCache.found);
  detectCache.pending = detectWithShell(names).then((found) => {
    detectCache = { at: Date.now(), found, pending: null };
    return found;
  });
  return detectCache.pending;
}

async function detectAgents(maxAge = 0) {
  const list = allAgents();
  const found = await detectFound(list.filter((a) => a.exe).map((a) => a.exe), maxAge);
  return list.map((a) => {
    const p = a.exe ? (found[a.exe] || whichExe(a.exe)) : SHELL;
    return { ...a, path: p, available: Boolean(p) };
  });
}

const SHELL = process.env.COMSPEC && process.platform !== 'win32'
  ? process.env.SHELL
  : 'powershell.exe';

// PATH vivo: se refresca desde el registro en cada deteccion, para que un agente
// recien instalado se vea sin reiniciar la app.
let CURRENT_PATH = process.env.PATH || '';

function shellEnv() {
  const env = { ...process.env, TERM: 'xterm-256color' };
  for (const k of Object.keys(env)) if (k.toLowerCase() === 'path') delete env[k];
  env.Path = CURRENT_PATH;
  return env;
}

const sessions = new Map(); // id -> { proc, agent }

// Agentes cuya instalacion se confirmo en el dialogo nativo. pty:spawn consume la
// marca: la confirmacion la exige main, no depende de que el renderer la pida.
const installApproved = new Set();

// Solo se atiende IPC de la pagina propia. Si algo llegara a navegar a otra URL
// o a abrir un frame, sus mensajes se ignoran en vez de lanzar consolas.
const INDEX_URL = require('node:url').pathToFileURL(path.join(__dirname, 'renderer', 'index.html')).href;
function trusted(e) {
  const url = e.senderFrame?.url || '';
  if (url === INDEX_URL) return true;
  log(`IPC rechazado de ${url || '(sin frame)'}`, 'WARN');
  return false;
}
function handle(channel, fn) {
  ipcMain.handle(channel, (e, ...args) => {
    if (!trusted(e)) throw new Error('i18n:untrusted');
    return fn(e, ...args);
  });
}
function on(channel, fn) {
  ipcMain.on(channel, (e, ...args) => { if (trusted(e)) fn(e, ...args); });
}

// La app no navega ni abre ventanas: cualquier intento (un enlace, window.open,
// un <webview>) se corta aca. Tampoco concede camara, micro, notificaciones, etc.
app.on('web-contents-created', (_e, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    log(`ventana bloqueada: ${url}`, 'WARN');
    return { action: 'deny' };
  });
  contents.on('will-navigate', (ev, url) => {
    if (url !== INDEX_URL) { ev.preventDefault(); log(`navegacion bloqueada: ${url}`, 'WARN'); }
  });
  contents.on('will-attach-webview', (ev) => ev.preventDefault());
  contents.session.setPermissionRequestHandler((_wc, _perm, cb) => cb(false));
  contents.session.setPermissionCheckHandler(() => false);
  // Errores del renderer (incluidas violaciones de CSP) al log, que es donde se diagnostica.
  contents.on('console-message', (ev) => {
    if (ev.level === 'warning' || ev.level === 'error') log(`[renderer] ${ev.message} (${ev.sourceId}:${ev.lineNumber})`, 'WARN');
  });
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 780,
    minWidth: 860,
    minHeight: 560,
    center: true,
    // Con tema oscuro, un fondo blanco fijo se veia como un destello al abrir.
    backgroundColor: readConfig().theme === 'dark' ? '#0d1b26' : '#ffffff',
    title: 'AI DECK',
    autoHideMenuBar: true,
    // Se muestra cuando ya pinto, asi no aparece un marco vacio mientras carga.
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // El preload solo usa contextBridge e ipcRenderer, que existen en sandbox.
      sandbox: true,
      webSecurity: true,
      spellcheck: false,
      // Sin esto, Chromium congela el renderizado al perder el foco y los
      // terminales dejan de reajustarse al cambiar de tamano.
      backgroundThrottling: false,
    },
  });
  win.once('ready-to-show', () => win.show());
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  win.on('closed', () => {
    for (const [id, s] of sessions) {
      try { s.proc.kill(); } catch { /* ya murio */ }
      sessions.delete(id);
    }
  });
  return win;
}

app.whenReady().then(() => {
  log('=== inicio ai-deck ===');
  // La deteccion corre mientras el renderer carga, en vez de despues de 'app:init'.
  const firstDetect = detectAgents();
  const win = createWindow();

  app.on('second-instance', () => {
    log('segunda instancia: se enfoca la ventana abierta');
    if (win.isDestroyed()) return;
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  });

  handle('app:init', async () => {
    const cfg = readConfig();
    const folder = fs.existsSync(cfg.lastFolder || '') ? cfg.lastFolder : os.homedir();
    const agents = await firstDetect;
    for (const a of agents) log(`agente ${a.id}: ${a.available ? a.path : 'NO DETECTADO'}`);
    const cfg2 = readConfig();
    return {
      folder, agents, logFile: LOG_FILE,
      layout: cfg2.layout || null,
      theme: cfg2.theme === 'dark' ? 'dark' : 'light',
      palette: cfg2.palette || 'sky',
      lang: cfg2.lang === 'en' ? 'en' : 'es',
    };
  });

  // La distribucion de ventanas se guarda para reabrirla igual la proxima vez.
  on('layout:save', (_e, layout) => {
    writeConfig({ ...readConfig(), layout });
  });

  // Solo claves conocidas: un `agents` colado por aca se convertiria en un comando
  // que pty:spawn ejecutaria. Los agentes propios se editan a mano en config.json.
  const PREF_KEYS = ['theme', 'palette', 'lang'];
  on('prefs:save', (_e, prefs) => {
    const clean = Object.fromEntries(PREF_KEYS
      .filter((k) => typeof prefs?.[k] === 'string' && prefs[k].length < 32)
      .map((k) => [k, prefs[k]]));
    writeConfig({ ...readConfig(), ...clean });
    log(`preferencias: ${JSON.stringify(clean)}`);
  });

  // Consulta el consumo de todos los agentes disponibles, en paralelo.
  handle('usage:read', async () => {
    const list = (await detectAgents(60000)).filter((a) => a.available && USAGE[a.id]);
    const rows = await Promise.all(list.map(async (a) => {
      const t0 = Date.now();
      try {
        const r = await USAGE[a.id]();
        const what = r.errorKey || r.error
          ? 'ERROR ' + (r.errorKey || r.error)
          : (r.raw || r.parts.map((p) => `${p.k || p.raw} ${p.v}`).join(' '));
        log(`consumo ${a.id}: ${what} (${Date.now() - t0}ms)`);
        return { id: a.id, title: a.title, ...r };
      } catch (e) {
        log(`consumo ${a.id} fallo: ${e.message}`, 'WARN');
        return { id: a.id, title: a.title, error: e.message };
      }
    }));
    return { rows, at: Date.now() };
  });

  handle('agents:detect', async (_e, maxAge = 0) => {
    const agents = await detectAgents(maxAge);
    log(`redeteccion: ${agents.filter((a) => a.available).map((a) => a.id).join(', ') || 'ninguno'}`);
    return agents;
  });

  handle('dialog:folder', async (_e, current) => {
    const r = await dialog.showOpenDialog(win, {
      title: 'Carpeta de trabajo',
      defaultPath: fs.existsSync(current || '') ? current : os.homedir(),
      properties: ['openDirectory'],
    });
    if (r.canceled || !r.filePaths[0]) return null;
    const folder = r.filePaths[0];
    writeConfig({ ...readConfig(), lastFolder: folder });
    log(`carpeta elegida: ${folder}`);
    return folder;
  });

  // Pide confirmacion mostrando el comando exacto antes de instalar nada.
  handle('agent:confirm-install', async (_e, agentId) => {
    const agent = allAgents().find((a) => a.id === agentId);
    if (!agent?.install) return false;
    const s = str();
    const r = await dialog.showMessageBox(win, {
      type: 'question',
      buttons: [s.install, s.cancel],
      defaultId: 0,
      cancelId: 1,
      title: s.installTitle(agent.title),
      message: s.installMsg(agent.title, s[agent.install.howKey] || agent.install.howKey),
      detail: s.installDetail(agent.install.cmd),
    });
    log(`confirmacion instalar ${agent.id}: ${r.response === 0 ? 'si' : 'no'}`);
    if (r.response === 0) installApproved.add(agent.id);
    return r.response === 0;
  });

  handle('pty:spawn', async (e, { id, agentId, cwd, cols, rows, install, resume } = {}) => {
    if (typeof id !== 'string' || !id || sessions.has(id)) throw new Error('i18n:badRequest');
    const agent = allAgents().find((a) => a.id === agentId);
    if (!agent) throw new Error('i18n:unknownAgent');
    let isDir = false;
    try { isDir = typeof cwd === 'string' && fs.statSync(cwd).isDirectory(); } catch { /* no existe */ }
    if (!isDir) throw new Error('i18n:folderMissing');
    if (install && !agent.install) throw new Error('i18n:noAutoInstall');
    if (install && !installApproved.delete(agent.id)) throw new Error('i18n:installNotConfirmed');
    cols = Number.isInteger(cols) && cols > 0 && cols < 1000 ? cols : 100;
    rows = Number.isInteger(rows) && rows > 0 && rows < 1000 ? rows : 30;

    // Si no se detecto, igual se intenta por nombre: PowerShell lo resuelve en
    // caliente (alias, funcion, shim) y, si de verdad falta, su error se ve en la consola.
    let exePath = null;
    if (agent.exe && !install) {
      // La ruta ya detectada sirve mientras el archivo siga ahi; solo si falta
      // (recien instalado, o actualizado a otra carpeta) se vuelve a preguntar.
      const cached = detectCache.found[agent.exe];
      if (cached && (!path.isAbsolute(cached) || fs.existsSync(cached))) {
        exePath = cached;
      } else {
        const found = await detectWithShell([agent.exe]);
        exePath = found[agent.exe] || whichExe(agent.exe);
      }
    }
    let invoke;
    if (install) {
      invoke = `Write-Host '> ${agent.install.cmd.replace(/'/g, "''")}' -ForegroundColor Cyan; ${agent.install.cmd}`;
    } else {
      const run = exePath ? `& '${exePath.replace(/'/g, "''")}'` : agent.exe;
      const cont = resume && agent.resume ? ` ${agent.resume}` : '';
      if (agent.command) {
        // `command` permite envolver el binario (ej. DeepSeek via OpenCode).
        // Los {marcadores} de texto se resuelven en el idioma elegido.
        invoke = agent.command.replace('{exe}', run + cont).replace(/\{(\w+)\}/g, (m, k) => str()[k] ?? m);
      } else if (cont) {
        // Si no habia conversacion que retomar, algunos CLI salen al instante con
        // error: entonces se abre uno nuevo. Una sesion larga que termina con error
        // no se relanza, por eso el limite de tiempo.
        invoke = `$t0 = Get-Date; ${run}${cont}; ` +
          `if ($LASTEXITCODE -and ((Get-Date) - $t0).TotalSeconds -lt 15) { ${run} }`;
      } else {
        invoke = run;
      }
    }

    // Se abre siempre dentro de PowerShell: si el agente termina, queda el prompt
    // en la misma carpeta para que puedas verificar o relanzar.
    const args = (agent.exe || install) ? ['-NoLogo', '-NoExit', '-Command', invoke] : ['-NoLogo'];
    const proc = pty.spawn(SHELL, args, {
      name: 'xterm-256color',
      cols: cols || 100,
      rows: rows || 30,
      cwd,
      env: shellEnv(),
    });
    sessions.set(id, { proc, agent });
    log(`spawn ${id} ${agent.id}${install ? ' (instalacion)' : ''}${resume && agent.resume ? ' (retoma)' : ''} pid=${proc.pid} cwd=${cwd}`);

    proc.onData((data) => { if (!e.sender.isDestroyed()) e.sender.send('pty:data', { id, data }); });
    proc.onExit(({ exitCode }) => {
      log(`exit ${id} ${agent.id} code=${exitCode}`);
      sessions.delete(id);
      if (!e.sender.isDestroyed()) e.sender.send('pty:exit', { id, code: exitCode });
    });
    const label = install
      ? agent.install.cmd
      : (exePath || agent.exe || SHELL) + (agent.command ? ` · ${agent.tag}` : '')
        + (resume && agent.resume ? ` ${agent.resume}` : '');
    return { pid: proc.pid, exe: label, detected: Boolean(exePath) };
  });

  on('pty:write', (_e, { id, data }) => {
    const s = sessions.get(id);
    if (s) { try { s.proc.write(data); } catch (err) { log(`write ${id}: ${err.message}`, 'WARN'); } }
  });

  on('pty:resize', (_e, { id, cols, rows }) => {
    const s = sessions.get(id);
    if (s && cols > 0 && rows > 0) { try { s.proc.resize(cols, rows); } catch { /* carrera al cerrar */ } }
  });

  on('pty:kill', (_e, { id }) => {
    const s = sessions.get(id);
    if (s) { try { s.proc.kill(); } catch { /* ya murio */ } sessions.delete(id); log(`kill ${id}`); }
  });

  on('log', (_e, { msg, level }) => log(`[ui] ${msg}`, level || 'INFO'));

  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { log('=== fin ai-deck ==='); app.quit(); });

process.on('uncaughtException', (err) => log(`uncaught: ${err.stack || err}`, 'ERROR'));

