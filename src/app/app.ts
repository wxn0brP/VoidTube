import { app, BrowserWindow, globalShortcut } from "electron";
process.env.APP_PATH = app.getAppPath() + "/";
process.env.IS_ELECTRON = "true";
process.env.DOWNLOAD_PATH = app.getPath("downloads");

await import("../server/index");

const port = parseInt(process.env.PORT) || 29848;

const windows: Set<BrowserWindow> = new Set();
const debounceCreateWindow = debounce((url: string) => {
    createWindow(url);
});

function createWindow(url = `http://localhost:${port}`): BrowserWindow {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: import.meta.dirname + "/preload.js",
            nodeIntegration: true,
            contextIsolation: true,
            devTools: true,
            backgroundThrottling: false,
        },
        resizable: true,
        title: "VoidTube",
        icon: app.getAppPath() + "/public/favicon.png",
    });

    win.loadURL(url);
    win.maximize();

    registerShortcut("F12", () => {
        win.webContents.toggleDevTools();
    });

    win.webContents.setWindowOpenHandler(({ url }) => {
        debounceCreateWindow(url);
        return { action: "deny" };
    });

    windows.add(win);

    win.on("closed", () => {
        windows.delete(win);
    });

    return win;
}

app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
        if (windows.size === 0) {
            createWindow();
        }
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin" && windows.size === 0) {
        app.quit();
    }
});

function registerShortcut(key: string, callback: () => void) {
    app.on("browser-window-focus", () => globalShortcut.register(key, callback));
    app.on("browser-window-blur", () => globalShortcut.unregister(key));
}

function debounce(func: Function, wait: number = 100) {
    let timeout: NodeJS.Timeout;
    return (...args: any) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}