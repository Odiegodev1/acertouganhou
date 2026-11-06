"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  Gamepad2,
  Trophy,
  UserRound,
} from "lucide-react";

import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

const navItems: NavItem[] = [
  {
    label: "Início",
    href: "/",
    icon: House,
  },
  {
    label: "Jogar",
    href: "/jogar",
    icon: Gamepad2,
  },
  {
    label: "Prêmios",
    href: "/premios",
    icon: Trophy,
  },
  {
    label: "Perfil",
    href: "/perfil",
    icon: UserRound,
  },
];

export function MobileNavbar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        "fixed inset-x-0 bottom-0 z-50",
        "border-t border-white/[0.07]",
        "bg-[#0c110d]/95",
        "backdrop-blur-xl",
        "md:hidden"
      )}
    >
      {/* Linha decorativa superior */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c8f31d]/20 to-transparent"
      />

      <div
        className={cn(
          "mx-auto flex max-w-md items-center justify-around",
          "px-3 pt-2",
          "pb-[calc(env(safe-area-inset-bottom)+8px)]"
        )}
      >
        {navItems.map((item) => {
          const Icon = item.icon;

          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group relative flex min-h-[56px] min-w-[64px]",
                "flex-col items-center justify-center gap-1",
                "rounded-xl px-3 py-2",
                "transition-all duration-200",
                "active:scale-95",

                isActive
                  ? "text-[#c8f31d]"
                  : "text-zinc-500 hover:text-zinc-200"
              )}
            >
              {/* Fundo do item ativo */}
              {isActive && (
                <div
                  aria-hidden="true"
                  className="absolute inset-0 rounded-xl bg-[#c8f31d]/[0.07]"
                />
              )}

              {/* Ícone */}
              <div className="relative flex items-center justify-center">
                <Icon
                  strokeWidth={isActive ? 2.3 : 1.8}
                  className={cn(
                    "size-[22px] transition-all duration-200",
                    isActive && "scale-105"
                  )}
                />

                {/* Pequeno indicador */}
                {isActive && (
                  <span
                    className={cn(
                      "absolute -bottom-2",
                      "h-[3px] w-3 rounded-full",
                      "bg-[#c8f31d]"
                    )}
                  />
                )}
              </div>

              {/* Nome */}
              <span
                className={cn(
                  "relative mt-1 text-[10px]",
                  "tracking-wide transition-colors",
                  isActive
                    ? "font-bold text-[#c8f31d]"
                    : "font-medium text-zinc-500"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}