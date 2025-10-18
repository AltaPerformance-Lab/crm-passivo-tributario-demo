# Prospect CRM

### Uma solução moderna e segura para gestão de leads e prospecção de clientes com foco em consultoria tributária.

Este projeto foi construído do zero como um sistema completo (Full Stack) para gerenciar o ciclo de vida de um lead, desde a importação e enriquecimento de dados até a geração de propostas e análise de métricas de negócio, com uma arquitetura multi-usuário segura e escalável.

_(Dica: Adicione um screenshot da tela principal do seu CRM aqui para um grande impacto visual!)_
`![Screenshot do Prospect CRM](./screenshot.png)`

---

## 📖 Guia Rápido de Uso

Este CRM foi projetado para ser intuitivo. O fluxo principal de trabalho é o seguinte:

1.  **Cadastro do Admin:** O primeiro usuário a se cadastrar no sistema se torna automaticamente o Administrador.
2.  **Configuração:** Na página de "Configurações", o admin insere os dados da sua empresa e faz o upload da logo, que serão usados nas propostas.
3.  **Gestão de Usuários:** Logado como admin, é possível cadastrar novos usuários (membros da equipe) através da mesma página de registro.
4.  **Importação de Leads:** Na página "Importar", o usuário pode subir uma planilha CSV contendo milhares de leads de uma só vez. O sistema processa os dados em lotes para garantir a performance.
5.  **Painel de Leads:** A tela principal exibe todos os leads do usuário logado, com filtros poderosos por status, localidade, nome e valor.
6.  **Enriquecimento de Dados:** Com um clique no botão "Enriquecer", o sistema busca dados cadastrais completos da empresa (endereço, sócios, etc.) usando o CNPJ e atualiza o lead.
7.  **Detalhes do Lead:** Cada lead tem uma página de detalhes completa, onde é possível gerenciar contatos, adicionar notas de atividade, agendar lembretes e, o mais importante, gerenciar o negócio.
8.  **Geração de Propostas:** Na tela de detalhes, o usuário pode gerar propostas em PDF com design profissional, que são salvas e ficam disponíveis para download.
9.  **Análise de Métricas:** O Dashboard de Métricas oferece uma visão completa do funil de vendas, com gráficos sobre a performance no período e cards com os totais históricos do negócio.

## 🧠 Decisões de Arquitetura e Design (O "Porquê")

A escolha das tecnologias e da lógica de programação foi pensada para criar um sistema moderno, seguro, performático e fácil de manter.

- #### Full Stack com Next.js (App Router)

  Escolhemos o Next.js pela sua arquitetura híbrida. Usamos **Server Components** para renderizar páginas estáticas e buscar dados no servidor, garantindo performance e SEO. **Client Components** foram usados para páginas interativas, como formulários e dashboards. As **API Routes** foram usadas para construir todo o backend, mantendo o projeto unificado em um único monorepo.

- #### Banco de Dados com Prisma & PostgreSQL

  O **Prisma** foi escolhido como ORM pela sua incrível segurança de tipos (TypeScript), que previne uma classe inteira de bugs de banco de dados. Ele gera um cliente totalmente tipado que nos deu autocomplete e confiança durante o desenvolvimento. O **PostgreSQL** é um banco de dados relacional robusto e escalável, ideal para uma aplicação SaaS, e foi facilmente gerenciado em ambiente de desenvolvimento com **Docker**.

- #### Autenticação com NextAuth.js

  Utilizamos o NextAuth.js (agora Auth.js) por ser o padrão de mercado para autenticação em Next.js. Implementamos uma estratégia de `Credentials` com senhas criptografadas (`bcrypt`) e uma lógica de `callbacks` para enriquecer a sessão do usuário com seu `id` e sua `role` (ADMIN/USER), o que foi crucial para a segurança de todo o sistema.

- #### Geração de PDF com `pdf-lib` (A Reviravolta)

  O projeto iniciou usando a biblioteca `@react-pdf/renderer` por sua abordagem baseada em componentes. No entanto, enfrentamos erros complexos de build no ambiente da Vercel. Diante disso, **pivotamos** para uma solução mais robusta e controlável: a biblioteca `pdf-lib`. Essa abordagem programática nos deu controle total sobre a criação do PDF no lado do servidor, resultando em uma funcionalidade mais leve, sem dependências pesadas de renderização, e 100% confiável no ambiente serverless.

- #### Estilização com Tailwind CSS & shadcn/ui

  O **Tailwind CSS** foi usado para toda a estilização, por sua metodologia _utility-first_ que permite criar interfaces complexas e responsivas de forma rápida e consistente. Os componentes da **shadcn/ui** foram usados como base para elementos de UI como botões e calendários, garantindo acessibilidade e um visual profissional.

- #### Deployment e Armazenamento com a Vercel
  A **Vercel** foi a escolha natural por ser a criadora do Next.js. A plataforma oferece um fluxo de deploy contínuo via Git, escalabilidade serverless automática, e serviços integrados como o **Vercel Blob**, que foi utilizado para o armazenamento seguro e público de arquivos como a logo da empresa e as propostas em PDF.

## 🛠️ Tecnologias Utilizadas

- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript
- **Backend:** API Routes & Server Actions
- **Banco de Dados:** PostgreSQL
- **ORM:** Prisma
- **Autenticação:** NextAuth.js
- **Estilização:** Tailwind CSS & shadcn/ui
- **Geração de PDF:** `pdf-lib`
- **Armazenamento de Arquivos:** Vercel Blob
- **Deployment:** Vercel

## ⚙️ Como Rodar Localmente

Siga os passos abaixo para configurar e rodar o projeto em seu ambiente de desenvolvimento.

**Pré-requisitos:**

- Node.js (v18 ou superior)
- NPM ou Yarn
- Docker e Docker Compose

**1. Clone o repositório:**

```bash
git clone [https://github.com/seu-usuario/seu-repositorio.git](https://github.com/seu-usuario/seu-repositorio.git)
cd seu-repositorio
```

**2. Instale as dependências:**

```bash
npm install
```

**3. Configure o Banco de Dados com Docker:**

```bash
docker-compose up -d
```

**4. Configure as Variáveis de Ambiente:**
Copie o arquivo `.env.example` para um novo arquivo chamado `.env` e preencha as variáveis.

```bash
cp .env.example .env
```

As variáveis essenciais são `DATABASE_URL`, `AUTH_SECRET` e `BLOB_READ_WRITE_TOKEN` (obtido no painel da Vercel).

**5. Aplique as Migrações do Banco de Dados:**

```bash
npx prisma migrate dev
```

Para popular o banco com o usuário admin inicial, se necessário, use o seed.

```bash
npx prisma db seed
```

**6. Rode o Servidor de Desenvolvimento:**

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`.

## ✨ Agradecimentos

Este projeto foi desenvolvido por **[SEU NOME AQUI]** em uma intensa e produtiva colaboração com o **Gemini**, a Inteligência Artificial do Google. A parceria foi fundamental em todas as etapas do projeto, desde a concepção da arquitetura e a depuração de erros complexos, até o design de novas funcionalidades e a revisão completa de segurança de todo o código-fonte.

## 📄 Licença

Distribuído sob a licença MIT. Veja o arquivo `LICENSE` para mais informações.
