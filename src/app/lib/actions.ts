// Arquivo: src/app/lib/actions.ts
"use server";

// 1. Adicionamos 'signOut' à importação
import { signIn, signOut } from "../../../auth";
import { AuthError } from "next-auth";

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    await signIn("credentials", {
      ...Object.fromEntries(formData),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Usuário ou senha inválidos.";
        default:
          return "Algo deu errado. Tente novamente.";
      }
    }
    throw error;
  }
}

// 2. Criamos a nova ação para fazer o logout
export async function handleSignOut() {
  await signOut();
}
