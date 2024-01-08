import ws from "ws";

declare module "ws" {
  export interface ExtendedWebSocket extends ws {
    id: number;
    isAlive: boolean;
  }
}

export type JSONValue =
  | string
  | number
  | boolean
  | { [x: string]: JSONValue }
  | Array<JSONValue>;
