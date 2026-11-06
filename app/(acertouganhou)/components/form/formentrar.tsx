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
import { Lock, Search, User } from "lucide-react"



export function FormEntrar() {
  const form = useForm<FormSchemaEntrar>({
    resolver: zodResolver(formSchemaEntrar),
    defaultValues: {
      Gmail: "",
      Senha: "",
    },
  })

async function onSubmit(data:FormSchemaEntrar) {
    console.log("#entra : ", data)
    
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
        <User />
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
