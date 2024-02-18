import { MessageClient } from "@pianocheat/messaging.client";
import { MessageServer } from "@pianocheat/messaging.server";
import { ApplicationProtocol } from "@pianocheat/messaging.shared";
import assert from "node:assert";
import test from "node:test";

interface TestProtocol extends ApplicationProtocol {
  rpc: {
    echo: ({ a1, a2 }: { a1: string; a2: number }) => Promise<string>;
  };
}

test("call rpc method with params", async (t) => {
  const server = new MessageServer<TestProtocol>();
  const client = new MessageClient<TestProtocol>();

  await server.start();
  await client.connect();

  server.register("echo", async ({ a1, a2 }) => {
    return `${a1} ${a2}`;
  });

  const response = await client.call("echo", {
    a1: "4",
    a2: 5,
  });

  assert.equal(response, "4 5");

  server.close();
});
