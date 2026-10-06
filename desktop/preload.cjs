const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('panelDesktop',Object.freeze({
  connect:address=>ipcRenderer.invoke('panel:connect',address),
  local:()=>ipcRenderer.invoke('panel:local')
}));
