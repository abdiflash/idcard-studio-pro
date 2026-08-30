const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const CameraBridge = require('./camera-bridge');
const LicenseManager = require('./license-manager');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1280,
    minHeight: 800,
    title: "ID Card Studio Pro (Standalone)",
    icon: path.join(__dirname, '../../build/icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.setMenu(null);
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('camera:check', async () => CameraBridge.checkConnection());
ipcMain.handle('camera:set', async (_, param, val) => CameraBridge.setSetting(param, val));
ipcMain.handle('camera:capture', async () => CameraBridge.capture());
ipcMain.handle('license:getHWID', () => LicenseManager.getHWID());
ipcMain.handle('license:verify', (_, key, hwid) => LicenseManager.verifyKey(key, hwid));
