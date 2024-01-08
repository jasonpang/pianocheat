import {
  BrowserWindow,
  BrowserWindowConstructorOptions,
  screen,
} from "electron";
import Store from "electron-store";
import path from "path";

const isProd: boolean = process.env.NODE_ENV === "production";

type State = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const createWindow = (
  windowName: string,
  options: BrowserWindowConstructorOptions
): BrowserWindow => {
  const key = "window-state";
  const name = `window-state-${windowName}`;
  const store = new Store<{ [key]: State }>({ name });

  const defaultSize: State = {
    width: options.width ?? 800,
    height: options.height ?? 600,
    x: 0,
    y: 0,
  };

  const restore = () => store.get(key, defaultSize);

  const getCurrentPosition = () => {
    const position = win.getPosition();
    const size = win.getSize();
    return {
      x: position[0],
      y: position[1],
      width: size[0],
      height: size[1],
    };
  };

  const windowWithinBounds = (windowState: State, bounds: State) => {
    return (
      windowState.x >= bounds.x &&
      windowState.y >= bounds.y &&
      windowState.x + windowState.width <= bounds.x + bounds.width &&
      windowState.y + windowState.height <= bounds.y + bounds.height
    );
  };

  const resetToDefaults = () => {
    const bounds = screen.getPrimaryDisplay().bounds;
    return Object.assign({}, defaultSize, {
      x: (bounds.width - (defaultSize.width ?? 0)) / 2,
      y: (bounds.height - (defaultSize.height ?? 0)) / 2,
    });
  };

  const ensureVisibleOnSomeDisplay = (windowState: State) => {
    const visible = screen.getAllDisplays().some((display) => {
      return windowWithinBounds(windowState, display.bounds);
    });
    if (!visible) {
      // Window is partially or fully not visible now.
      // Reset it to safe defaults.
      return resetToDefaults();
    }
    return windowState;
  };

  const saveState = () => {
    if (!win.isMinimized() && !win.isMaximized()) {
      Object.assign(state, getCurrentPosition());
    }
    store.set(key, state);
  };

  const state = ensureVisibleOnSomeDisplay(restore());
  let win: BrowserWindow;

  const browserOptions: BrowserWindowConstructorOptions = {
    ...state,
    useContentSize: false,
    center: true,
    title: "Electron App",
    icon: "./resources/icon.png",
    autoHideMenuBar: true,
    backgroundColor: "#fff",
    hasShadow: true,
    darkTheme: true,
    webPreferences: {
      ...options.webPreferences,
      preload: path.join(__dirname, "../preload.js"),
      devTools: !isProd,
      // https://github.com/vercel/next.js/issues/45277
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      backgroundThrottling: false,
      spellcheck: false,
      zoomFactor: 1,
    },
    ...options,
  };

  win = new BrowserWindow(browserOptions);
  if (process.env.NODE_ENV !== "production") {
    win.webContents.openDevTools();
  }

  win.on("close", (event: Electron.Event) => {
    saveState();

    if (win.webContents.isDevToolsOpened()) {
      win.webContents.closeDevTools();
    }
  });

  return win;
};

export default createWindow;
