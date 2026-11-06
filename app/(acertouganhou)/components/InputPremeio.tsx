import { Search } from "lucide-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"

export function InputPremio() {
  return (
    <InputGroup className="max-w-full shadow shadow-zinc-900">
      <InputGroupInput  placeholder="Buscar por premio: (Iphone 17)" />
      <InputGroupAddon>
        
      </InputGroupAddon>
      <InputGroupAddon align="inline-end">
      <Search /></InputGroupAddon>
    </InputGroup>
  )
}
