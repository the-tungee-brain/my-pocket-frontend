// app/layout.tsx
import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import type { ReactNode } from "react";
import { BRAND_APP_ICON_180_SRC, BRAND_APP_ICON_512_SRC } from "@/lib/brand";
import { AppProviders } from "./AppProviders";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

/** Editorial headlines on marketing pages (Mistral-style display type). */
const sourceSerif = Source_Serif_4({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Tomcrest",
  description: "AI portfolio intelligence by Tomcrest",
  icons: {
    icon: [
      { url: BRAND_APP_ICON_512_SRC, sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: BRAND_APP_ICON_180_SRC, sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

const themePreferenceScript = `
(function() {
  try {
    var key = "tomcrest-theme";
    var value = window.localStorage.getItem(key);
    var root = document.documentElement;
    if (value === "light" || value === "dark") {
      root.dataset.theme = value;
    } else {
      root.dataset.theme = "system";
    }
  } catch (_) {
    document.documentElement.dataset.theme = "system";
  }
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${sourceSerif.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: theme must be applied before hydration to avoid color flash.
          dangerouslySetInnerHTML={{ __html: themePreferenceScript }}
        />
      </head>
      <body className="font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
