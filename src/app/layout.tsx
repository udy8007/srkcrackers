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

export const metadata: Metadata = {
  title: `${BUSINESS.name} — Best Crackers Shop | Sivakasi Quality Online`,
  description: `${BUSINESS.name} — Licensed dealer in Mogai, Avadi, Tiruvallur. 80% discount on Sivakasi crackers. Call ${BUSINESS.phoneDisplay}.`,
  keywords: [
    "SRK Crackers",
    "Sivakasi crackers",
    "crackers shop Avadi",
    "fireworks Tiruvallur",
    "Diwali crackers online",
  ],
  authors: [{ name: BUSINESS.name }],
  openGraph: {
    title: `${BUSINESS.name} — Best Crackers Shop`,
    description: `Premium Sivakasi quality crackers at 80% discount from licensed dealer ${BUSINESS.name}.`,
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#a8007d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} ${jost.variable} antialiased`}>{children}</body>
    </html>
  );
}
