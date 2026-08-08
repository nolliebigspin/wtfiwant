import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "What the fuck do I actually want?",
  description:
    "A private guided reflection for separating what matters from what merely looks important.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
