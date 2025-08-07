import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ModelProvider } from "../context/ModelContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GPT‑5 Playground",
  description: "Stream with GPT‑5, track costs, switch models, and experiment fast.",
  icons: {
    icon: "/icon.svg",
  },
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    title: "GPT‑5 Playground",
    description: "Streaming chat with GPT‑5 family (gpt-5, mini, nano).",
    url: "/",
    siteName: "GPT‑5 Playground",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GPT‑5 Playground",
    description: "Streaming chat with GPT‑5 family (gpt-5, mini, nano).",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ModelProvider>{children}</ModelProvider>
      </body>
    </html>
  );
}
