export type Site = {
  TITLE: string;
  DESCRIPTION: string;
  EMAIL: string;
  NUM_POSTS_ON_HOMEPAGE: number;
  POSTS_PER_PAGE: number;
  SITEURL: string;
  NPUB: string;
  NIP05: string;
};

export type Link = {
  href: string;
  label: string;
};

export type Nostr = {
  NPUB: string;
  RELAYS: string[];
  NIP05: string;
};

export const SITE: Site = {
  TITLE: 'Abeng',
  DESCRIPTION: 'author, blogger, bitcoiner.',
  EMAIL: 'abengkris@proton.me',
  NUM_POSTS_ON_HOMEPAGE: 2,
  POSTS_PER_PAGE: 3,
  SITEURL: 'https://abeng.xyz',
  NPUB: 'npub1q7g8dyxw8lkrp7eq38445cwpga2gcfzt4ptqtecn67v3e48qzhmqwgk6wr',
  NIP05: '_@abeng.xyz',
};

export const NAV_LINKS: Link[] = [
  { href: '/blog', label: 'blog' },
  { href: '/support', label: 'support' },
  { href: '/about', label: 'about' },
  { href: '/tags', label: 'tags' },
];

export const SOCIAL_LINKS: Link[] = [
  {
    href: 'https://nostrudel.ninja/#/u/npub1q7g8dyxw8lkrp7eq38445cwpga2gcfzt4ptqtecn67v3e48qzhmqwgk6wr',
    label: 'Nostr',
  },
  { href: 'https://github.com/abengkris', label: 'GitHub' },
  { href: 'https://twitter.com/abengkriss', label: 'Twitter' },
  { href: 'abengkris@proton.me', label: 'Email' },
  { href: '/rss.xml', label: 'RSS' },
];

export const NOSTR: Nostr = {
  NPUB: 'npub1q7g8dyxw8lkrp7eq38445cwpga2gcfzt4ptqtecn67v3e48qzhmqwgk6wr',
  NIP05: '_@abeng.xyz',
  RELAYS: [
    'wss://relay.nostr.band/',
    'wss://relay.damus.io',
    'wss://nosdrive.app/relay',
  ],
};
