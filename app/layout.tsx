import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { PositionsProvider } from "./Providers";
import { AppShell } from "./AppShell";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PowerPocket",
  description: "AI bot for your stock portfolio",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <SessionProvider>
          <PositionsProvider>
            <AppShell>{children}</AppShell>
          </PositionsProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
