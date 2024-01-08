import { WEBSOCKET_PORT } from "@pianocheat/constants";

export class MessageClient {
  private socket!: WebSocket;

  MessageClient() {
    this.socket = new WebSocket(`ws://127.0.0.1:${WEBSOCKET_PORT}`);

    // Connection opened
    this.socket.addEventListener("open", (event) => {
      this.socket.send("Hello Server!");
    });

    // Listen for messages
    this.socket.addEventListener("message", (event) => {
      console.log("Message from server ", event.data);
    });
  }
}
