export const prerender = false;
import type { APIRoute } from "astro";
import { nip19 } from "nostr-tools";
import { Relay } from "nostr-tools/relay";
import { config } from "dotenv";

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

// Function to fetch the latest note
async function fetchLatestNote(): Promise<NostrEvent> {
    const publicKey = process.env.PUBLIC_KEY;

    if (!publicKey) {
        throw new Error("PUBLIC_KEY is not defined in the .env file");
    }

    const relay = await Relay.connect("wss://relay.nostr.band");
    console.log(`Connected to ${relay.url}`);

    return new Promise<NostrEvent>((resolve, reject) => {
        const sub = relay.subscribe(
            [{ kinds: [1], authors: [publicKey], limit: 1 }],
            {
                onevent(event) {
                    
                    sub.close(); // Unsubscribe after receiving the event
                    relay.close(); // Close the connection
                    resolve(event); // Resolve the Promise with the received event
                }
            }
        );

        setTimeout(() => {
            sub.close();
            relay.close();
            reject(
                new Error(
                    "Timeout: No event received within the expected time frame."
                )
            );
        }, 5000); // Timeout after 5 seconds
    });
}

// Function to encode event ID into Nostr nevent format
function getNevent(eventId: string): string {
    const nevent = nip19.noteEncode(eventId);
    return nevent;
}

// API handler
export const GET: APIRoute = async () => {
    try {
        const latestNote = await fetchLatestNote();
        const nevent = getNevent(latestNote.id);

        return new Response(JSON.stringify({ latestNote, nevent }), {
            status: 200,
        });
    } catch (error) {
        return new Response(
            JSON.stringify({ error: (error as Error).message }),
            { status: 500 }
        );
    }
};
