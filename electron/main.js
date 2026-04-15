const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('./database');

let mainWindow;
let db;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  // Initialize database
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'action-items.db');
  db = new Database(dbPath);

  // Register IPC handlers
  ipcMain.handle('db:createParty', async (_, name) => {
    return db.createParty(name);
  });

  ipcMain.handle('db:getParties', async () => {
    return db.getParties();
  });

  ipcMain.handle('db:createItem', async (_, text, partyIds) => {
    return db.createItem(text, partyIds);
  });

  ipcMain.handle('db:getItemsByParty', async (_, partyId) => {
    return db.getItemsByParty(partyId);
  });

  ipcMain.handle('db:getAllItems', async () => {
    return db.getAllItems();
  });

  ipcMain.handle('db:updateItemText', async (_, itemId, text) => {
    return db.updateItemText(itemId, text);
  });

  ipcMain.handle('db:setItemCompletion', async (_, itemId, isCompleted) => {
    return db.setItemCompletion(itemId, isCompleted);
  });

  ipcMain.handle('db:addPartyToItem', async (_, itemId, partyId) => {
    return db.addPartyToItem(itemId, partyId);
  });

  ipcMain.handle('db:removePartyFromItem', async (_, itemId, partyId) => {
    return db.removePartyFromItem(itemId, partyId);
  });

  ipcMain.handle('db:getItemById', async (_, itemId) => {
    return db.getItemById(itemId);
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
