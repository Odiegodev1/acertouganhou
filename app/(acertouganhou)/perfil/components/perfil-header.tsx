import { UserRound, ShieldCheck } from "lucide-react"

interface PerfilHeaderProps {
  name: string
  email: string
}

export function PerfilHeader({ name, email }: PerfilHeaderProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "U"

  return (
    <div className=" p-4 overflow-hidden rounded-2xl border border-white/10 bg-[#111612]">
      <div className="h-fit bg-[radial-gradient(ellipse_at_top_right,#32491a_0%,#172116_45%,#111612_100%)] sm:h-36" />

      <div className=" flex  ">
        <div className=" flex size-20 items-center justify-center rounded-2xl border-4 border-[#111612] bg-[#C8F31D] text-3xl font-black text-[#101510] shadow-lg">
          {initial}
        </div>

        <div className="mt-4 flex flex-col max-w-full justify-between gap-3 sm:flex-row sm:items-end">
          <div className="w-full">
            <h1 className="text-2xl flex  gap-3 items-center justify-between w-full font-bold tracking-tight text-white">
              {name}
              <div className="flex w-fit items-center gap-2 rounded-full border border-[#C8F31D]/20 bg-[#C8F31D]/10 px-3 py-1.5">
            <ShieldCheck className="size-4 text-[#C8F31D]" />

            <span className="text-xs font-semibold text-[#C8F31D]">
              Minha conta
            </span>
          </div>
            </h1>

            <p className="mt-1 text-sm text-zinc-500">{email}</p>
          </div>

          
        </div>
      </div>
    </div>
  )
}