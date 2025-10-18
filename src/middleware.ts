import { auth } from "../auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  // Se a propriedade `req.auth` (que contém a sessão) não existir,
  // significa que o usuário não está logado.
  // IMPORTANTE: Esta lógica só é executada nas rotas que o `matcher` não exclui.
  if (!req.auth) {
    // Criamos a URL completa para a página de login.
    const loginUrl = new URL("/login", req.url);
    console.log("Usuário não autenticado, redirecionando para o login...");

    // E retornamos uma resposta de redirecionamento.
    return NextResponse.redirect(loginUrl);
  }

  // Se o usuário estiver logado (req.auth existe), simplesmente permitimos
  // que a requisição continue normalmente.
  return NextResponse.next();
});

// CORREÇÃO: Voltamos ao matcher que protege todas as páginas, exceto as de sistema,
// a de login E a de registro.
export const config = {
  // A regex agora exclui explicitamente 'login' E 'register'
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|register).*)"],
};
