"use client";

import { SessionProvider } from "next-auth/react";

// Este componente envolve toda a aplicação, fornecendo o contexto da sessão.
export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
