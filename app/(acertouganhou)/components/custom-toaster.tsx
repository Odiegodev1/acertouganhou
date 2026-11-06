"use client";

import { Toaster as SonnerToaster } from "sonner";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  LoaderCircle,
} from "lucide-react";

export function CustomToaster() {
  return (
    <SonnerToaster
      position="top-right"
      expand={false}
      richColors={false}
      closeButton
      visibleToasts={4}
      duration={4000}
      gap={12}
      offset={20}
      mobileOffset={{
        top: 16,
        right: 12,
        left: 12,
      }}
      icons={{
        success: <CheckCircle2 className="size-5 text-[#C8F31D]" />,
        error: <XCircle className="size-5 text-red-400" />,
        warning: <AlertTriangle className="size-5 text-amber-400" />,
        info: <Info className="size-5 text-sky-400" />,
        loading: (
          <LoaderCircle className="size-5 animate-spin text-[#C8F31D]" />
        ),
      }}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-2xl !border !border-white/10 !bg-[#111612] !p-4 !text-white !shadow-[0_16px_50px_rgba(0,0,0,0.45)]",
          title: "!text-sm !font-semibold !text-white",
          description: "!text-xs !text-[#A1AAA3]",
          icon: "!mr-2",
          closeButton:
            "!border-white/10 !bg-[#202820] !text-white hover:!bg-[#303B30]",
          actionButton:
            "!rounded-lg !bg-[#C8F31D] !px-3 !py-2 !font-bold !text-[#090C0A]",
          cancelButton:
            "!rounded-lg !bg-white/10 !px-3 !py-2 !text-white",
          success: "!border-l-[3px] !border-l-[#C8F31D]",
          error: "!border-l-[3px] !border-l-red-500",
          warning: "!border-l-[3px] !border-l-amber-400",
          info: "!border-l-[3px] !border-l-sky-400",
          loading: "!border-l-[3px] !border-l-[#C8F31D]",
        },
      }}
    />
  );
}