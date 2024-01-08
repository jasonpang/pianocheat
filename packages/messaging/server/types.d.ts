import ws from "ws";

declare module "ws" {
  export interface ExtendedWebSocket extends ws {
    id: number;
    isAlive: boolean;
  }
}
