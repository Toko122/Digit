import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from 'sonner';
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
  title: "Digit — Batumi Freelance Marketplace",
  description: "პრემიუმ ფრილანს პლატფორმა ბათუმში. დაუკავშირდით პროფესიონალებს და მართეთ შეკვეთები მარტივად.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ka"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-slate-950 text-slate-100 flex flex-col font-sans">
        {children}
        <Toaster theme="dark" closeButton richColors position="top-right" />
      </body>
    </html>
  );
}

