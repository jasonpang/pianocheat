import { WEBSOCKET_PORT } from "@pianocheat/constants";
import { ExtendedWebSocket, WebSocketServer } from "ws";

export class MessageServer {
  private SOCKET_ID: number = 1;
  private server!: WebSocketServer;

  MessageServer() {
    this.server = new WebSocketServer({ port: WEBSOCKET_PORT });

    this.server.on("connection", (socket: ExtendedWebSocket) => {
      socket.id = this.SOCKET_ID++;
      socket.isAlive = true;

      socket.onmessage = (message) => {
        console.log(`[Socket Message]`, message);
      };
      socket.on("error", (e) => {
        console.error(`[Socket Error]`, e);
      });

      socket.on("pong", (e) => {
        socket.isAlive = true;
        console.error(`[Socket Error]`, e);
      });
    });

    const interval = setInterval(() => {
      for (const client of this.server.clients) {
        const socket = client as ExtendedWebSocket;
        if (socket.isAlive === false) {
          return socket.terminate();
        }

        socket.isAlive = false;
        socket.ping();
      }
    }, 30000);

    this.server.on("close", function close() {
      clearInterval(interval);
    });
  }
}
