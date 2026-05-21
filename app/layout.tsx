import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Show App — Metin Celik",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="bg-gray-950 text-white min-h-full">{children}</body>
    </html>
  );
}
