import test from "node:test";
import * as assert from "node:assert/strict";
import { MessageServer } from "@pianocheat/messaging.server";
import { MessageClient } from "@pianocheat/messaging.client";

enum Events {
  EventA = "event-a",
}

test("add", (t) => {
  const { JSDOM } = require("jsdom");

  const server = new MessageServer<Events>();
  const client = new MessageClient();
