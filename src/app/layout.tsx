import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Poppins, Jost } from "next/font/google";
import { BUSINESS } from "@/lib/constants";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const SITE_URL = BUSINESS.url;
const TITLE = `${BUSINESS.name} — Best Crackers Shop | Sivakasi Quality Online`;
const DESCRIPTION = `${BUSINESS.name} — Government licensed fireworks dealer in Morai, Avadi, Chennai. Buy premium Sivakasi crackers at up to 80% discount. Order online & pay via UPI. Call ${BUSINESS.phoneDisplay}.`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: `%s | ${BUSINESS.name}`,
  },
  description: DESCRIPTION,
  applicationName: BUSINESS.name,
  keywords: [
    "SRK Crackers",
    "Sivakasi crackers",
    "crackers shop Avadi",
    "crackers shop Chennai",
    "fireworks Avadi Chennai",
    "fireworks Tiruvallur",
    "Diwali crackers online",
    "crackers price list",
    "wholesale crackers Tamil Nadu",
    "buy crackers online Avadi",
    "Sivakasi fireworks dealer",
  ],
  authors: [{ name: BUSINESS.name, url: SITE_URL }],
  creator: BUSINESS.name,
  publisher: BUSINESS.name,
  alternates: {
    canonical: "/",
  },
  category: "shopping",
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/logo.png",
    apple: [{ url: "/logo.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: BUSINESS.name,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 1024,
        height: 1024,
        alt: `${BUSINESS.name} logo`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#d62828",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Store",
  "@id": `${SITE_URL}/#store`,
  name: BUSINESS.name,
  description: DESCRIPTION,
  url: SITE_URL,
  image: `${SITE_URL}/logo.png`,
  logo: `${SITE_URL}/logo.png`,
  telephone: `+91${BUSINESS.phone}`,
  email: BUSINESS.email,
  priceRange: "₹₹",
  currenciesAccepted: "INR",
  paymentAccepted: "UPI, Cash",
  address: {
    "@type": "PostalAddress",
    streetAddress: BUSINESS.street,
    addressLocality: BUSINESS.city,
    addressRegion: BUSINESS.state,
    postalCode: BUSINESS.postalCode,
    addressCountry: BUSINESS.country,
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: BUSINESS.lat,
    longitude: BUSINESS.lng,
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: "09:00",
    closes: "21:00",
  },
  areaServed: [
    { "@type": "State", name: "Tamil Nadu" },
    { "@type": "Country", name: "India" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${poppins.variable} ${jost.variable} antialiased`}>
        {children}
        <Script
          src="https://www.noupe.com/embed/019f30967aa0700080c53f9bb9b8a6e42c31.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
