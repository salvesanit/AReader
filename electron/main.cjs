const { app, BrowserWindow, Menu, shell, screen, globalShortcut, ipcMain } = require("electron");
const path = require("path");

const isDev = !app.isPackaged;

function createWindow() {
  /* ── Get the primary display size so the window opens maximised ── */
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const win = new BrowserWindow({
    width,
    height,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#EDEBE6",

    /* ── No menu bar, no title bar frame ── */
    autoHideMenuBar: true,
    frame: false,                 // removes the entire Electron top bar
    titleBarStyle: "hidden",      // macOS: hides title but keeps traffic lights
    titleBarOverlay: false,

    title: "AReader",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false,
    },
  });

  /* ── Completely remove the application menu ── */
  Menu.setApplicationMenu(null);

  /* ── Start maximised, then show ── */
  win.maximize();
  win.once("ready-to-show", () => {
    win.show();
  });

  /* ── F11 toggles true fullscreen ── */
  win.webContents.on("before-input-event", (_event, input) => {
    if (input.key === "F11" && input.type === "keyDown") {
      win.setFullScreen(!win.isFullScreen());
    }
  });

  /* ── External links open in the user's real browser ── */
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  win.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith("file://")) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  /* ── Load the built web app ── */
  const indexPath = path.join(__dirname, "..", "dist", "index.html");
  win.loadFile(indexPath);

  if (isDev) {
    win.webContents.openDevTools({ mode: "detach" });
  }
}

/* ── IPC handlers for frameless window controls ── */
ipcMain.on("win:minimize", (e) => {
  BrowserWindow.fromWebContents(e.sender)?.minimize();
});
ipcMain.on("win:maximize", (e) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  if (!win) return;
  win.isMaximized() ? win.unmaximize() : win.maximize();
});
ipcMain.on("win:close", (e) => {
  BrowserWindow.fromWebContents(e.sender)?.close();
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
