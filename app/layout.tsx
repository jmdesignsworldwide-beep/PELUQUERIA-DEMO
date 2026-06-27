import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { themeBootScript } from "@/lib/theme";
import { DEFAULT_SKIN } from "@/lib/skins";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "JM · Sistema de Gestión",
  description: "Sistema de gestión premium para salones y barberías.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f0f11",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeBootScript(DEFAULT_SKIN) }}
        />
      </head>
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}
