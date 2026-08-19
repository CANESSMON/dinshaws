import type { Metadata } from "next";
import { Baloo_2, Inter, Noto_Sans_Devanagari } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const baloo2 = Baloo_2({
  variable: "--font-heading",
  subsets: ["latin", "devanagari"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const devanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const amsiProCondensed = localFont({
  src: [
    {
      path: "../../public/fonts/amsi/AmsiProCondensed-Black.woff2",
      weight: "900",
      style: "normal",
    },
    {
      path: "../../public/fonts/amsi/AmsiProCondensed-Ultra.woff2",
      weight: "950",
      style: "normal",
    },
    {
      path: "../../public/fonts/amsi/AmsiProCondensed-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-amsi-condensed",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dinshaw's Kiosk",
  description: "Self-service touchscreen kiosk application",
  icons: {
    icon: "/favicon-96x96.png",
    shortcut: "/favicon-96x96.png",
    apple: "/favicon-96x96.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${baloo2.variable} ${inter.variable} ${devanagari.variable} ${amsiProCondensed.variable}`}
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
