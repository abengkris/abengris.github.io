export const prerender = false;
import type { APIRoute } from 'astro';
import { nip19 } from 'nostr-tools';
import { Relay, useWebSocketImplementation } from 'nostr-tools/relay';
import WebSocket from 'ws';

// Define the NostrEvent type
export type NostrEvent = {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
};

// Helper function to fetch the latest note
async function fetchLatestNote(hexPubKey: string): Promise<NostrEvent> {
  // console.log("Using provided HEX PUBLIC KEY:", hexPubKey);

  useWebSocketImplementation(WebSocket);

  const relays = [
    'wss://relay.nostr.band',
    'wss://relay.damus.io',
    'wss://nostr-pub.wellorder.net',
  ];

  const relayPromises = relays.map((url) =>
    Relay.connect(url).catch((err) => {
      console.error(`Failed to connect to relay ${url}:`, err);
      return null;
    }),
  );

  const connectedRelay = (await Promise.all(relayPromises)).find(
    (r) => r !== null,
  );

  if (!connectedRelay) {
    throw new Error('Failed to connect to all relays.');
  }

  // console.log(`Connected to Relay at: ${connectedRelay.url}`);

  return new Promise<NostrEvent>((resolve, reject) => {
    const sub = connectedRelay.subscribe(
      [{ kinds: [1], authors: [hexPubKey], limit: 1 }],
      {
        onevent(event) {
          // console.log("Event received:", event);
          sub.close();
          connectedRelay.close();
          resolve(event);
        },
      },
    );

    setTimeout(() => {
      // console.log("Timeout! That's all I got, Dev.");
      sub.close();
      connectedRelay.close();
      reject(new Error('Request aborted due to timeout'));
    }, 10000); // Timeout 10 detik
  });
}

// Helper function to encode event ID into Nostr nevent format
function getNevent(eventId: string): string {
  // console.log("Encoding Event ID:", eventId);
  return nip19.noteEncode(eventId);
}

// Helper function to format timestamps
function formatDateNostr(timestamp: number, timeZone = 'Asia/Jakarta'): string {
  if (!timestamp || isNaN(timestamp)) {
    console.error('Invalid timestamp provided:', timestamp);
    return 'Invalid date';
  }

  const date = new Date(timestamp * 1000);
  const options: Intl.DateTimeFormatOptions = {
    timeZone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };

  return date.toLocaleString('id-ID', options);
}

// API Handler
export const GET: APIRoute = async ({ url }) => {
  const jsonHeaders = { 'Content-Type': 'application/json' };

  // Extract the hexpubkey parameter from the query string
  const publicKey = url.searchParams.get('hexpubkey');

  if (!publicKey) {
    return new Response(
      JSON.stringify({
        status: 400,
        error: 'Missing required parameter: hexpubkey',
      }),
      { status: 400, headers: jsonHeaders },
    );
  }

  try {
    // console.log("API handler get Nostr latest note started");

    // Fetch the latest note
    const latestNote = await fetchLatestNote(publicKey);
    // console.log("Fetched Latest Note:", latestNote);

    // Encode note ID to nevent
    const nevent = getNevent(latestNote.id);
    // console.log("Encoded Nevent:", nevent);

    // Format the created_at timestamp
    const formattedDate = formatDateNostr(latestNote.created_at);
    // console.log("Formatted Date:", formattedDate);

    // console.log("Data being returned:", {latestNote, nevent, formattedDate});

    // Return successful response
    return new Response(JSON.stringify({ latestNote, formattedDate, nevent }), {
      status: 200,
      headers: jsonHeaders,
    });
  } catch (error) {
    console.error('Error in API Handler:', error);

    const message =
      error instanceof Error && error.message
        ? error.message
        : 'An unexpected error occurred.';

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
};
