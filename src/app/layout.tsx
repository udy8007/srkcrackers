import type { Metadata, Viewport } from "next";
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
const DESCRIPTION = `${BUSINESS.name} — Government licensed fireworks dealer in Mogai, Avadi, Tiruvallur. Buy premium Sivakasi crackers at up to 80% discount. Order online & pay via UPI. Call ${BUSINESS.phoneDisplay}.`;

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
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: BUSINESS.name,
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
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
      <body className={`${poppins.variable} ${jost.variable} antialiased`}>{children}</body>
    </html>
  );
}
