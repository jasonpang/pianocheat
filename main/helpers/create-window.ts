import {
  screen,
  BrowserWindow,
  BrowserWindowConstructorOptions
} from 'electron'
import Store from 'electron-store'

interface Size {
  width: number
  height: number
}

interface PositionSize extends Size {
  x: number
  y: number
}

export default (
  windowName: string,
  options: BrowserWindowConstructorOptions
): BrowserWindow => {
  const key = 'window-state'
  const name = `window-state-${windowName}`
  const store = new Store({ name })
  const defaultSize: Size = {
    width: options.width || 600,
    height: options.height || 800
  }
  let state = {}
  let win: BrowserWindow

  function restore(): PositionSize {
    return store.get(key, defaultSize) as PositionSize
  }

  function getCurrentPosition(): PositionSize {
    const position = win.getPosition()
    const size = win.getSize()
    return {
      x: position[0],
      y: position[1],
      width: size[0],
      height: size[1]
    }
  }

  function windowWithinBounds(windowState: PositionSize, bounds: PositionSize) {
    return (
      windowState.x >= bounds.x &&
      windowState.y >= bounds.y &&
      windowState.x + windowState.width <= bounds.x + bounds.width &&
      windowState.y + windowState.height <= bounds.y + bounds.height
    )
  }

  function resetToDefaults() {
    const bounds = screen.getPrimaryDisplay().bounds
    return Object.assign({}, defaultSize, {
      x: (bounds.width - defaultSize.width) / 2,
      y: (bounds.height - defaultSize.height) / 2
    })
  }

  function ensureVisibleOnSomeDisplay(windowState: PositionSize) {
    const visible = screen.getAllDisplays().some((display) => {
      return windowWithinBounds(windowState, display.bounds)
    })
    if (!visible) {
      // Window is partially or fully not visible now.
      // Reset it to safe defaults.
      return resetToDefaults()
    }
    return windowState
  }

  function saveState() {
    if (!win.isMinimized() && !win.isMaximized()) {
      Object.assign(state, getCurrentPosition())
    }
    store.set(key, state)
  }

  state = ensureVisibleOnSomeDisplay(restore())

  Store.initRenderer()

  const browserOptions: BrowserWindowConstructorOptions = {
    ...options,
    ...state,
    width: 1280,
    height: 1600,
    useContentSize: false,
    center: true,
    title: 'Piano Studio',
    icon: 'resources/icon.ico',
    autoHideMenuBar: true,
    backgroundColor: '#fff',
    hasShadow: true,
    darkTheme: true,
    webPreferences: {
      ...options.webPreferences,
      enableRemoteModule: true,
      devTools: true,
      nodeIntegration: true,
      nodeIntegrationInWorker: false,
      webSecurity: false,
      allowRunningInsecureContent: true,
      backgroundThrottling: false,
      spellcheck: false,
      worldSafeExecuteJavaScript: true,
      zoomFactor: 1
    }
  }
  win = new BrowserWindow(browserOptions)
  if (process.env.NODE_ENV !== 'production') {
    win.webContents.openDevTools()
  }

  win.on('close', (event: Electron.Event) => {
    saveState()

    if (win.webContents.isDevToolsOpened()) {
      win.webContents.closeDevTools()
    }
  })

  return win
}
