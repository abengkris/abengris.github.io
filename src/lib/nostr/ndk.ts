import NDK from '@nostr-dev-kit/ndk';
import { NDKUser } from '@nostr-dev-kit/ndk';
import { NOSTR } from '@/consts.ts';
import { nip19 } from 'nostr-tools';

// Singleton for making sure only one instance of NDK
let ndkInstance: NDK | null = null;

export const getNdkInstance = (): NDK => {
  if (!ndkInstance) {
    ndkInstance = new NDK({
      explicitRelayUrls: NOSTR.RELAYS,
    });
  }
  return ndkInstance;
};

// Function for connecting NDK with log debugging
export const connectNdk = async (): Promise<void> => {
  const ndk = getNdkInstance();
  try {
    console.debug('Attempting to connect to NDK...');
    await ndk.connect();
    console.log('Connected to NDK successfully!');
  } catch (error) {
    console.error('Failed to connect to NDK:', error);
  } finally {
    console.debug('NDK connection attempt completed.');
  }
};

// Fungsi untuk fetch profile dari npub
export const fetchUserProfile = async (
  nPub: string,
): Promise<NDKUser | null> => {
  const ndk = getNdkInstance(); // Menggunakan instance yang sudah ada

  try {
    console.debug(`Fetching profile for npub: ${nPub}`);

    // Mendekode npub menjadi public key hex
    const { data: pubkeyHex } = nip19.decode(nPub);

    // Membuat filter untuk mengambil event dengan kind 0 (Profile)
    const filter = {
      kinds: [0], // Kind 0 untuk profil
      authors: [pubkeyHex], // Public key dalam format hex
    };

    const events = await ndk.fetchEvents(filter);

    if (events.length > 0) {
      const userProfile = events[0].tags; // Anda bisa menyesuaikan dengan cara profile disimpan
      console.log('Fetched profile:', userProfile);
      return userProfile; // Mengembalikan profil pengguna
    } else {
      console.log('No profile found for this npub.');
      return null;
    }
  } catch (error) {
    console.error('Failed to fetch profile for npub:', error);
    return null;
  }
};
