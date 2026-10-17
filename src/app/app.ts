import {
	app,
	BrowserWindow,
	globalShortcut,
	Menu,
	Tray,
	nativeImage,
} from "electron";
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
		return {
			action: "deny",
		};
	});

	windows.add(win);

	win.on("closed", () => {
		windows.delete(win);
	});

	return win;
}

app.whenReady().then(() => {
	createWindow();
	setupTray();

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

let tray: Tray | null = null;
let currentTitle = "";

function getWindow(): BrowserWindow | undefined {
	return [
		...windows,
	].find(win => !win.isDestroyed());
}

function sendCommand(command: string) {
	const win = getWindow();
	if (win) win.webContents.executeJavaScript(command).catch(() => {});
}

function playbackMenuItems(): Electron.MenuItemConstructorOptions[] {
	return [
		{
			label: "Play / Pause",
			click: () => sendCommand("mgl.player.togglePlay()"),
		},
		{
			label: "Next",
			click: () => sendCommand("mgl.player.next()"),
		},
		{
			label: "Previous",
			click: () => sendCommand("mgl.player.prev()"),
		},
	];
}

function toggleWindow() {
	const win = getWindow();
	if (!win) return createWindow();
	win.isVisible() ? win.hide() : win.show();
}

function buildTrayMenu() {
	return Menu.buildFromTemplate([
		{
			label: currentTitle || "Nothing playing",
			enabled: false,
		},
		{
			type: "separator",
		},
		...playbackMenuItems(),
		{
			type: "separator",
		},
		{
			label: "Show / Hide",
			click: toggleWindow,
		},
		{
			type: "separator",
		},
		{
			label: "Quit",
			click: () => app.quit(),
		},
	]);
}

function buildAppMenu() {
	return Menu.buildFromTemplate([
		{
			label: "VoidTube",
			submenu: [
				{
					label: currentTitle || "Now Playing",
					enabled: false,
				},
				{
					type: "separator",
				},
				...playbackMenuItems(),
				{
					type: "separator",
				},
				{
					role: "quit",
				},
			],
		},
		{
			label: "View",
			submenu: [
				{
					role: "reload",
				},
				{
					role: "toggleDevTools",
				},
				{
					type: "separator",
				},
				{
					role: "resetZoom",
				},
				{
					role: "zoomIn",
				},
				{
					role: "zoomOut",
				},
				{
					type: "separator",
				},
				{
					role: "togglefullscreen",
				},
			],
		},
	]);
}

function refreshNowPlaying() {
	const win = getWindow();
	if (!win) return;

	win.webContents
		.executeJavaScript("(mgl.store.video.get() || {}).title || ''")
		.then((title: string) => {
			if (title === currentTitle) return;
			currentTitle = title;
			if (tray) {
				tray.setToolTip(title ? `VoidTube: ${title}` : "VoidTube");
				tray.setContextMenu(buildTrayMenu());
			}
			Menu.setApplicationMenu(buildAppMenu());
		})
		.catch(() => {});
}

function setupTray() {
	const iconPath = app.getAppPath() + "/public/favicon.png";
	tray = new Tray(nativeImage.createFromPath(iconPath));
	tray.setToolTip("VoidTube");
	tray.setContextMenu(buildTrayMenu());
	Menu.setApplicationMenu(buildAppMenu());
	tray.on("click", toggleWindow);
	setInterval(refreshNowPlaying, 3000);
}
