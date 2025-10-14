"use client";

import { useActionState } from "react"; // ATUALIZADO: Importado de 'react'
import { useFormStatus } from "react-dom";
import { authenticate } from "../lib/actions"; // Usando caminho relativo para segurança
import { ArrowRightIcon } from "@heroicons/react/20/solid";
import {
  AtSymbolIcon,
  KeyIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

export default function LoginForm() {
  // ATUALIZADO: Usando o novo hook 'useActionState'
  const [errorMessage, dispatch] = useActionState(authenticate, undefined);

  return (
    <form
      action={dispatch}
      className="space-y-3 bg-gray-800 p-8 rounded-lg shadow-lg"
    >
      <div className="flex-1 rounded-lg px-6 pb-4 pt-8">
        <h1 className="mb-3 text-2xl text-white">Faça login para continuar.</h1>
        <div className="w-full">
          <div>
            <label
              className="mb-3 mt-5 block text-xs font-medium text-gray-300"
              htmlFor="username"
            >
              Usuário
            </label>
            <div className="relative">
              <input
                className="peer block w-full rounded-md border border-gray-600 bg-gray-700 py-[9px] pl-10 text-sm text-white placeholder:text-gray-400"
                id="username"
                type="text"
                name="username"
                placeholder="Digite seu usuário"
                required
              />
              <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400 peer-focus:text-gray-200" />
            </div>
          </div>
          <div className="mt-4">
            <label
              className="mb-3 mt-5 block text-xs font-medium text-gray-300"
              htmlFor="password"
            >
              Senha
            </label>
            <div className="relative">
              <input
                className="peer block w-full rounded-md border border-gray-600 bg-gray-700 py-[9px] pl-10 text-sm text-white placeholder:text-gray-400"
                id="password"
                type="password"
                name="password"
                placeholder="Digite sua senha"
                required
                minLength={6}
              />
              <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400 peer-focus:text-gray-200" />
            </div>
          </div>
        </div>
        <LoginButton />
        <div
          className="flex h-8 items-end space-x-1"
          aria-live="polite"
          aria-atomic="true"
        >
          {errorMessage && (
            <>
              <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
              <p className="text-sm text-red-500">{errorMessage}</p>
            </>
          )}
        </div>
      </div>
    </form>
  );
}

function LoginButton() {
  const { pending } = useFormStatus();
  return (
    <button
      className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      aria-disabled={pending}
    >
      Log in <ArrowRightIcon className="h-5 w-5" />
    </button>
  );
}
