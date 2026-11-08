import type { Metadata, Viewport } from "next"
import { Geist_Mono, Sora } from "next/font/google"

import { Analytics } from "@vercel/analytics/next"

import "./globals.css"

import { cn } from "@/lib/utils"

import { CustomToaster } from "./(acertouganhou)/components/custom-toaster"

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Acertou Ganhou",
    template: "%s | Acertou Ganhou",
  },

  description:
    "Escolha seu prêmio e participe dos desafios.",

  applicationName: "Acertou Ganhou",

  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Acertou Ganhou",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#090c0a",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={cn(
        "h-full bg-[#090c0a] antialiased",
        sora.variable,
        geistMono.variable,
        "font-sans"
      )}
    >
      <body
        className={cn(
          "flex min-h-dvh flex-col",
          "bg-[#090c0a] text-white"
        )}
      >
        {children}

        <CustomToaster />

        <Analytics />
      </body>
    </html>
  )
}