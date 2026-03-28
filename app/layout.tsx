import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { AppWrapper } from "@/components/app-wrapper";
import { PiProvider } from "@/components/pi-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Made with App Studio",
  description: "OS Execute — Institutional operational execution system on Pi Network. Initiate, record, and verify execution actions with integrated payments, real-time receipts, and wallet-based transaction flow.",
    generator: 'v0.app'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
        {/* Pi Network SDK - no defer, load immediately */}
        <script src="https://sdk.minepi.com/pi-sdk.js"></script>
      </head>
      <body>
        <PiProvider>
          <AppWrapper>{children}</AppWrapper>
        </PiProvider>
      </body>
    </html>
  );
}
