const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  reconectar: () => ipcRenderer.send('app:reconectar'),
  abrirConfiguracoes: () => ipcRenderer.send('app:recarregar'),
  plataforma: process.platform,
  versaoApp: '1.0.0'
});
