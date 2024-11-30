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

    useWebSocketImplementation(WebSocket);

    const relays = [
        "wss://relay.nostr.band",
        "wss://relay.damus.io",
        "wss://nostr-pub.wellorder.net"
    ];

    const relayPromises = relays.map(url =>
        Relay.connect(url).catch(err => {
            console.error(`Failed to connect to relay ${url}:`, err);
            return null;
        })
    );

    const connectedRelay = (await Promise.all(relayPromises)).find(
        r => r !== null
    );

    if (!connectedRelay) {
        throw new Error("Failed to connect to all relays.");
    }

    console.log(`Connected to Relay at: ${connectedRelay.url}`);

    return new Promise<NostrEvent>((resolve, reject) => {
        const sub = connectedRelay.subscribe(
            [{ kinds: [1], authors: [publicKey], limit: 1 }],
            {
                onevent(event) {
                    console.log("Event received:", event);
                    sub.close();
                    connectedRelay.close();
                    resolve(event);
                }
            }
        );

        setTimeout(() => {
            console.log("Timeout! That's all I got, Dev.");
            sub.close();
            connectedRelay.close();
            reject(new Error("Request aborted due to timeout"));
        }, 10000); // Timeout 10 detik
    });
}

// Function to encode event ID into Nostr nevent format
function getNevent(eventId: string): string {
    console.log("Encoding Event ID:", eventId);

    const nevent = nip19.noteEncode(eventId);

    return nevent;
}

function formatDateNostr(milliseconds: number): string {
    const date = new Date(milliseconds * 1000);

    const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    };

    return date.toLocaleString(undefined, options);
}

// API handler with detailed debugging
export const GET: APIRoute = async () => {
    const jsonHeaders = { "Content-Type": "application/json" };

    try {
        console.log("API handler get Nostr latest note kind 1 started");

        // Fetch the latest note
        const latestNote = await fetchLatestNote();
        console.log("Fetched Latest Note:", latestNote);

        // Encode note ID to nevent
        const nevent = getNevent(latestNote.id);
        console.log("Encoded Nevent:", nevent);

        // Format the created_at timestamp
        const formattedDate = formatDateNostr(latestNote.created_at);
        console.log("Formatted Date:", formattedDate);

        console.log("Data being returned:", {
            latestNote,
            nevent,
            formattedDate
        });

        // Return successful response
        return new Response(
            JSON.stringify({ latestNote, formattedDate, nevent }),
            {
                status: 200,
                headers: jsonHeaders
            }
        );
    } catch (error) {
        console.error("Error in API Handler:", error);

        const message =
            error instanceof Error && error.message
                ? error.message
                : "An unexpected error occurred.";

        return new Response(JSON.stringify({ error: message }), {
            status:
                error instanceof Error && error.message.includes("PUBLIC_KEY")
                    ? 400 // Bad Request
                    : 500, // Internal Server Error
            headers: jsonHeaders
        });
    }
};
