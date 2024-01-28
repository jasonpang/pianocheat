import { WEBSOCKET_PORT } from "@pianocheat/constants";
import { v4 as uuidv4 } from "uuid";
import { JSONValue } from "./types";
import {
  HEARTBEAT_INTERVAL,
  InternalMessage,
  InternalMessageOpcode,
  JSONLike,
  WEBSOCKET_DEFAULT_PORT,
} from "@pianocheat/messaging.shared";

export class MessageClient {
  private SOCKET_ID: number = 1;
  private client: WebSocket;
  private eventHandlers: Map<
    string,
    (
      params: Omit<
        Extract<InternalMessage, { opcode: InternalMessageOpcode.Event }>,
        "opcode"
      >
    ) => Promise<any>
  > = new Map();
  private requestHandlers: Map<
    string,
    (data: InternalMessage, resolve: (value: any) => void) => Promise<any>
  > = new Map();
  private promiseCallbacks: Map<
    string,
    { resolve: (value: any) => void; reject: (reason?: any) => void }
  > = new Map();
  private isAlive: boolean;
  private serverDelayedDisconnect: NodeJS.Timeout;

  constructor() {
    this.client = new WebSocket(
      `ws://127.0.0.1:${WEBSOCKET_DEFAULT_PORT}`,
      "pianocheat.protocol.v1"
    );
    this.client.onopen = () => this.onSocketConnected(this.client);
  }

  private async onSocketInternalMessage(socket: WebSocket, _data: Data) {
    const data = JSON.parse(_data.toString()) as InternalMessage;

    switch (data.opcode) {
      case InternalMessageOpcode.Heartbeat:
        clearTimeout(this.serverDelayedDisconnect);
        this.serverDelayedDisconnect = setTimeout(() => {
          socket.close();
        }, HEARTBEAT_INTERVAL * 2.1);
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
        const eventHandler = this.eventHandlers.get(data.eventName);
        if (!eventHandler) {
          console.log(
            `An event type message with name ${data.eventName} was received, but no corresponding event handler was registered.`
          );
          return;
        } else {
          eventHandler(data);
        }
        break;
    }
  }

  private onSocketError(socket: WebSocket, error: Error) {
    console.error(`[Socket Error]`, error);
    socket.close();
  }

  private onSocketConnected(socket: WebSocket) {
    this.isAlive = true;
    socket.onmessage = (event) =>
      this.onSocketInternalMessage(socket, event.data);

    socket.onerror = (e) => this.onSocketError(socket, e);

    socket.onclose = () => {
      socket.isAlive = false;
    });

    this.beginSocketHeartbeat(socket);
  }

  private beginSocketHeartbeat(socket: WebSocket) {
    socket.addEventListener('message'' ", () => {
      socket.isAlive = true;
    });

    socket.on("close", () => {
      console.log(`[Socket Closed]`, socket.id);
      socket.isAlive = false;
    });

    this.internalSend(socket, {
      opcode: InternalMessageOpcode.Heartbeat,
    });

    setTimeout(() => {
      if (socket.isAlive) {
        this.beginSocketHeartbeat(socket);
      } else {
        socket.terminate();
      }
    }, HEARTBEAT_INTERVAL);
  }

  private internalSend(socket: WebSocket, message: InternalMessage) {
    if (!socket || socket.readyState !== socket.OPEN) {
      return;
    }

    socket.send(JSON.stringify(message));
  }

  private internalBroadcast(message: InternalMessage) {
    for (const client of this.client.clients) {
      client.send(JSON.stringify(message));
    }
  }

  public onEvent<T>(requestId: string, handler: (params: any) => Promise<T>) {
    this.eventHandlers.set(requestId, handler);
  }

  public onRequest<T>(requestId: string, handler: (params: any) => Promise<T>) {
    this.requestHandlers.set(requestId, handler);
  }

  public broadcastEvent(
    params: Omit<
      Extract<InternalMessage, { opcode: InternalMessageOpcode.Event }>,
      "opcode"
    >
  ) {
    this.internalBroadcast({
      opcode: InternalMessageOpcode.Event,
      ...params,
    });
  }
}
