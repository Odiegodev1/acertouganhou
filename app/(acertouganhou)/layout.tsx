import { MobileNavbar } from "./components/mobile-navbar";


export default function AcertouGanhouLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark min-h-dvh bg-[#080b09] text-white">
      <div className="flex min-h-dvh flex-col">

        {/* Conteúdo principal */}
        <main
          className="
            w-full flex-1
            pb-[calc(88px+env(safe-area-inset-bottom))]
            md:pb-0
          "
        >
          {children}
        </main>

        {/* Navbar inferior — somente mobile */}
        <MobileNavbar />

      </div>
    </div>
  );
}