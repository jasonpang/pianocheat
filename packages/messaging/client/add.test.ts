import test from "node:test";
import * as assert from "node:assert/strict";
import { MessageServer } from "@pianocheat/messaging.server";

enum Events {
  EventA = "event-a",
}

test("add", (t) => {
  const server = new MessageServer<Events>();
});
