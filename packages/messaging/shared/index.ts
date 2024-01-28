export enum InternalMessageOpcode {
  Event,
  Request,
  Reply,
  Sync,
  Heartbeat,
}

export type JSONLike =
  | string
  | number
  | boolean
  | { [x: string]: JSONLike }
  | Array<JSONLike>
  | Error;

export type InternalMessage =
  | {
      opcode: InternalMessageOpcode.Heartbeat;
    }
  | {
      opcode: InternalMessageOpcode.Request;
      requestId: string;
      params: JSONLike;
    }
  | {
      opcode: InternalMessageOpcode.Reply;
      requestId: string;
      payload: JSONLike;
    }
  | {
      opcode: InternalMessageOpcode.Event;
      eventName: string;
      payload: JSONLike;
    }
  | {
      opcode: InternalMessageOpcode.Sync;
      payload: JSONLike;
    };

export interface RpcRequestMessage<T> {}

export type RpcRequestMessageHandler<T> = (
  message: RpcRequestMessage<T>
) => Promise<T>;

export const HEARTBEAT_INTERVAL = 2000;
export const WEBSOCKET_DEFAULT_PORT = 49273;

export const Websocket;
