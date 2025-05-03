const { ipcRenderer } = require('electron');

// contextBridge.exposeInMainWorld('electronAPI', {
//     downloadVideo: (url) => ipcRenderer.invoke('download-video', url),
// });

// console.log("preload.js")

// (window as any).electronAPI = {
//     downloadVideo: (url) => ipcRenderer.invoke('download-video', url),
// }