import { WEBSOCKET_PORT } from "@pianocheat/constants";
import { Data, ExtendedWebSocket, WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";
import { JSONValue } from "./types";
import {
  HEARTBEAT_INTERVAL,
  InternalMessage,
  InternalMessageOpcode,
  JSONLike,
} from "@pianocheat/messaging.shared";

const PING_INTERVAL_MS = 2000;
const AUTO_RECONNECT_DELAY_MS = 500;

export class MessageServer<TEvents extends string> {
  private SOCKET_ID: number = 1;
  private server: WebSocketServer;
  private requestHandlers: Map<
    string,
    (data: InternalMessage, resolve: (value: any) => void) => Promise<any>
  > = new Map();
  private promiseCallbacks: Map<
    string,
    { resolve: (value: any) => void; reject: (reason?: any) => void }
  > = new Map();
  private clientDelayedDisconnectMap: Map<number, NodeJS.Timeout> = new Map();
  private onRequestMessage: (
    id: string,
    payload: JSONValue,
    resolve: (value: unknown) => void
  ) => void;
  private onEvent: (id: string, payload: JSONValue) => void;
  private autoDisconnectTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.server = new WebSocketServer({
      port: WEBSOCKET_PORT,
    });
    this.server.on("connection", this.onSocketConnected.bind(this));
  }

  private async onSocketInternalMessage(
    socket: ExtendedWebSocket,
    _data: Data
  ) {
    const data = JSON.parse(_data.toString()) as InternalMessage;

    switch (data.opcode) {
      case InternalMessageOpcode.Heartbeat:
        clearTimeout(this.clientDelayedDisconnectMap.get(socket.id));
        this.clientDelayedDisconnectMap.set(
          socket.id,
          setTimeout(() => {
            socket.close();
          }, HEARTBEAT_INTERVAL * 2.1)
        );
        break;
      case InternalMessageOpcode.Request:
        const requestHandler = this.requestHandlers.get(data.requestId);
        if (!requestHandler) {
          this.internalSend(socket, {
            opcode: InternalMessageOpcode.Reply,
            requestId: data.requestId,
            payload: new Error(
              `A request type message with ID ${data.requestId} was received, but no corresponding request handler was registered.`
            ),
          });
          console.log(
            `A request type message with ID ${data.requestId} was received, but no corresponding request handler was registered.`
          );
          return;
        }

        const response = await new Promise((resolve) => {
          requestHandler(data, resolve);
        });
        this.internalSend(socket, {
          opcode: InternalMessageOpcode.Reply,
          requestId: data.requestId,
          payload: response as JSONLike,
        });
        break;
      case InternalMessageOpcode.Reply:
        console.log(`[Message Response Received]`, data);
        const promise = this.promiseCallbacks.get(data.requestId);
        if (!promise) {
          console.warn(
            `A response type message with ID ${data.requestId} was received, but no corresponding request message was stored/sent.`
          );
          return;
        }

        if (data.payload instanceof Error) {
          promise.reject(data.payload);
        } else {
          promise.resolve(data.payload);
        }
        break;
      case InternalMessageOpcode.Event:
        if (typeof this.onEvent === "function") {
          console.log(`[Message Event Received]`, { id, payload });
          this.onEvent(id, payload);
        }
        break;
    }
  }

  private onSocketError(socket: ExtendedWebSocket, error: Error) {
    console.error(`[Socket Error]`, error);
    socket.close();
  }

  private onSocketConnected(socket: ExtendedWebSocket) {
    socket.id = this.SOCKET_ID++;
    socket.isAlive = true;

    socket.onmessage = (event) =>
      this.onSocketInternalMessage(socket, event.data);

    socket.on("error", (e) => this.onSocketError(socket, e));

    this.beginSocketHeartbeat(socket);
  }

  private beginSocketHeartbeat(socket: ExtendedWebSocket) {
    socket.on("pong", () => {
      socket.isAlive = true;
    });

    socket.on("close", () => {
      console.log(`[Socket Closed]`, socket.id);
      socket.isAlive = false;
    });

    this.send(
      socket,
      JSON.stringify({
        kind: "ping",
      })
    );

    setTimeout(() => {
      if (socket.isAlive) {
        this.beginSocketHeartbeat(socket);
      } else {
        socket.terminate();
      }
    }, PING_INTERVAL_MS);
  }

  private internalSend(socket: ExtendedWebSocket, message: InternalMessage) {
    if (!socket || socket.readyState !== socket.OPEN) {
      return;
    }

    socket.send(JSON.stringify(message));
  }

  private internalBroadcast(message: InternalMessage) {
    for (const client of this.server.clients) {
      client.send(JSON.stringify(message));
    }
  }

  public registerRequestHandler<T>(
    requestId: string,
    handler: (params: any) => Promise<T>
  ) {
    this.requestHandlers.set(requestId, handler);
  }

  broadcastEvent(payload: JSONValue) {
    const id = uuidv4();

    for (const client of this.server.clients) {
      this.send(
        client as ExtendedWebSocket,
        JSON.stringify({
          id,
          kind: "event",
          payload,
        })
      );
    }
  }
}
