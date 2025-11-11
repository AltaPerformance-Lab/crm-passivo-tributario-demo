# Prospect CRM
# 🧪 Nosso Laboratório: Prospect CRM (SaaS 100% Serverless)

Este projeto é uma "prova de conceito" (Proof of Concept) do **Laboratório da Alta Performance Web**.

É uma solução moderna e segura para gestão de leads e prospecção de clientes com foco em consultoria tributária. Este sistema full-stack gerencia o ciclo de vida completo de um lead, desde a importação em lote até a geração de propostas e análise de métricas, com uma arquitetura multi-usuário segura e escalável.

### [Acesse a Demo Ao Vivo](https://prospect-crm-demo.vercel.app/)
---

## 🔑 Credenciais da Demo

Explore o sistema como Administrador para ver todos os dashboards e leads.

* **Login:** `admin@demo.com`
* **Senha:** `password123`

---

## 🏛️ A Prova da Arquitetura "Premium ++"

Este projeto existe para provar uma tese: a arquitetura 100% Serverless é a escolha superior para a maioria dos produtos SaaS modernos, oferecendo escalabilidade infinita, performance global e custo zero quando ocioso.

Enquanto o nosso **[Projeto AgroMaq](https://github.com/AltaPerformance-Lab/Agromaq-classificados-agricolas)** demonstra nossa maestria em arquiteturas **Stateful/Containerizadas (Docker/Railway)**, este CRM prova nosso domínio total da arquitetura **100% Serverless (Vercel/Neon/Blob)**.



Como "Arquitetos de Soluções", escolhemos a ferramenta certa para o trabalho.

---

## 📖 Guia Rápido de Uso (Features em Destaque)

1.  **Cadastro do Admin:** O primeiro usuário (criado via "seed") é o Administrador.
2.  **Configuração:** Na página de "Configurações", o admin insere os dados da empresa e faz o upload da logo (via **Vercel Blob**), que é usada dinamicamente nas propostas.
3.  **Gestão de Usuários:** O Admin pode cadastrar novos membros da equipe.
4.  **Importação de Leads:** Na página "Importar", o usuário pode subir uma planilha CSV com milhares de leads. O sistema processa os dados em lotes para garantir a performance.
5.  **Painel de Leads:** A tela principal exibe todos os leads do usuário logado, com filtros poderosos por status, localidade, nome e valor.
6.  **Enriquecimento de Dados:** (Demo) Com um clique, o sistema simula uma busca de dados cadastrais completos da empresa (endereço, sócios, etc.) usando o CNPJ.
7.  **Detalhes do Lead:** Cada lead tem uma página de detalhes completa para gerenciar contatos, adicionar notas de atividade e agendar lembretes.
8.  **Geração de Propostas:** Na tela de detalhes, o usuário gera propostas em PDF (usando **`pdf-lib`** no servidor) que são salvas no **Vercel Blob** e ficam disponíveis para download.
9.  **Análise de Métricas:** O Dashboard de Métricas oferece uma visão completa do funil de vendas, com gráficos sobre a performance no período e cards com os totais históricos.

---

## 🛠️ O Arsenal (Stack 100% Serverless)

* **Framework:** Next.js 14 (App Router)
* **Linguagem:** TypeScript
* **Backend:** API Routes & Server Actions
* **Banco de Dados:** PostgreSQL (via **Neon** Serverless)
* **ORM:** Prisma
* **Autenticação:** NextAuth.js (v4)
* **Estilização:** Tailwind CSS & shadcn/ui
* **Geração de PDF:** `pdf-lib` (executado no servidor)
* **Armazenamento de Arquivos:** Vercel Blob
* **Deployment:** Vercel

---

## 🧠 Decisões de Arquitetura (O "Porquê")

A escolha das tecnologias foi pensada para criar um sistema moderno, seguro e performático.

* #### Full Stack com Next.js (App Router)
    Usamos **Server Components** para renderizar páginas e buscar dados no servidor (performance) e **Client Components** para páginas interativas (formulários, dashboards). As **API Routes** constroem o backend, mantendo o projeto unificado.

* #### Banco de Dados com Prisma & PostgreSQL
    O **Prisma** foi escolhido pela sua segurança de tipos (TypeScript), que previne uma classe inteira de bugs. O **PostgreSQL (Neon)** oferece a robustez de um banco relacional com a escalabilidade do serverless.

* #### Autenticação com NextAuth.js
    Implementamos uma estratégia de `Credentials` com senhas criptografadas (`bcryptjs`) e `callbacks` para enriquecer a sessão do usuário com seu `id` e `role` (ADMIN/USER), crucial para a segurança do sistema.

* #### Geração de PDF com `pdf-lib` (A Reviravolta)
    O projeto iniciou usando `@react-pdf/renderer`, mas enfrentamos erros complexos de build na Vercel. **Pivotamos** para a `pdf-lib`, uma solução programática no lado do servidor. Isso resultou em uma funcionalidade mais leve, sem dependências pesadas de renderização, e 100% confiável no ambiente serverless.

* #### Deployment e Armazenamento com a Vercel
    A **Vercel** oferece um fluxo de deploy contínuo via Git, escalabilidade serverless automática, e o **Vercel Blob** para armazenamento seguro de arquivos (logos, propostas).

---

## ⚙️ Como Rodar Localmente

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/AltaPerformance-Lab/prospect-crm-demo.git](https://github.com/AltaPerformance-Lab/prospect-crm-demo.git)
    cd prospect-crm-demo
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure o Banco de Dados (Docker ou Neon):**
    * Este projeto **não** precisa de Docker.
    * Crie um banco de dados gratuito no [Neon](https://neon.tech/).
    * Copie o arquivo `.env.example` para `.env` e preencha as variáveis.
        ```.env
        DATABASE_URL="sua_string_de_conexao_neon_aqui?pg-bouncer=true"
        AUTH_SECRET="gere_uma_chave_secreta"
        BLOB_READ_WRITE_TOKEN="seu_token_do_vercel_blob"
        ```

4.  **Aplique as Migrações do Banco de Dados:**
    ```bash
    npm run prisma:migrate
    ```

5.  **Popule o Banco com Dados de Demo:**
    ```bash
    npm run prisma:seed
    ```

6.  **Rode o servidor:**
    ```bash
    npm run dev
    ```

Acesse `http://localhost:3000`.

