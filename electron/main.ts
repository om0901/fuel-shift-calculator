import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';

let mainWindow: BrowserWindow | null = null;

const DATA_DIR = path.join(app.getPath('userData'), 'FuelShiftTally');
const DATA_FILE = path.join(DATA_DIR, 'shift_data.json');

function ensureDataStore(): { shifts: unknown[]; rates: unknown | null } {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      const initial = { shifts: [], rates: null };
      fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to access local file store:', err);
    return { shifts: [], rates: null };
  }
}

function writeDataStore(data: { shifts: unknown[]; rates: unknown | null }) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write to local file store:', err);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 900,
    minHeight: 650,
    backgroundColor: '#0F172A',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    autoHideMenuBar: true,
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Register IPC Handlers
ipcMain.handle('db:get-shifts', async () => {
  const store = ensureDataStore();
  return store.shifts || [];
});

ipcMain.handle('db:save-shift', async (_event, record: { id: string }) => {
  const store = ensureDataStore();
  const shifts = Array.isArray(store.shifts) ? store.shifts : [];
  const updated = [record, ...shifts.filter((s: any) => s.id !== record.id)];
  store.shifts = updated;
  writeDataStore(store);
  return true;
});

ipcMain.handle('db:update-shift', async (_event, record: { id: string }) => {
  const store = ensureDataStore();
  const shifts = Array.isArray(store.shifts) ? store.shifts : [];
  store.shifts = shifts.map((s: any) => (s.id === record.id ? record : s));
  writeDataStore(store);
  return true;
});

ipcMain.handle('db:delete-shift', async (_event, id: string) => {
  const store = ensureDataStore();
  const shifts = Array.isArray(store.shifts) ? store.shifts : [];
  store.shifts = shifts.filter((s: any) => s.id !== id);
  writeDataStore(store);
  return true;
});

ipcMain.handle('db:clear-shifts', async () => {
  const store = ensureDataStore();
  store.shifts = [];
  writeDataStore(store);
  return true;
});

ipcMain.handle('config:get-rates', async () => {
  const store = ensureDataStore();
  return store.rates || null;
});

ipcMain.handle('config:save-rates', async (_event, rates: unknown) => {
  const store = ensureDataStore();
  store.rates = rates;
  writeDataStore(store);
  return true;
});

app.whenReady().then(() => {
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
