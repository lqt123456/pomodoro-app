const { app, BrowserWindow, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let mainWindow;
let tray;
let isQuitting = false;

const WORK_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;
const LONG_BREAK_TIME = 15 * 60;
const CYCLES_BEFORE_LONG_BREAK = 4;

let timeLeft = WORK_TIME;
let isRunning = false;
let isWork = true;
let completedCycles = 0;
let timerInterval = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 320,
    height: 420,
    resizable: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  const iconPath = path.join(__dirname, 'icon.png');
  let trayIcon;

  try {
    trayIcon = nativeImage.createFromPath(iconPath);
    if (trayIcon.isEmpty()) {
      trayIcon = nativeImage.createEmpty();
    }
  } catch (e) {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    { label: '显示', click: () => mainWindow.show() },
    { label: '退出', click: () => { isQuitting = true; app.quit(); } }
  ]);

  tray.setToolTip('番茄钟');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateDisplay() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update', {
      time: formatTime(timeLeft),
      isWork,
      isRunning,
      progress: isWork ? (WORK_TIME - timeLeft) / WORK_TIME : (BREAK_TIME - timeLeft) / BREAK_TIME,
      cycles: completedCycles
    });
  }
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);

  isRunning = true;
  timerInterval = setInterval(() => {
    timeLeft--;
    updateDisplay();

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      isRunning = false;

      if (isWork) {
        completedCycles++;
        isWork = false;
        timeLeft = completedCycles % CYCLES_BEFORE_LONG_BREAK === 0 ? LONG_BREAK_TIME : BREAK_TIME;
      } else {
        isWork = true;
        timeLeft = WORK_TIME;
      }

      updateDisplay();
      new Notification({
        title: '番茄钟',
        body: isWork ? '休息结束，开始工作！' : '工作结束，休息一下吧！'
      }).show();
    }
  }, 1000);

  updateDisplay();
}

function pauseTimer() {
  if (timerInterval) clearInterval(timerInterval);
  isRunning = false;
  updateDisplay();
}

function resetTimer() {
  if (timerInterval) clearInterval(timerInterval);
  isRunning = false;
  isWork = true;
  timeLeft = WORK_TIME;
  completedCycles = 0;
  updateDisplay();
}

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('before-quit', () => {
  isQuitting = true;
});

const { ipcMain, Notification } = require('electron');

ipcMain.on('start', () => startTimer());
ipcMain.on('pause', () => pauseTimer());
ipcMain.on('reset', () => resetTimer());