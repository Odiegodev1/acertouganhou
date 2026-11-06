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

import { IdCard, Lock, Mail, Phone, Search, User } from "lucide-react"
import { formSchemaCadastro, FormSchemaCadastro } from "./schema/formSchemaCadastro"
import { CreateUser } from "./actions/CreateUser";
import { CreateCadastro } from "./actions/createcadastro";
import { useRouter } from "next/navigation"
interface CadastroFormProps {
  onSuccess?: () => void;
}

export function CadastroForm({ onSuccess }: CadastroFormProps) {
  const router = useRouter();

  const form = useForm<FormSchemaCadastro>({
    resolver: zodResolver(formSchemaCadastro),
    defaultValues: {
      name: "",
      Gmail: "",
      Cpf: "",
      Telefone: "",
      Senha: "",
    },
  })

  async function onSubmit(data: FormSchemaCadastro) {
    try {
      const result = await CreateCadastro(data);

      if (!result.success) {
        toast.error("Não foi possível cadastrar", {
          description: result.error,
        });
        return;
      }

      toast.success("Cadastro realizado!", {
        description: result.message,
      });

      // Fecha o modal
      onSuccess?.();

      // Atualiza a página atual sem navegar
      router.refresh();
    } catch {
      toast.error("Erro inesperado", {
        description: "Tente novamente.",
      });
    }
  }
  return (
  
        <form id="form-rhf-demo" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="gap-4">
             <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-demo-title">
                    Nome
                  </FieldLabel>
                
                   <InputGroup className="max-w-full">
      <InputGroupInput
        {...field}
  
        placeholder="Seu nome"
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
        placeholder="seu@email.com"
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
              name="Cpf"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-demo-title">
                    CPF
                  </FieldLabel>
                
                   <InputGroup className="max-w-full">
      <InputGroupInput
        {...field}
        type="text"
        placeholder="000.000.000-00"
     />
      <InputGroupAddon>
        <IdCard />
      </InputGroupAddon>
      
    </InputGroup>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
             <Controller
              name="Telefone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-demo-title">
                    Telefone com DDD
                  </FieldLabel>
                
                   <InputGroup className="max-w-full">
      <InputGroupInput
        {...field}
        placeholder="(11) 99999-9999"
     />
      <InputGroupAddon>
        <Phone />
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
             <Button type="submit" className="h-13 text-lg font-semibold bg-lime-600">Criar conta</Button>
          </FieldGroup>

        
        </form>
     
  )
}
