const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("campfireApp", {
  toggleFullscreen: () => ipcRenderer.send("toggle-fullscreen"),
});
