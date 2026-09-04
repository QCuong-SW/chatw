import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { 
  title: "ChatApp - Realtime Chat & Calls",
  description: "Production-ish ChatApp with NestJS, Next.js, Redis, MongoDB and WebRTC",
};


export default function RootLayout({children,}: Readonly<{children: React.ReactNode;}>) 
{
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
