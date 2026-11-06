"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { formSchemaEntrar, FormSchemaEntrar } from "./schema/formentraschema"
import { Lock, Mail, Search, User } from "lucide-react"
import { CreateUser } from "./actions/CreateUser";
import { redirect } from "next/navigation";
import { useRouter } from "next/navigation"
interface FormEntrarProps {
  onClose: () => void
}

export function FormEntrar({ onClose }: FormEntrarProps) {
  const router = useRouter()

  const form = useForm<FormSchemaEntrar>({
    resolver: zodResolver(formSchemaEntrar),
    defaultValues: {
      Gmail: "",
      Senha: "",
    },
  })

  async function onSubmit(data: FormSchemaEntrar) {
    try {
      const res = await CreateUser(data)

      console.log("Resposta da action:", res)
      console.log("Sucesso:", res?.success)

      if (res?.success === true) {
        toast.success("Login realizado com sucesso!")

        onClose() // Fecha o Drawer

        router.refresh()
      } else {
        toast.error("Não foi possível entrar.")
      }
    } catch (error) {
      console.error("Erro no login:", error)
      toast.error("Erro ao realizar login.")
    }
  }

  return (
  
        <form id="form-rhf-demo" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="gap-4">
            <Controller
              name="Gmail"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-demo-title">
                    Gmail
                  </FieldLabel>
                
                   <InputGroup className="max-w-full">
      <InputGroupInput
        {...field}
        type="email"
     />
      <InputGroupAddon>
        <Mail />
      </InputGroupAddon>
      
    </InputGroup>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

<Controller
              name="Senha"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-demo-title">
                    Senha
                  </FieldLabel>
                
                   <InputGroup className="max-w-full">
      <InputGroupInput
        {...field}
        type="password"
        placeholder="*********"
     />
      <InputGroupAddon>
        <Lock  />
      </InputGroupAddon>
      
    </InputGroup>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
             <Button type="submit" className="h-13 text-lg font-semibold bg-lime-600">Entrar</Button>
          </FieldGroup>

        
        </form>
     
  )
}
