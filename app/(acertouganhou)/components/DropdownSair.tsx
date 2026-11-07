"use client"

import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { LogOut, TrashIcon } from "lucide-react"
import { SairConta } from "./form/actions/SairConta"


export function DropdownSair(){
    
async function handleSair() {
    await SairConta()
    
}    
    return(
        <>
        <DropdownMenuItem onClick={handleSair} className="flex items-center justify-between" variant="destructive">
            
            Sair da conta 
            <LogOut />
          </DropdownMenuItem>
        </>
    )
}