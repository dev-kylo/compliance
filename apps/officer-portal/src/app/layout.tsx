import type { Metadata } from "next";
import { Nav } from "@/components/layout/nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "UKRI Compliance — Officer Portal",
  description:
    "Research finance compliance management for UKRI-funded grants",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <Nav />
        <main className="ml-56 min-h-screen p-8">{children}</main>
      </body>
    </html>
  );
}
