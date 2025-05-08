import { app, BrowserWindow, globalShortcut } from "electron";
process.env.APP_PATH = app.getAppPath() + "/";
process.env.IS_ELECTRON = "true";
process.env.DOWNLOAD_PATH = app.getPath("downloads");

await import("../server/index");
let mainWindow: BrowserWindow;
const port = parseInt(process.env.PORT) || 29848;

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: import.meta.dirname + "/preload.js",
            nodeIntegration: true,
            contextIsolation: false,
            devTools: true,
        },
        resizable: true,
        title: "VoidTube",
        icon: app.getAppPath() + "/public/favicon.png",
    });

    mainWindow.loadURL(`http://localhost:${port}`);

    mainWindow.on('minimize', () => {
        mainWindow.minimize();
    });

    registerShortcut("F12", () => {
        mainWindow.webContents.toggleDevTools();
    });
};

app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

function registerShortcut(key: string, callback: () => void) {
    app.on("browser-window-focus", () => globalShortcut.register(key, callback));
    app.on("browser-window-blur", () => globalShortcut.unregister(key));
}