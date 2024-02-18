import {
  ApplicationProtocol,
  WEBSOCKET_DEFAULT_PORT,
} from "@pianocheat/messaging.shared";
import { Server as WebSocketServer } from "rpc-websockets";

export class MessageServer<TProtocol extends ApplicationProtocol> {
  private server: WebSocketServer;

  constructor() {
    this.server = new WebSocketServer({
      port: WEBSOCKET_DEFAULT_PORT,
      host: "127.0.0.1",
    });
  }

  public async start() {
    return new Promise((resolve, reject) => {
      this.server.on("listening", resolve);
      this.server.on("error", reject);
    });
  }

  public emitEvent(name: string) {
    this.server.emit(name);
  }

  public register<
    T extends keyof TProtocol["rpc"],
    R extends TProtocol["rpc"][T]
  >(name: T, handler: (...args: Parameters<R>) => ReturnType<R>) {
    // @ts-ignore
    this.server.register(name as string, handler);
  }

  public close() {
    this.server.close();
  }
}
