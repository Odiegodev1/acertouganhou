import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Gamepad2 } from "lucide-react"
import { StaticImageData } from "next/image"
interface DialogJogoProps {
    id: string,
    nome: string,
    valor:number,
    tipo:string,
    img?: StaticImageData
    time:number
}
export function DialogJogo({id,nome,tipo,valor,img,time}:DialogJogoProps){
    console.log(id,nome,valor,tipo,img,time)
    return(
        <DialogTrigger>
 <Button
                  className="
                    h-10 w-full rounded-xl
                    bg-[#c8f31d]
                     text-xs font-bold
                    text-[#101509]
                    transition-all duration-200
                    hover:bg-[#d8ff52]
                    active:scale-[0.98]
                    
                    
                    
                  "
                >
                  <Gamepad2 className="mr-1.5 size-4 sm:mr-2" />

                  Jogar agora

                 
                </Button>
  <Dialog>
    <DialogHeader>
      <DialogTitle>{nome}</DialogTitle>
      <DialogDescription>
        This action cannot be undone. This will permanently delete your account
        and remove your data from our servers.
      </DialogDescription>
    </DialogHeader>
  </Dialog>
</DialogTrigger>
    )
}