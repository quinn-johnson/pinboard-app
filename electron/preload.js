const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  createParty: (name) => ipcRenderer.invoke('db:createParty', name),
  getParties: () => ipcRenderer.invoke('db:getParties'),
  createItem: (text, partyIds) => ipcRenderer.invoke('db:createItem', text, partyIds),
  getItemsByParty: (partyId) => ipcRenderer.invoke('db:getItemsByParty', partyId),
  getAllItems: () => ipcRenderer.invoke('db:getAllItems'),
  updateItemText: (itemId, text) => ipcRenderer.invoke('db:updateItemText', itemId, text),
  setItemCompletion: (itemId, isCompleted) => ipcRenderer.invoke('db:setItemCompletion', itemId, isCompleted),
  addPartyToItem: (itemId, partyId) => ipcRenderer.invoke('db:addPartyToItem', itemId, partyId),
  removePartyFromItem: (itemId, partyId) => ipcRenderer.invoke('db:removePartyFromItem', itemId, partyId),
  getItemById: (itemId) => ipcRenderer.invoke('db:getItemById', itemId)
});
