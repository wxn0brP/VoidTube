import { app, BrowserWindow, globalShortcut, ipcMain } from "electron";
import { Logger } from "@wxn0brp/wts-logger";
import "../server/index";

const logger = new Logger();

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
        resizable: true
    });

    mainWindow.loadURL(`http://localhost:${port}`);

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

ipcMain.handle("download-video", async (event, url) => {
    try {
        logger.info(`Downloading video: ${url}`);
    } catch (error) {
        logger.error(`Error while downloading video: ${error.message}`);
        return { success: false, error: error.message };
    }
});

function registerShortcut(key, callback) {
    app.on("browser-window-focus", () => globalShortcut.register(key, callback));
    app.on("browser-window-blur", () => globalShortcut.unregister(key));
}