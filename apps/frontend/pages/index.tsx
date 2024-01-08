import Head from "next/head";
import { Inter } from "next/font/google";
import styles from "@/styles/Home.module.css";
import { TestComponent } from "@pianocheat/ui";
import { useCallback, useEffect, useRef } from "react";
import { MessageClient } from "@pianocheat/messaging.client";
const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const messageClientRef = useRef<MessageClient | null>(null);

  const onRequestMessage = useCallback((id: string, payload: any) => {
    console.log("[Message Request]", id, payload);
  }, []);

  const onConnected = useCallback(async (client: MessageClient) => {
    console.log("[Socket Connected]");
    client.sendEvent("Event from client");
    const response = await client.sendRequest("test");
    console.log("[Response from test request]", response);
  }, []);

  const onEvent = useCallback((id: string, payload: any) => {
    console.log("[Message Event]", id, payload);
  }, []);

  useEffect(() => {
    messageClientRef.current = new MessageClient({
      onConnected,
      onRequestMessage,
      onEvent,
    });
    messageClientRef.current.connect();
    (window as any)._socket = messageClientRef.current;

    return () => {
      messageClientRef.current?.disconnect();
    };
  }, [onConnected, onEvent, onRequestMessage]);

  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={`${styles.main} ${inter.className}`}>
        <TestComponent />
      </main>
    </>
  );
}
