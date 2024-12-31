import { getEntry } from 'astro:content';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Relay } from 'nostr-tools/relay';
import * as nip19 from 'nostr-tools/nip19';
import { bech32 } from 'bech32';
import * as bip39 from 'bip39';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date) {
  return Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatDateNostr(
  timestamp: number,
  timeZone = 'Asia/Jakarta',
): string {
  if (!timestamp || isNaN(timestamp)) {
    console.error('Invalid timestamp provided:', timestamp);
    return 'Invalid date';
  }

  const now = Date.now() / 1000;
  const diffInSeconds = Math.floor(now - timestamp);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 604800)}w`;

  const date = new Date(timestamp * 1000);
  const options: Intl.DateTimeFormatOptions = {
    timeZone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };

  return date.toLocaleString('id-ID', options);
}

export function readingTime(html: string) {
  const textOnly = html.replace(/<[^>]+>/g, '');
  const wordCount = textOnly.split(/\s+/).length;
  const readingTimeMinutes = (wordCount / 200 + 1).toFixed();
  return `${readingTimeMinutes} min read`;
}

export async function parseAuthors(authors: string[]) {
  if (!authors || authors.length === 0) return [];

  const parseAuthor = async (slug: string) => {
    try {
      const author = await getEntry('authors', slug);
      return {
        slug,
        name: author?.data?.name || slug,
        avatar: author?.data?.avatar || '/static/logo.png',
        isRegistered: !!author,
      };
    } catch (error) {
      console.error(`Error fetching author with slug ${slug}:`, error);
      return {
        slug,
        name: slug,
        avatar: '/static/logo.png',
        isRegistered: false,
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

export async function fetchLatestNote(publicKey: string): Promise<NostrEvent> {
  const relay = await Relay.connect('wss://relay.nostr.band');
  console.log(`Connected to ${relay.url}`);

  // Return a Promise that resolves when the event is received
  return new Promise<NostrEvent>((resolve, reject) => {
    const sub = relay.subscribe(
      [{ kinds: [1], authors: [publicKey], limit: 1 }],
      {
        onevent(event) {
          console.log('Got event:', event);
          sub.close(); // Unsubscribe after receiving the event
          relay.close(); // Close the connection
          resolve(event); // Resolve the Promise with the received event
        },
      },
    );

    // If the subscription takes too long, reject the Promise
    setTimeout(() => {
      sub.close();
      relay.close();
      reject(
        new Error('Timeout: No event received within the expected time frame.'),
      );
    }, 5000); // Timeout after 5 seconds (adjust as needed)
  });
}

export function getNevent(eventId: string): string {
  // Enkode event ke dalam format nevent
  const nevent = nip19.noteEncode(eventId);

  return nevent;
}

export function formatContent(content: string): string {
  console.log('Content to Format:', content);

  if (!content) return 'No content available.';

  const lines = content.split('\n');
  console.log('Lines:', lines);

  return lines
    .map((line) => {
      if (line.startsWith('http')) {
        if (line.match(/\.(jpg|jpeg|png|gif)$/i)) {
          return `<img src="${line}" alt="Embedded Image" class="w-full rounded-md mt-2" />`;
        } else {
          return `<a href="${line}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">${line}</a>`;
        }
      }
      return `<span class="block mb-2">${line}</span>`;
    })
    .join('');
}

/**
 * Converts an `nsec1` private key to its hexadecimal representation.
 * @param nsecKey - The Bech32-encoded Nostr private key (nsec1 format).
 * @returns The hexadecimal private key, or `null` if decoding fails.
 */
export const decodeNsecToHex = (nsecKey: string): string | null => {
  try {
    // Decode the Bech32 key
    const decoded = bech32.decode(nsecKey);
    // Convert Bech32 words to a byte array and then to a hexadecimal string
    const hexPrivateKey = Buffer.from(bech32.fromWords(decoded.words)).toString(
      'hex',
    );
    return hexPrivateKey;
  } catch (error) {
    console.error('Error decoding nsec key:', error);
    return null;
  }
};

/**
 * Converts a private key to a secret phrase (mnemonic).
 * @param privateKey - The private key in hexadecimal format.
 * @returns The secret phrase (mnemonic), or `null` if conversion fails.
 */
export const privateKeyToSecretPhrase = (privateKey: string): string | null => {
  try {
    // Convert private key (hex) to a binary buffer
    const entropy = Buffer.from(privateKey, 'hex');

    // Generate a mnemonic (secret phrase) from the entropy
    const mnemonic = bip39.entropyToMnemonic(entropy);

    return mnemonic;
  } catch (error) {
    console.error('Error generating secret phrase:', error);
    return null;
  }
};
