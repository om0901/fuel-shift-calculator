import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  isDesktop: true,
  saveRecord: (record: unknown) => ipcRenderer.invoke('db:save-shift', record),
  getRecords: () => ipcRenderer.invoke('db:get-shifts'),
  updateRecord: (record: unknown) => ipcRenderer.invoke('db:update-shift', record),
  deleteRecord: (id: string) => ipcRenderer.invoke('db:delete-shift', id),
  clearRecords: () => ipcRenderer.invoke('db:clear-shifts'),
  saveConfig: (rates: unknown) => ipcRenderer.invoke('config:save-rates', rates),
  getConfig: () => ipcRenderer.invoke('config:get-rates'),
});
