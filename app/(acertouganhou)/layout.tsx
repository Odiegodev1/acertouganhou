import { MobileNavbar } from "./components/mobile-navbar"

interface AcertouGanhouLayoutProps {
  children: React.ReactNode
}

export default function AcertouGanhouLayout({
  children,
}: AcertouGanhouLayoutProps) {
  return (
    <div className="dark min-h-dvh bg-[#080b09] text-white">
      <div className="flex min-h-dvh flex-col">
        {/* CONTEÚDO PRINCIPAL */}
        <main
          className="
            w-full flex-1
            pb-[calc(88px+env(safe-area-inset-bottom))]
            md:pb-0
          "
        >
          {children}
        </main>

        {/* NAVBAR MOBILE */}
        <MobileNavbar />
      </div>
    </div>
  )
}