import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ConvoGlass | AI-Powered Mock Interview Practice Platform",
  description: "Master your software engineering, system design, and behavioral interviews with ConvoGlass. Experience real-time adaptive AI coaching and speech analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
