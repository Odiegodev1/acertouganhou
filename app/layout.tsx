import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Sora } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Acertou Ganhou",
  description: "Escolha seu prêmio e participe dos desafios.",

  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Acertou Ganhou",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#090c0a",
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={cn(
        "h-full bg-[#090c0a] antialiased",
        geistSans.variable,
        geistMono.variable,
        sora.variable,
        "font-sans"
      )}
    >
      <body
        className={cn(
          "flex min-h-dvh flex-col",
          "bg-[#090c0a] text-white"
        )}
      >
        <Toaster />
        {children}
      </body>
    </html>
  );
}