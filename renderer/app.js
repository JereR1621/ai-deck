// AI DECK - renderer: consolas movibles con acople tipo Windows 11.
const desk = document.getElementById('desk');
const agentsEl = document.getElementById('agents');
const folderEl = document.getElementById('folder');
const msgEl = document.getElementById('msg');
const countEl = document.getElementById('count');

// Temas del terminal, en juego con las paletas del CSS.
// Cada paleta trae su version clara y oscura.
const PALETTES = ['sky', 'matrix', 'neon', 'amber', 'paper', 'mono'];
const PALETTE_LABEL = {
  sky: 'palSky', matrix: 'palMatrix', neon: 'palNeon', amber: 'palAmber', paper: 'palPaper', mono: 'palMono',
};
// Muestras para el selector: [claro, oscuro] de cada paleta.
const PALETTE_SWATCH = {
  sky: ['#8fd3ff', '#0d1b26'], matrix: ['#6ee88a', '#030b05'], neon: ['#e452b0', '#0a0514'],
  amber: ['#e09a2c', '#0f0a02'], paper: ['#9aa3b2', '#0e1116'], mono: ['#ffffff', '#000000'],
};

const mkTheme = (bg, fg, cur, sel, c) => ({
  background: bg, foreground: fg, cursor: cur, selectionBackground: sel,
  black: c[0], red: c[1], green: c[2], yellow: c[3], blue: c[4], magenta: c[5], cyan: c[6], white: c[7],
  brightBlack: c[8], brightRed: c[9], brightGreen: c[10], brightYellow: c[11],
  brightBlue: c[12], brightMagenta: c[13], brightCyan: c[14], brightWhite: c[15],
});

const TERM_THEME = {
  sky: {
    light: mkTheme('#f7fcff', '#102538', '#1b7fcc', '#8fd3ff',
      ['#102538', '#d93834', '#2f9e44', '#b8860b', '#1b7fcc', '#9c54c7', '#1a9aa8', '#57758c',
       '#6c8ca6', '#e8615d', '#3fb257', '#d7a119', '#58b8f5', '#b06ede', '#2bb7c6', '#102538']),
    dark: mkTheme('#0d1b26', '#d7eefc', '#58b8f5', '#23587d',
      ['#0d1b26', '#ff8a85', '#7ad67f', '#e8c75a', '#58b8f5', '#cf9bf0', '#5fd4e0', '#d7eefc',
       '#769bb5', '#ffa9a4', '#9ae89e', '#f5dd84', '#8fd3ff', '#e0baff', '#8ae6ef', '#ffffff']),
  },
  matrix: {
    light: mkTheme('#f4fff6', '#0a2410', '#116b29', '#6ee88a',
      ['#0a2410', '#b23c2e', '#116b29', '#8a6a00', '#2f7a4f', '#5a7a2f', '#1a8a5c', '#4b7856',
       '#4b7856', '#cc5544', '#38c25b', '#b58e00', '#4aa06c', '#7aa045', '#34b081', '#0a2410']),
    dark: mkTheme('#030b05', '#a6ffbd', '#39ff6a', '#196b2d',
      ['#030b05', '#ff6b6b', '#39ff6a', '#c9d94a', '#36c96a', '#7ddb8f', '#4fe6a0', '#a6ffbd',
       '#2f7a46', '#ff9a9a', '#7bff9a', '#e3f06a', '#5fe88a', '#a8f5b8', '#86ffd0', '#e8ffef']),
  },
  neon: {
    light: mkTheme('#fffafd', '#24082b', '#9e1178', '#ffaddc',
      ['#24082b', '#d12d4e', '#1f8a6d', '#b07c00', '#2f6fd0', '#9e1178', '#0f8aa6', '#7d5f87',
       '#7d5f87', '#ff5c8a', '#2fb894', '#d9a52c', '#5a93e8', '#e452b0', '#2bc0da', '#24082b']),
    dark: mkTheme('#0a0514', '#efe8ff', '#ff3ea5', '#4b1f6b',
      ['#0a0514', '#ff5c8a', '#5ce6a8', '#ffc857', '#6aa8ff', '#ff3ea5', '#26f5ff', '#efe8ff',
       '#6b5a8f', '#ff8aae', '#8af5c4', '#ffdc8f', '#9ac6ff', '#ff7ac4', '#7dfaff', '#ffffff']),
  },
  amber: {
    light: mkTheme('#fffaf0', '#2e1c03', '#945500', '#ffd48a',
      ['#2e1c03', '#b5402b', '#5f7a1f', '#945500', '#7a5a2f', '#8a4a2f', '#6a6a2f', '#856a4c',
       '#856a4c', '#d4593c', '#7a9b2c', '#c98a0f', '#a3804a', '#b3663f', '#8f8f3f', '#2e1c03']),
    dark: mkTheme('#0f0a02', '#ffdea6', '#ffb000', '#5a3a00',
      ['#0f0a02', '#ff7a5c', '#c7d64a', '#ffd24a', '#d9a04a', '#ff9d5c', '#e0c060', '#ffdea6',
       '#8a6a30', '#ffa58f', '#dced7a', '#ffe28a', '#f0c070', '#ffba8a', '#f0d890', '#fff4dd']),
  },
  paper: {
    light: mkTheme('#fafbfc', '#161b22', '#3b4452', '#d0d5dd',
      ['#161b22', '#c0392b', '#2f7a4f', '#a07400', '#2f5f99', '#7a4f99', '#2f7f8a', '#606a78',
       '#606a78', '#d9594a', '#45a06d', '#c29a1f', '#4f85c7', '#9a72bd', '#4fa3b0', '#161b22']),
    dark: mkTheme('#0e1116', '#e4eaf0', '#b8c4d4', '#2c3440',
      ['#0e1116', '#ff8a80', '#8fd6a3', '#e0b64a', '#8ab4e8', '#c3a0e0', '#8fd0da', '#e4eaf0',
       '#6b7686', '#ffb0a8', '#b2e8c0', '#f0d184', '#aecdf2', '#d8bdef', '#b4e4ec', '#ffffff']),
  },
  // Fondo y texto puros; los ANSI quedan neutros pero legibles porque los CLI los usan para diffs y errores.
  mono: {
    light: mkTheme('#ffffff', '#000000', '#000000', '#cccccc',
      ['#000000', '#b71c1c', '#1b5e20', '#8d6e00', '#0d47a1', '#6a1b9a', '#00695c', '#606060',
       '#808080', '#d32f2f', '#2e7d32', '#a07c00', '#1565c0', '#8e24aa', '#00897b', '#000000']),
    dark: mkTheme('#000000', '#ffffff', '#ffffff', '#404040',
      ['#000000', '#ff6b6b', '#7ee08a', '#f0d060', '#82b1ff', '#d8a0f0', '#7fe0e0', '#d0d0d0',
       '#707070', '#ff9a9a', '#a8f0b0', '#f8e490', '#b0ccff', '#e8c4f8', '#b0f0f0', '#ffffff']),
  },
};

// Plantillas del selector, en fracciones del escritorio: [x, y, ancho, alto].
const LAYOUTS = {
  '2col': { zones: [[0, 0, .5, 1], [.5, 0, .5, 1]] },
  '3col': { zones: [[0, 0, 1 / 3, 1], [1 / 3, 0, 1 / 3, 1], [2 / 3, 0, 1 / 3, 1]] },
  '2row': { zones: [[0, 0, 1, .5], [0, .5, 1, .5]] },
  '2x2': { zones: [[0, 0, .5, .5], [.5, 0, .5, .5], [0, .5, .5, .5], [.5, .5, .5, .5]] },
  'bigL': { zones: [[0, 0, .62, 1], [.62, 0, .38, .5], [.62, .5, .38, .5]] },
  'full': { zones: [[0, 0, 1, 1]] },
};
const layoutName = (key) => t('lay' + key);

const GAP = 6;
const EDGE = 30;   // margen del borde que dispara el acople
const EPS = 0.004; // tolerancia al comparar fronteras de zonas

const wins = new Map();            // id -> { el, term, fit, agent, zone, alive }
let zones = [];                    // zonas activas (fracciones, mutables)
let autoGrid = true;               // por defecto se cuadran solas; arrastrar una fuera lo apaga
let seq = 0, zTop = 10;
let folder = '', agents = [], logFile = '';
let theme = 'light';
let palette = 'sky';
let lastUsage = null;              // ultimo consumo, para redibujarlo al cambiar de idioma

const say = (text, isErr = false) => {
  msgEl.textContent = text;
  msgEl.classList.toggle('err', isErr);
  msgEl.classList.remove('flash');
  void msgEl.offsetWidth;
  msgEl.classList.add('flash');
};
const spinBtn = (id) => {
  const b = document.getElementById(id);
  if (!b) return;
  b.classList.remove('spinning');
  void b.offsetWidth;
  b.classList.add('spinning');
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const near = (a, b) => Math.abs(a - b) < EPS;
const deskBox = () => desk.getBoundingClientRect();

function refreshCount() {
  const n = wins.size;
  countEl.textContent = t('consoles', n);
  desk.style.setProperty('--hint', n ? '0' : '1');
}

// ---------- tema e idioma ----------
function applyTheme(next, nextPalette) {
  theme = next === 'dark' ? 'dark' : 'light';
  if (nextPalette) palette = PALETTES.includes(nextPalette) ? nextPalette : 'sky';
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.dataset.palette = palette;
  document.getElementById('theme').textContent = theme === 'dark' ? '☀' : '☽';
  // El boton muestra el tema actual, para que se vea que es un selector.
  document.getElementById('palette').innerHTML =
    `<span class="sw" style="background:${PALETTE_SWATCH[palette][theme === 'dark' ? 1 : 0]}"></span>` +
    `${t(PALETTE_LABEL[palette]).toUpperCase()}<span class="caret">▾</span>`;
  for (const w of wins.values()) {
    try { w.term.options.theme = TERM_THEME[palette][theme]; } catch { /* aun abriendo */ }
  }
  window.hub.savePrefs({ theme, palette });
}

// Selector de paletas: cada fila muestra el color y el fondo oscuro del tema.
let palBox = null;
function closePalette() { palBox?.remove(); palBox = null; }
document.addEventListener('click', (e) => {
  if (palBox && !palBox.contains(e.target) && !e.target.closest('#palette')) closePalette();
});

function openPalette() {
  if (palBox) return closePalette();
  palBox = document.createElement('div');
  palBox.className = 'palbox';
  for (const key of PALETTES) {
    const row = document.createElement('button');
    row.className = 'palrow' + (key === palette ? ' on' : '');
    const [light, dark] = PALETTE_SWATCH[key];
    row.innerHTML = `<span class="sw" style="background:${light}"></span>` +
      `<span class="sw" style="background:${dark}"></span>` +
      `<span class="nm">${t(PALETTE_LABEL[key])}</span>`;
    row.addEventListener('click', () => { closePalette(); applyTheme(theme, key); say(t(PALETTE_LABEL[key])); });
    palBox.appendChild(row);
  }
  const b = document.getElementById('palette').getBoundingClientRect();
  palBox.style.left = `${Math.max(8, b.left - 90)}px`;
  palBox.style.top = `${b.bottom + 6}px`;
  document.body.appendChild(palBox);
}
document.getElementById('palette').addEventListener('click', openPalette);

function applyLang(next) {
  LANG = I18N[next] ? next : 'es';
  document.documentElement.lang = LANG;
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll('[data-i18n-title]')) el.title = t(el.dataset.i18nTitle);
  const lb = document.getElementById('lang');
  lb.textContent = LANG === 'es' ? 'EN' : 'ES';
  lb.title = t('langTitle');
  desk.dataset.hint = t('hint');
  paintAgents();
  refreshCount();
  if (lastUsage) paintUsage(lastUsage);
  // titulos y botones de las consolas ya abiertas
  for (const w of wins.values()) {
    w.el.querySelector('.win-title').textContent = w.install ? t('installWin', w.agent.title) : w.agent.title;
    w.el.querySelector('.win-x').title = t('closeWin');
    w.el.querySelector('.win-snap').title = t('snapWin');
    w.el.querySelector('.win-grip').title = t('resizeWin');
  }
  window.hub.savePrefs({ lang: LANG });
}

document.getElementById('theme').addEventListener('click', () => applyTheme(theme === 'dark' ? 'light' : 'dark'));
document.getElementById('lang').addEventListener('click', () => applyLang(LANG === 'es' ? 'en' : 'es'));

// ---------- arranque ----------
(async function init() {
  const info = await window.hub.init();
  folder = info.folder;
  agents = info.agents;
  logFile = info.logFile;
  folderEl.textContent = folder;
  folderEl.title = folder;
  applyTheme(info.theme, info.palette);
  LANG = info.lang;
  applyLang(info.lang);
  say(t('start'));
  if (info.layout) await restoreLayout(info.layout);
  // El consumo lanza `claude -p` y compania: si corre junto a la restauracion,
  // le roba CPU a las consolas que estan arrancando.
  setTimeout(readUsage, 3000);
})();

function paintAgents() {
  agentsEl.textContent = '';
  agents.forEach((a, idx) => {
    const b = document.createElement('button');
    const installable = !a.available && a.install;
    b.className = 'btn' + (a.available ? '' : installable ? ' install' : ' unknown');
    b.style.setProperty('--i', idx);
    const tagText = a.tagKey ? t(a.tagKey) : (a.tag ? t(a.tag) : '');
    const tag = a.available ? tagText : installable ? t('toInstall') : t('notInstalled');
    b.innerHTML = `${a.title}<span class="tag">${tag}</span>`;
    b.title = a.available ? a.path
      : installable ? t('installHint', t(a.install.howKey), a.install.cmd)
      : (a.note || t('notInPath', a.exe));
    b.addEventListener('click', () => (installable ? installAgent(a) : openAgent(a)));
    agentsEl.appendChild(b);
  });
}

async function installAgent(agent) {
  if (!(await window.hub.confirmInstall(agent.id))) return say(t('installCancelled'));
  say(t('installing', agent.title));
  await openAgent(agent, { install: true });
  for (let i = 0; i < 45; i++) {
    await new Promise((r) => setTimeout(r, 4000));
    agents = await window.hub.detect();
    paintAgents();
    if (agents.find((a) => a.id === agent.id)?.available) return say(t('installed', agent.title));
  }
  say(t('installStuck', agent.title), true);
}

async function redetect(maxAge = 0) {
  if (maxAge === 0) spinBtn('redetect');
  say(t('searching'));
  agents = await window.hub.detect(maxAge);
  paintAgents();
  const ok = agents.filter((a) => a.available).map((a) => a.title);
  say(ok.length ? t('detected', ok.join(', ')) : t('noneDetected'));
}
document.getElementById('redetect').addEventListener('click', () => redetect());
// El foco llega muchas veces (y una al abrir): basta con una deteccion reciente.
window.addEventListener('focus', () => { if (agents.length) redetect(30000); });

document.getElementById('browse').addEventListener('click', async () => {
  const f = await window.hub.pickFolder(folder);
  if (!f) return;
  folder = f;
  folderEl.textContent = f;
  folderEl.title = f;
  say(t('folderSet', f));
});
document.getElementById('tile').addEventListener('click', () => { autoGrid = true; regrid(); say(t('autoTile')); });
document.getElementById('cascade').addEventListener('click', cascade);
document.getElementById('logbtn').addEventListener('click', () => say(t('logPath', logFile)));

// ---------- abrir un agente ----------
async function openAgent(agent, { install = false, restore = null, resume = false } = {}) {
  const id = `w${++seq}`;
  const { el, body, subEl } = buildWindow(id, agent, install);
  desk.appendChild(el);

  const term = new Terminal({
    fontFamily: 'Consolas, "Cascadia Mono", monospace',
    fontSize: 13, theme: TERM_THEME[palette][theme], cursorBlink: true, scrollback: 5000, allowProposedApi: true,
  });
  const fit = new FitAddon.FitAddon();
  term.loadAddon(fit);
  term.open(body);

  // Registrar antes de colocar: focusWin busca la ventana en el mapa.
  const rec = { el, term, fit, agent, install, zone: null, alive: true };
  wins.set(id, rec);

  // Al terminar cualquier animacion de tamano o posicion, recalcula xterm.
  el.addEventListener('transitionend', (ev) => {
    if (ev.target === el && (ev.propertyName === 'width' || ev.propertyName === 'height' || ev.propertyName === 'left' || ev.propertyName === 'top')) {
      fitWin(rec);
    }
  });
  el.addEventListener('animationend', (ev) => {
    if (ev.target === el) fitWin(rec);
  });

  placeNew(rec, restore);
  focusWin(id);
  fitWin(rec);
  refreshCount();

  try {
    const { pid, exe } = await window.hub.spawn({
      id, agentId: agent.id, cwd: folder, cols: term.cols, rows: term.rows, install, resume,
    });
    subEl.textContent = (pid ? `pid ${pid} · ` : '') + exe;
    subEl.title = exe;
    if (!install) say(t('opened', agent.title, folder));
  } catch (e) {
    rec.alive = false;
    el.classList.add('dead');
    // El proceso principal manda codigos 'i18n:clave' para poder traducirlos.
    const why = e.message.startsWith('i18n:') ? t(e.message.slice(5)) : e.message;
    term.writeln(`\x1b[31m  ${t('cannotOpen', why)}\x1b[0m`);
    window.hub.log(`spawn fallo ${agent.id}: ${e.message}`, 'ERROR');
    say(why, true);
    return;
  }

  term.onData((d) => window.hub.write(id, d));
  term.focus();
  saveLayout();
}

window.hub.onData(({ id, data }) => wins.get(id)?.term.write(data));
window.hub.onExit(({ id, code }) => {
  const w = wins.get(id);
  if (!w) return;
  w.alive = false;
  w.el.classList.add('dead');
  w.term.writeln(`\r\n\x1b[90m  ${t('sessionEnded', code)}\x1b[0m`);
});

// ---------- ventana ----------
function buildWindow(id, agent, install = false) {
  const el = document.createElement('section');
  el.className = 'win' + (install ? ' installing' : '');
  el.dataset.id = id;

  const bar = document.createElement('div');
  bar.className = 'win-bar';
  const titleEl = document.createElement('span');
  titleEl.className = 'win-title';
  titleEl.textContent = install ? t('installWin', agent.title) : agent.title;
  const subEl = document.createElement('span');
  subEl.className = 'win-sub';
  subEl.textContent = t('starting');

  const snapBtn = document.createElement('button');
  snapBtn.className = 'win-snap';
  snapBtn.textContent = '⊞';
  snapBtn.title = t('snapWin');
  snapBtn.addEventListener('click', (ev) => { ev.stopPropagation(); openPicker(id, snapBtn); });

  const x = document.createElement('button');
  x.className = 'win-x';
  x.textContent = '✕';
  x.title = t('closeWin');
  x.addEventListener('click', (ev) => { ev.stopPropagation(); closeWin(id); });

  bar.append(titleEl, subEl, snapBtn, x);
  // Doble clic en la barra: ocupar todo / volver a como estaba.
  bar.addEventListener('dblclick', (ev) => {
    if (ev.target === x || ev.target === snapBtn) return;
    const w = wins.get(id);
    if (!w) return;
    if (zones.length === 1 && w.zone === 0) { autoGrid = true; regrid(); say(t('restored')); }
    else setLayout('full', id, 0);
  });

  const body = document.createElement('div');
  body.className = 'win-body';
  const grip = document.createElement('div');
  grip.className = 'win-grip';
  grip.title = t('resizeWin');

  el.append(bar, body, grip);
  el.addEventListener('mousedown', () => focusWin(id));
  makeDraggable(id, el, bar);
  makeResizable(id, el, grip);
  return { el, body, subEl };
}

function closeWin(id) {
  const w = wins.get(id);
  if (!w) return;
  window.hub.kill(id);
  w.term.dispose();
  w.el.remove();
  wins.delete(id);
  if (autoGrid) regrid(); else { compactZones(); applyZones(); }
  refreshCount();
  saveLayout();
  say(t('closed'));
}

function focusWin(id) {
  for (const [wid, w] of wins) w.el.classList.toggle('active', wid === id);
  const w = wins.get(id);
  if (!w) return;
  w.el.style.zIndex = ++zTop;
  // Al hacer clic en una consola queda lista para escribir, sin clic extra.
  try { w.term.focus(); } catch { /* aun abriendo */ }
}

// ---------- zonas ----------
function zoneRect(z) {
  const d = deskBox();
  return {
    left: z[0] * d.width + GAP / 2, top: z[1] * d.height + GAP / 2,
    width: z[2] * d.width - GAP, height: z[3] * d.height - GAP,
  };
}

// El ResizeObserver no es fiable (Chromium frena el renderizado cuando la
// ventana no esta al frente), asi que el ajuste se pide explicitamente
// despues de cada cambio de tamano. Doble pasada + cierre post-transicion.
function fitWin(w) {
  if (!w?.fit) return;
  const go = () => {
    try {
      w.fit.fit();
      const id = [...wins.entries()].find(([, v]) => v === w)?.[0];
      if (id) window.hub.resize(id, w.term.cols, w.term.rows);
    } catch { /* ventana cerrandose */ }
  };
  go();
  requestAnimationFrame(go);
  clearTimeout(w._fitTimer);
  w._fitTimer = setTimeout(go, 240);
}
const fitAll = () => { for (const w of wins.values()) fitWin(w); };

function applyZones() {
  for (const w of wins.values()) {
    if (w.zone == null || !zones[w.zone]) { w.el.classList.remove('snapped'); continue; }
    const r = zoneRect(zones[w.zone]);
    w.el.classList.add('snapped');
    Object.assign(w.el.style, {
      left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`,
    });
  }
  renderDividers();
  fitAll();
}

// Reparte en zonas libres las ventanas que no tienen una.
function fillZones() {
  const taken = new Set([...wins.values()].map((w) => w.zone).filter((z) => z != null));
  const free = zones.map((_, i) => i).filter((i) => !taken.has(i));
  for (const w of wins.values()) {
    if (w.zone != null) continue;
    const i = free.shift();
    if (i === undefined) break;
    w.zone = i;
  }
}

// Al cerrar una consola acoplada, las demas se corren para no dejar huecos.
function compactZones() {
  [...wins.values()].filter((w) => w.zone != null).sort((a, b) => a.zone - b.zone)
    .forEach((w, i) => { w.zone = i; });
  fillZones();
}

// Sin zonas libres, se parte la zona mas grande por su lado largo y la
// consola nueva ocupa la mitad nueva. Asi nunca queda flotando sobre las demas.
function growZones() {
  if (!zones.length) return null;
  const d = deskBox();
  let bi = 0, best = -1;
  zones.forEach((z, i) => { const a = z[2] * d.width * z[3] * d.height; if (a > best) { best = a; bi = i; } });
  const z = zones[bi];
  if (z[2] * d.width >= z[3] * d.height) {
    const w = z[2] / 2;
    zones[bi] = [z[0], z[1], w, z[3]];
    zones.push([z[0] + w, z[1], w, z[3]]);
  } else {
    const h = z[3] / 2;
    zones[bi] = [z[0], z[1], z[2], h];
    zones.push([z[0], z[1] + h, z[2], h]);
  }
  return zones.length - 1;
}

function gridZones(n) {
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const out = [];
  for (let i = 0; i < n; i++) {
    const c = i % cols, r = Math.floor(i / cols);
    const inRow = Math.min(cols, n - r * cols); // la ultima fila reparte el ancho
    out.push([c / inRow, r / rows, 1 / inRow, 1 / rows]);
  }
  return out;
}

function regrid() {
  const list = [...wins.values()];
  if (!list.length) { zones = []; renderDividers(); return; }
  zones = gridZones(list.length);
  list.forEach((w, i) => { w.zone = i; });
  applyZones();
  saveLayout();
}

function setLayout(key, winId, zoneIndex) {
  autoGrid = false;
  zones = LAYOUTS[key].zones.map((z) => z.slice());
  for (const w of wins.values()) w.zone = null;
  const w = wins.get(winId);
  if (w) w.zone = zoneIndex;
  fillZones();
  applyZones();
  saveLayout();
  say(layoutName(key));
}

function cascade() {
  autoGrid = false;
  zones = [];
  const d = deskBox();
  const w = Math.min(720, d.width * .7), h = Math.min(460, d.height * .7);
  [...wins.values()].forEach((win, i) => {
    win.zone = null;
    win.el.classList.remove('snapped');
    Object.assign(win.el.style, {
      left: `${clamp(20 + i * 30, 0, d.width - w)}px`, top: `${clamp(16 + i * 28, 0, d.height - h)}px`,
      width: `${w}px`, height: `${h}px`, zIndex: ++zTop,
    });
  });
  renderDividers();
  fitAll();
  saveLayout();
  say(t('cascadeMsg'));
}

// Atajos: Ctrl+Alt+flechas acoplan la consola activa, como Win+flechas en Windows.
document.addEventListener('keydown', (e) => {
  if (!e.ctrlKey || !e.altKey) return;
  const map = { ArrowLeft: ['2col', 0], ArrowRight: ['2col', 1], ArrowUp: ['full', 0], ArrowDown: ['2row', 1] };
  const target = map[e.key];
  if (!target) return;
  const active = [...wins].find(([, w]) => w.el.classList.contains('active'));
  if (!active) return;
  e.preventDefault();
  setLayout(target[0], active[0], target[1]);
});

function placeNew(rec, restore) {
  const d = deskBox();
  if (restore) {
    if (restore.zone != null && zones[restore.zone]) { rec.zone = restore.zone; return applyZones(); }
    if (restore.rect) {
      const [x, y, w, h] = restore.rect;
      Object.assign(rec.el.style, {
        left: `${x * d.width}px`, top: `${y * d.height}px`,
        width: `${w * d.width}px`, height: `${h * d.height}px`,
      });
      return;
    }
  }
  if (autoGrid) return regrid();
  if (zones.length) {
    const taken = new Set([...wins.values()].map((w) => w.zone).filter((z) => z != null));
    const free = zones.findIndex((_, i) => !taken.has(i));
    rec.zone = free >= 0 ? free : growZones();
    return applyZones();
  }
  const n = wins.size - 1;
  const w = Math.min(640, Math.max(320, d.width / 2 - 24));
  const h = Math.min(420, Math.max(200, d.height / 2 - 24));
  Object.assign(rec.el.style, {
    width: `${w}px`, height: `${h}px`,
    left: `${clamp(24 + (n % 6) * 28, 0, Math.max(0, d.width - w))}px`,
    top: `${clamp(20 + (n % 6) * 26, 0, Math.max(0, d.height - h))}px`,
  });
}

// ---------- acople al arrastrar ----------
const preview = document.createElement('div');
preview.className = 'snap-preview';
desk.appendChild(preview);

function edgeTarget(px, py, d) {
  const left = px < EDGE, right = px > d.width - EDGE;
  const top = py < EDGE, bottom = py > d.height - EDGE;
  const upper = py < d.height * .3, lower = py > d.height * .7;
  if (left && upper) return ['2x2', 0];
  if (right && upper) return ['2x2', 1];
  if (left && lower) return ['2x2', 2];
  if (right && lower) return ['2x2', 3];
  if (left) return ['2col', 0];
  if (right) return ['2col', 1];
  if (top) return ['full', 0];
  if (bottom) return ['2row', 1];
  return null;
}

function showPreview(key, idx) {
  const r = zoneRect(LAYOUTS[key].zones[idx]);
  Object.assign(preview.style, {
    display: 'block', left: `${r.left}px`, top: `${r.top}px`,
    width: `${r.width}px`, height: `${r.height}px`,
  });
}
const hidePreview = () => { preview.style.display = 'none'; };

function makeDraggable(id, el, handle) {
  handle.addEventListener('pointerdown', (e) => {
    if (e.target.classList.contains('win-x') || e.target.classList.contains('win-snap')) return;
    const r = el.getBoundingClientRect(), d = deskBox();
    const offX = e.clientX - r.left, offY = e.clientY - r.top;
    let target = null;
    handle.setPointerCapture(e.pointerId);
    el.classList.add('dragging');

    const move = (ev) => {
      const px = ev.clientX - d.left, py = ev.clientY - d.top;
      target = edgeTarget(px, py, d);
      if (target) showPreview(target[0], target[1]); else hidePreview();
      el.style.left = `${clamp(px - offX, -20, d.width - 60)}px`;
      el.style.top = `${clamp(py - offY, 0, d.height - 30)}px`;
    };
    const up = () => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', up);
      el.classList.remove('dragging');
      hidePreview();
      const w = wins.get(id);
      if (target) {
        setLayout(target[0], id, target[1]);
      } else if (w && w.zone != null) {
        // sacada de su zona: vuelve a flotar y se apaga el mosaico automatico
        autoGrid = false;
        w.zone = null;
        w.el.classList.remove('snapped');
        applyZones();
        fitWin(w);
        saveLayout();
      } else {
        if (w) fitWin(w);
        saveLayout();
      }
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up);
  });
}

function makeResizable(id, el, grip) {
  grip.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    const r = el.getBoundingClientRect(), d = deskBox();
    const x0 = e.clientX, y0 = e.clientY, w0 = r.width, h0 = r.height;
    grip.setPointerCapture(e.pointerId);
    el.classList.add('resizing');
    const w = wins.get(id);
    if (w && w.zone != null) { w.zone = null; el.classList.remove('snapped'); }
    let pending = false;
    const move = (ev) => {
      el.style.width = `${clamp(w0 + ev.clientX - x0, 280, d.width - el.offsetLeft)}px`;
      el.style.height = `${clamp(h0 + ev.clientY - y0, 160, d.height - el.offsetTop)}px`;
      if (!pending) {
        pending = true;
        requestAnimationFrame(() => { pending = false; fitWin(wins.get(id)); });
      }
    };
    const up = () => {
      grip.removeEventListener('pointermove', move);
      grip.removeEventListener('pointerup', up);
      el.classList.remove('resizing');
      fitWin(wins.get(id));
      saveLayout();
    };
    grip.addEventListener('pointermove', move);
    grip.addEventListener('pointerup', up);
  });
}

// ---------- bordes compartidos ----------
function renderDividers() {
  desk.querySelectorAll('.divider').forEach((el) => el.remove());
  if (!zones.length) return;
  const used = new Set([...wins.values()].map((w) => w.zone).filter((z) => z != null));
  if (used.size < 2) return;
  const d = deskBox();

  const build = (vertical) => {
    const key = vertical ? 0 : 1, size = vertical ? 2 : 3;
    const values = new Set();
    zones.forEach((z, i) => { if (used.has(i) && z[key] > EPS) values.add(z[key].toFixed(4)); });
    for (const v of values) {
      const at = parseFloat(v);
      const after = zones.filter((z, i) => used.has(i) && near(z[key], at));
      const before = zones.filter((z, i) => used.has(i) && near(z[key] + z[size], at));
      if (!after.length || !before.length) continue;
      const ok = key === 0 ? 1 : 0, os = key === 0 ? 3 : 2;
      const a = Math.min(...[...after, ...before].map((z) => z[ok]));
      const b = Math.max(...[...after, ...before].map((z) => z[ok] + z[os]));
      const el = document.createElement('div');
      el.className = 'divider ' + (vertical ? 'v' : 'h');
      Object.assign(el.style, vertical
        ? { left: `${at * d.width - 3}px`, top: `${a * d.height}px`, height: `${(b - a) * d.height}px` }
        : { top: `${at * d.height - 3}px`, left: `${a * d.width}px`, width: `${(b - a) * d.width}px` });
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        el.setPointerCapture(e.pointerId);
        for (const w of wins.values()) w.el.classList.add('resizing');
        const move = (ev) => {
          const box = deskBox();
          const f = vertical ? (ev.clientX - box.left) / box.width : (ev.clientY - box.top) / box.height;
          const lo = Math.max(...before.map((z) => z[key])) + .12;
          const hi = Math.min(...after.map((z) => z[key] + z[size])) - .12;
          const nf = clamp(f, lo, hi);
          before.forEach((z) => { z[size] = nf - z[key]; });
          after.forEach((z) => { z[size] += z[key] - nf; z[key] = nf; });
          applyZones();
        };
        const up = () => {
          el.removeEventListener('pointermove', move);
          el.removeEventListener('pointerup', up);
          for (const w of wins.values()) w.el.classList.remove('resizing');
          fitAll();
          saveLayout();
        };
        el.addEventListener('pointermove', move);
        el.addEventListener('pointerup', up);
      });
      desk.appendChild(el);
    }
  };
  build(true);
  build(false);
}

// ---------- selector de plantillas ----------
let picker = null;
function closePicker() { picker?.remove(); picker = null; }
document.addEventListener('click', (e) => { if (picker && !picker.contains(e.target)) closePicker(); });

function openPicker(winId, anchor) {
  closePicker();
  picker = document.createElement('div');
  picker.className = 'picker';
  for (const [key, def] of Object.entries(LAYOUTS)) {
    const box = document.createElement('div');
    box.className = 'ptpl';
    box.title = layoutName(key);
    def.zones.forEach(([x, y, w, h], i) => {
      const cell = document.createElement('span');
      Object.assign(cell.style, {
        left: `${x * 100}%`, top: `${y * 100}%`, width: `${w * 100}%`, height: `${h * 100}%`,
      });
      cell.addEventListener('click', (ev) => { ev.stopPropagation(); closePicker(); setLayout(key, winId, i); });
      box.appendChild(cell);
    });
    picker.appendChild(box);
  }
  const r = anchor.getBoundingClientRect(), d = deskBox();
  picker.style.left = `${clamp(r.left - d.left - 60, 4, d.width - 230)}px`;
  picker.style.top = `${r.bottom - d.top + 6}px`;
  desk.appendChild(picker);
}

// ---------- persistencia ----------
let saveTimer = null;
function saveLayout() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const d = deskBox();
    const list = [...wins.values()].filter((w) => !w.install).map((w) => {
      const r = w.el.getBoundingClientRect();
      return {
        agentId: w.agent.id, zone: w.zone,
        rect: [(r.left - d.left) / d.width, (r.top - d.top) / d.height, r.width / d.width, r.height / d.height],
      };
    });
    window.hub.saveLayout({ autoGrid, zones, wins: list });
  }, 600);
}

function restoreLayout(saved) {
  if (!saved?.wins?.length) return;
  autoGrid = Boolean(saved.autoGrid);
  zones = (saved.zones || []).map((z) => z.slice());
  say(t('restoring', saved.wins.length));
  return (async () => {
    for (const w of saved.wins) {
      const agent = agents.find((a) => a.id === w.agentId);
      if (!agent?.available) continue;
      // Al reabrir la app cada consola retoma su ultima conversacion; las que se
      // abren a mano con los botones siguen empezando de cero.
      await openAgent(agent, { restore: { zone: w.zone, rect: w.rect }, resume: true });
    }
    applyZones();
  })();
}

// ---------- consumo por agente ----------
const usageCards = document.getElementById('usage-cards');
const usageAt = document.getElementById('usage-at');
let usageBusy = false;

function card(cls, who, inner, idx = 0, pct = null) {
  const d = document.createElement('div');
  d.className = 'ucard ' + cls;
  d.style.setProperty('--i', idx);
  if (pct !== null && !isNaN(pct)) {
    d.style.setProperty('--pct', `${clamp(pct, 0, 100)}%`);
  }
  d.innerHTML = `<span class="who">${who}</span>${inner}`;
  return d;
}

function paintUsage({ rows, at }) {
  usageCards.textContent = '';
  if (!rows.length) usageCards.append(card('wait', '', `<span class="of">${t('noUsage')}</span>`, 0));
  rows.forEach((r, idx) => {
    const err = r.errorKey ? t(r.errorKey) : r.error;
    if (err) { usageCards.append(card('bad', r.title, `<span class="of">${err}</span>`, idx, 100)); return; }
    // El porcentaje mas alto manda el color: es el limite que se agota primero.
    const nums = r.parts.map((p) => parseFloat(p.v)).filter((n) => !isNaN(n));
    const pct = r.unit === 'used' && nums.length ? Math.max(...nums) : null;
    const cls = pct === null ? '' : pct >= 90 ? 'bad' : pct >= 75 ? 'low' : '';
    // Etiqueta primero y luego el numero: "sesion 50%" se lee mejor en ambos idiomas.
    const body = r.parts
      .map((p) => `<span class="of">${p.raw || t(p.k)}</span><span class="num">${p.v}</span>`)
      .join('<span class="dot">·</span>');
    const unit = t(r.unit);
    const el = card(cls, r.title, body + (unit ? `<span class="of">${unit}</span>` : ''), idx, pct);
    el.title = r.detail ? t(r.detail.key, ...r.detail.args) : (r.raw || '');
    usageCards.append(el);
  });
  usageAt.textContent = t('at', new Date(at).toLocaleTimeString(LANG === 'en' ? 'en-US' : 'es-CL',
    { hour: '2-digit', minute: '2-digit' }));
}

async function readUsage() {
  if (usageBusy) return;
  usageBusy = true;
  spinBtn('usage-refresh');
  usageAt.textContent = t('checking');
  try {
    lastUsage = await window.hub.usage();
    paintUsage(lastUsage);
  } catch (e) {
    usageAt.textContent = '—';
    window.hub.log(`consumo fallo: ${e.message}`, 'ERROR');
  } finally {
    usageBusy = false;
  }
}
document.getElementById('usage-refresh').addEventListener('click', readUsage);
setInterval(readUsage, 10 * 60 * 1000);

window.addEventListener('resize', () => { applyZones(); fitAll(); });
// Red de seguridad: si algo cambia de tamano sin pasar por aqui, se corrige solo.
setInterval(() => {
  for (const w of wins.values()) {
    const d = w.fit.proposeDimensions();
    if (d && (d.cols !== w.term.cols || d.rows !== w.term.rows)) fitWin(w);
  }
}, 1500);