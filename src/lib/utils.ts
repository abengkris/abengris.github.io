
import { getEntry } from "astro:content";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Relay } from "nostr-tools/relay";
import * as nip19 from "nostr-tools/nip19";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(date: Date) {
    return Intl.DateTimeFormat("id-ID", {
        year: "numeric",
        month: "short",
        day: "numeric"
    }).format(date);
}

export function formatDateNostr(date: Date) {
    return Intl.DateTimeFormat("id-ID", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false // Format 24 jam
    }).format(date);
}

export function readingTime(html: string) {
    const textOnly = html.replace(/<[^>]+>/g, "");
    const wordCount = textOnly.split(/\s+/).length;
    const readingTimeMinutes = (wordCount / 200 + 1).toFixed();
    return `${readingTimeMinutes} min read`;
}

export async function parseAuthors(authors: string[]) {
    if (!authors || authors.length === 0) return [];

    const parseAuthor = async (slug: string) => {
        try {
            const author = await getEntry("authors", slug);
            return {
                slug,
                name: author?.data?.name || slug,
                avatar: author?.data?.avatar || "/static/logo.png",
                isRegistered: !!author
            };
        } catch (error) {
            console.error(`Error fetching author with slug ${slug}:`, error);
            return {
                slug,
                name: slug,
                avatar: "/static/logo.png",
                isRegistered: false
            };
        }
    };

    return await Promise.all(authors.map(parseAuthor));
}

export type NostrEvent = {
    id: string;
    pubkey: string;
    created_at: number;
    kind: number;
    tags: string[][];
    content: string;
    sig: string;
};

export async function fetchLatestNote(
    publicKey: string
): Promise<NostrEvent> {
    const relay = await Relay.connect("wss://relay.nostr.band");
    console.log(`Connected to ${relay.url}`);

    // Return a Promise that resolves when the event is received
    return new Promise<NostrEvent>((resolve, reject) => {
        const sub = relay.subscribe(
            [{ kinds: [1], authors: [publicKey], limit: 1 }],
            {
                onevent(event) {
                    console.log("Got event:", event);
                    sub.close(); // Unsubscribe after receiving the event
                    relay.close(); // Close the connection
                    resolve(event); // Resolve the Promise with the received event
                }
            }
        );

        // If the subscription takes too long, reject the Promise
        setTimeout(() => {
            sub.close();
            relay.close();
            reject(
                new Error(
                    "Timeout: No event received within the expected time frame."
                )
            );
        }, 5000); // Timeout after 5 seconds (adjust as needed)
    });
}

export function getNevent(eventId: string): string {
  // Enkode event ke dalam format nevent
  const nevent = nip19.noteEncode(eventId);

  return nevent;
}