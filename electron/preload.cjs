const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("AReaderDesktop", {
  platform: process.platform,
  desktop: true,
  minimize: () => ipcRenderer.send("win:minimize"),
  maximize: () => ipcRenderer.send("win:maximize"),
  close:    () => ipcRenderer.send("win:close"),
});
