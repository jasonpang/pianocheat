import {
  ApplicationProtocol,
  WEBSOCKET_DEFAULT_PORT,
} from "@pianocheat/messaging.shared";
import { Client as WebSocket } from "rpc-websockets";

export class MessageClient<TProtocol extends ApplicationProtocol> {
  private client: WebSocket;

  constructor() {
    this.client = new WebSocket(`ws://127.0.0.1:${WEBSOCKET_DEFAULT_PORT}`);
  }

  public async connect() {
    return new Promise((resolve) => {
      this.client.on("open", () => resolve({ connected: true, error: null }));
      this.client.on("error", (e) => resolve({ connected: false, error: e }));
    });
  }

  public emitEvent(name: string) {
    this.client.emit(name);
  }

  public call<T extends keyof TProtocol["rpc"], R extends TProtocol["rpc"][T]>(
    name: T,
    params: Parameters<R>[0]
  ) {
    return this.client.call(name as string, params);
  }
}
