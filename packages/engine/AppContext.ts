import { MessageServer } from "@pianocheat/messaging.server";
import { AppEngine } from "./AppEngine";

const DEBUG_FRONTEND_STATE_CHANGES = false;

export class AppContext {
  store: ReturnType<any>;
  engine: AppEngine;

  constructor() {
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
    const server = new MessageServer(
      (id: string, payload: any, resolve: (value: unknown) => void) => {
        console.log("On Request Message:", id, payload);
        if (payload === "test") {
          resolve("test-reply");
        }
      },
      (id: string, payload: any) => {
        console.log("On Event:", id, payload);
      }
    );
    server.initialize();
    // this.store.subscribe((state, change) => {
    //   if (DEBUG_FRONTEND_STATE_CHANGES) {
    //     console.log(
    //       `The backend store has updated:`,
    //       JSON.stringify(change.patches, null, 4)
    //     );
    //   }
    // });
    await this.engine.initialize();
  }
}
