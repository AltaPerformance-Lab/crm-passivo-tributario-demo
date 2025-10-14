import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import Providers from "./providers"; // 1. Importa o nosso novo componente Providers

export const metadata: Metadata = {
  // 2. Metadados atualizados para o CRM
  title: "Prospect CRM",
  description: "Seu CRM para prospecção de leads",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 3. Idioma atualizado para pt-BR
    <html lang="pt-BR">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        {/* 4. O {children} é "envelopado" pelo Providers */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
