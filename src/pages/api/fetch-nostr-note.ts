export const prerender = false;
import type { APIRoute } from "astro";
import { nip19 } from "nostr-tools";
import { Relay, useWebSocketImplementation } from "nostr-tools/relay";
import { config } from "dotenv";
import WebSocket from "ws";

export type NostrEvent = {
    id: string;
    pubkey: string;
    created_at: number;
    kind: number;
    tags: string[][];
    content: string;
    sig: string;
};

config();

async function fetchLatestNote(): Promise<NostrEvent> {
    const publicKey = process.env.PUBLIC_KEY;

    if (!publicKey) {
        console.error("PUBLIC_KEY is not defined in the .env file");
        throw new Error("PUBLIC_KEY is not defined in the .env file");
    }

    console.log("Using PUBLIC_KEY:", publicKey);

    // Set WebSocket implementastion to library `ws`
    useWebSocketImplementation(WebSocket);

	 const relay = await Relay.connect("wss://relay.nostr.band");
	 
    console.log(`Connected to Relay at: ${relay.url}`);

    return new Promise<NostrEvent>((resolve, reject) => {
        console.log("Subscribing to events...");

        const sub = relay.subscribe(
            [{ kinds: [1], authors: [publicKey], limit: 1 }],
            {
                onevent(event) {
                    console.log("Event received:", event);

                    sub.close(); // Unsubscribe after receiving the event
                    relay.close(); // Close the connection
                    resolve(event); // Resolve the Promise with the received event
                },
            }
        );

        setTimeout(() => {
            console.log("Timeout! That's all i got, Dev.");
            sub.close();
            relay.close();
            reject(new Error("Oh noo..! Time is out, Dev. No event received within the expected after 5 seconds."));
        }, 5000); // Timeout after 5 seconds
    });
}

// Function to encode event ID into Nostr nevent format
function getNevent(eventId: string): string {
    console.log("Encoding Event ID:", eventId);

    const nevent = nip19.noteEncode(eventId);

    return nevent;
}

// API handler with detailed debugging
export const GET: APIRoute = async () => {
    try {
        console.log("API Handler Started");
        const latestNote = await fetchLatestNote();
        console.log("Fetched Latest Note:", latestNote);

        const nevent = getNevent(latestNote.id);
        console.log("Encoded Nevent:", nevent);

        return new Response(JSON.stringify({ latestNote, nevent }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
            },
        });
    } catch (error) {
        console.error("Error in API Handler:", error);

        return new Response(
            JSON.stringify({ error: (error as Error).message }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
    }
};
