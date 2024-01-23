import { WEBSOCKET_PORT } from "@pianocheat/constants";
import { v4 as uuidv4 } from "uuid";
import { JSONValue } from "./types";

const PING_INTERVAL_MS = 2000;
const AUTO_RECONNECT_DELAY_MS = 3000;

export class MessageClient {
  private socket: WebSocket | null = null;
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
  private onConnected: (client: MessageClient) => void;
  private autoDisconnectTimeout: NodeJS.Timeout | null = null;
  private SOCKET_ID = uuidv4().slice(0, 5);
  private isTerminated = false;

  constructor({
    onConnected,
    onRequestMessage,
    onEvent,
  }: {
    onConnected: (client: MessageClient) => void;
    onRequestMessage: (id: string, payload: JSONValue) => void;
    onEvent: (id: string, payload: JSONValue) => void;
  }) {
    this.onConnected = onConnected;
    this.onRequestMessage = onRequestMessage;
    this.onEvent = onEvent;
  }

  async sendRequest(payload: JSONValue) {
    if (!this.socket) {
      return null;
    }

    const id = uuidv4();

    const promise = new Promise((resolve, reject) => {
      this.promiseCallbacks.set(id, { resolve, reject });
    });
    this.send(
      JSON.stringify({
        id,
        kind: "request",
        payload,
      })
    );
    return await promise;
  }

  private async onMessage(data: unknown) {
    const { id, kind, payload } = data as {
      id: string;
      kind: string;
      payload: JSONValue;
    };

    switch (kind) {
      case "ping":
        this.send(
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
          this.socket?.close();
        }, PING_INTERVAL_MS * 2.1);
        setTimeout(() => {
          this.send(
            JSON.stringify({
              kind: "ping",
            })
          );
        }, PING_INTERVAL_MS);
        break;
      case "request":
        if (typeof this.onRequestMessage === "function") {
          const response = new Promise((resolve) => {
            this.onRequestMessage(id, payload, resolve);
          });
          this.send(
            JSON.stringify({
              id,
              kind: "response",
              payload: await response,
            })
          );
        }
        break;
      case "response":
        this.onResponseMessage(id, payload);
        break;
      case "event":
        if (typeof this.onEvent === "function") {
          this.onEvent(id, payload);
        }
        break;
      default:
        console.error(`Unknown message kind:`, { id, kind, payload });
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

  sendEvent(payload: JSONValue) {
    if (!this.socket) {
      return null;
    }

    const id = uuidv4();

    this.send(
      JSON.stringify({
        id,
        kind: "event",
        payload,
      })
    );
  }

  private _onConnected() {
    this.onConnected(this);
    this.send(
      JSON.stringify({
        kind: "ping",
      })
    );
  }

  private send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket?.send(data);
    }
  }

  disconnect() {
    this.isTerminated = true;
    if (this.socket) {
      try {
        if (this.socket.readyState === WebSocket.OPEN) {
          this.socket.close();
        }
      } catch (ex) {}
      this.socket = null;
    }
  }

  connect() {
    if (this.isTerminated) {
      return;
    }

    this.socket = new WebSocket(`ws://127.0.0.1:${WEBSOCKET_PORT}`);

    this.socket.onerror = () => {
      if (this.isTerminated) {
        return;
      }

      console.log(`[${this.SOCKET_ID}] [Socket Error]`);
      setTimeout(this.connect.bind(this), AUTO_RECONNECT_DELAY_MS);
      return;
    };

    this.socket.addEventListener("open", this._onConnected.bind(this));

    this.socket.addEventListener("close", () => {
      if (this.isTerminated) {
        return;
      }

      setTimeout(this.connect.bind(this), AUTO_RECONNECT_DELAY_MS);
    });

    this.socket.addEventListener("message", (event) => {
      if (this.isTerminated) {
        return;
      }

      if (typeof this?.onMessage === "function") {
        this.onMessage(JSON.parse(event.data));
      }
    });
  }
}
