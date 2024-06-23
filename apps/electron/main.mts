import electron, { Menu, app, net, protocol } from "electron";
import log from "electron-log";
import createWindow from "./AppWindow.mjs";

const isProd: boolean = process.env.NODE_ENV === "production";

async function initializeAppWindow() {
  const mainWindow = createWindow("main", {
    width: 1200,
    height: 800,
  });
  mainWindow.maximize();

  if (isProd) {
    await mainWindow.loadURL(`app://./home.html`);
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}`);
  }

  return mainWindow;
}

async function onAppReady() {
  log.info("Starting app");

  protocol.handle("file", (request) =>
    net.fetch(request.url.replace("file:///", ""))
  );

  await initializeAppWindow();
}

function main() {
  process.on("uncaughtException", function (error) {
    log.error(error);
    app.exit(1);
  });

  if (isProd) {
    // serve({ directory: "app" });
  } else {
    app.setPath("userData", `${app.getPath("userData")} (development)`);
  }

  // Set app id on windows
  if (process.platform === "win32") {
    app.setAppUserModelId(app.name);
  }

  // This is used to mantain single open window.
  if (app.requestSingleInstanceLock()) {
    const dockMenu = Menu.buildFromTemplate([]);

    app.whenReady().then(() => {
      if (process.platform === "darwin") {
        const image = electron.nativeImage.createFromPath(
          app.getAppPath() + "/resources/icon.png"
        );
        app.dock.setIcon(image);
        app.dock.setMenu(dockMenu);
      }
      onAppReady();
    });
  } else {
    app.quit();
  }

  app.on("window-all-closed", () => {
    app.quit();
  });
}

main();
