import type { Metadata, Viewport } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const pressStart = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pixel",
  display: "swap",
});

const vt323 = VT323({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "羽扬日记",
  description: "我们的私密日记本",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FBF3E2",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={`${pressStart.variable} ${vt323.variable}`}>
      <body className="min-h-screen bg-cream text-navy">
        <main className="mx-auto max-w-md px-4 pt-6 pb-24">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
