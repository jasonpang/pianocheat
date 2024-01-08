import { WEBSOCKET_PORT } from "@pianocheat/constants";
import { ExtendedWebSocket, WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";
import { JSONValue } from "./types";

const PING_INTERVAL_MS = 2000;
const AUTO_RECONNECT_DELAY_MS = 500;

export class MessageServer {
  private SOCKET_ID: number = 1;
  private server: WebSocketServer;
  private promiseCallbacks: Map<
    string,
    { resolve: (value: unknown) => void; reject: (reason?: any) => void }
  > = new Map();
  private onRequestMessage: (
    id: string,
    payload: JSONValue,
    resolve: (value: unknown) => void
  ) => void;
  private onEvent: (id: string, payload: JSONValue) => void;
  private autoDisconnectTimeout: NodeJS.Timeout | null = null;

  constructor(
    onRequestMessage: (
      id: string,
      payload: JSONValue,
      resolve: (value: unknown) => void
    ) => void,
    onEvent: (id: string, payload: JSONValue) => void
  ) {
    this.server = new WebSocketServer({ port: WEBSOCKET_PORT });

    this.onRequestMessage = onRequestMessage;
    this.onEvent = onEvent;
  }

  private async onMessage({
    id,
    socket,
    kind,
    payload,
  }: {
    id: string;
    socket;
    kind: string;
    payload: JSONValue;
  }) {
    switch (kind) {
      case "ping":
        this.send(
          socket,
          JSON.stringify({
            kind: "pong",
          })
        );
        break;
      case "pong":
        if (this.autoDisconnectTimeout) {
          clearTimeout(this.autoDisconnectTimeout);
        }
        this.autoDisconnectTimeout = setTimeout(() => {
          socket?.close();
        }, PING_INTERVAL_MS * 2.1);
        setTimeout(() => {
          this.send(
            socket,
            JSON.stringify({
              kind: "ping",
            })
          );
        }, PING_INTERVAL_MS);
        break;
      case "request":
        if (typeof this.onRequestMessage === "function") {
          console.log(`[Message Request Received]`, { id, payload });
          const response = new Promise((resolve) => {
            this.onRequestMessage(id, payload, resolve);
          });
          this.send(
            socket,
            JSON.stringify({
              id,
              kind: "response",
              payload: await response,
            })
          );
        }
        break;
      case "response":
        console.log(`[Message Response Received]`, { id, payload });
        this.onResponseMessage(id, payload);
        break;
      case "event":
        if (typeof this.onEvent === "function") {
          console.log(`[Message Event Received]`, { id, payload });
          this.onEvent(id, payload);
        }
        break;
      default:
        console.error(`Unknown message kind: ${{ id, socket, kind, payload }}`);
    }
  }

  private onResponseMessage(id: string, payload: JSONValue) {
    const promise = this.promiseCallbacks.get(id);
    if (!promise) {
      console.warn(
        `A response type message with ID ${id} was received, but no corresponding request message was stored/sent.`
      );
      return;
    }

    if (payload instanceof Error) {
      promise.reject(payload);
    } else {
      promise.resolve(payload);
    }
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

  send(socket: ExtendedWebSocket, data: any) {
    if (!socket) {
      return;
    }

    socket.send(data);
  }

  onSocketConnected(socket: ExtendedWebSocket) {
    socket.id = this.SOCKET_ID++;
    socket.isAlive = true;

    socket.onmessage = (message) => {
      if (typeof this.onMessage === "function") {
        this.onMessage({
          ...JSON.parse(message.data.toString()),
          socket,
        });
      } else {
        console.warn("[MessageServer] this.onmessage is not a function?!");
      }
    };
    socket.on("error", (e) => {
      console.error(`[Socket Error]`, e);
    });

    this.send(
      socket,
      JSON.stringify({
        kind: "ping",
      })
    );
  }

  initialize() {
    this.server.on("connection", this.onSocketConnected.bind(this));
  }
}
