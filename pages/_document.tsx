import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  const meta = {
    title: "Abengkris",
    description: "Author, bloger, and bitcoiner",
    image:
      "https://image.nostr.build/bcfc506a9e376af381d48f7293ff415488b42eeab03a424fb7a73dd6c04a786d.jpg",
  };

  return (
    <Html lang="id">
      <Head>
        <meta name="robots" content="follow, index" />
        <meta name="description" content={meta.description} />
        <meta property="og:site_name" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:image" content={meta.image} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@abengkriss" />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:image" content={meta.image} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
