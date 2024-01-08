import type { BrowserWindow } from "electron";
import { AppEngine } from "./AppEngine";

const DEBUG_FRONTEND_STATE_CHANGES = false;

export class AppContext {
  window: BrowserWindow;
  store: ReturnType<any>;
  engine: AppEngine;

  constructor(browserWindow: BrowserWindow) {
    this.window = browserWindow;
    // this.store = createSharedStore({
    //   io: {
    //     inputs: {},
    //     outputs: {},
    //   },
    //   preferences: {
    //     debugging: {
    //       preloadTestScore: true,
    //       marker: 10,
    //     },
    //   },
    // });
    this.engine = new AppEngine(this);
  }

  async initialize() {
    this.store.subscribe((state, change) => {
      if (DEBUG_FRONTEND_STATE_CHANGES) {
        console.log(
          `The backend store has updated:`,
          JSON.stringify(change.patches, null, 4)
        );
      }
    });
    await this.engine.initialize();
  }
}
