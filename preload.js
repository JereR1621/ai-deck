const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('hub', {
  init: () => ipcRenderer.invoke('app:init'),
  detect: (maxAge) => ipcRenderer.invoke('agents:detect', maxAge),
  confirmInstall: (agentId) => ipcRenderer.invoke('agent:confirm-install', agentId),
  usage: () => ipcRenderer.invoke('usage:read'),
  saveLayout: (layout) => ipcRenderer.send('layout:save', layout),
  savePrefs: (prefs) => ipcRenderer.send('prefs:save', prefs),
  pickFolder: (current) => ipcRenderer.invoke('dialog:folder', current),
  spawn: (opts) => ipcRenderer.invoke('pty:spawn', opts),
  write: (id, data) => ipcRenderer.send('pty:write', { id, data }),
  resize: (id, cols, rows) => ipcRenderer.send('pty:resize', { id, cols, rows }),
  kill: (id) => ipcRenderer.send('pty:kill', { id }),
  log: (msg, level) => ipcRenderer.send('log', { msg, level }),
  onData: (cb) => ipcRenderer.on('pty:data', (_e, p) => cb(p)),
  onExit: (cb) => ipcRenderer.on('pty:exit', (_e, p) => cb(p)),
});
