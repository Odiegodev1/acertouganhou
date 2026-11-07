"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TrashIcon } from "lucide-react";
import { DropdownSair } from "./DropdownSair";
interface props {
    name:string
}
export function DropdownMenuDemo({name}:props) {
    function primieroletradonome(name: string){
        return name.trim().charAt(0).toUpperCase();
      }
  return (
    <DropdownMenuTrigger>
      <Button className="size-10 flex items-center justify-center rounded-full bg-accent-foreground text-accent font-extrabold">
           
           {primieroletradonome(name as "")}
             
      </Button>
      <DropdownMenu className="w-60" placement="bottom start">
        <DropdownMenuGroup className="space-y-1">
         
          <DropdownMenuItem>
            Meu perfil
            
          </DropdownMenuItem>
          <DropdownMenuItem>
            Minha carteira
            
          </DropdownMenuItem>
          <DropdownMenuItem>
            Lances
            
          </DropdownMenuItem>
          <DropdownMenuItem>
            Notificação
            
          </DropdownMenuItem>
        </DropdownMenuGroup>
       
       
     
     
      
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownSair />
        </DropdownMenuGroup>
      </DropdownMenu>
    </DropdownMenuTrigger>
  )
}
