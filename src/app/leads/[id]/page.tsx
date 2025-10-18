// src/app/leads/[id]/page.tsx (Versão Segura)

import { PrismaClient, Prisma } from "@prisma/client";
import { notFound } from "next/navigation";
import { formatCNPJ, formatPhone } from "@/lib/utils";
import Link from "next/link";
import EnrichButton from "@/components/EnrichButton";
import { Phone } from "lucide-react";
import StatusUpdater from "@/components/StatusUpdater";
import ContactManager from "@/components/ContactManager";
import DealManager from "@/components/DealManager";
import ProposalManager from "@/components/ProposalManager";
import ActivityManager from "@/components/ActivityManager";
import CollapsibleCard from "@/components/CollapsibleCard";
import ReminderManager from "@/components/ReminderManager";
import { auth } from "../../../../auth";

const prisma = new PrismaClient();

const leadWithDetails = Prisma.validator<Prisma.LeadDefaultArgs>()({
  include: {
    empresa: { include: { socios: true, contatos: true } },
    negocio: { include: { propostas: true } },
    atividades: true,
    lembretes: true,
  },
});
type LeadWithDetails = Prisma.LeadGetPayload<typeof leadWithDetails>;

// 2. A função de busca agora EXIGE o userId para garantir a segurança
async function getLeadDetails(
  id: number,
  userId: string
): Promise<LeadWithDetails | null> {
  const lead = await prisma.lead.findFirst({
    // Usamos findFirst para a busca composta
    where: {
      id: id,
      userId: userId, // <-- Filtro de segurança
    },
    include: {
      empresa: { include: { socios: true, contatos: true } },
      negocio: { include: { propostas: true } },
      atividades: { orderBy: { criadoEm: "desc" } }, // Boa prática: ordenar atividades
      lembretes: { orderBy: { data: "asc" } }, // Boa prática: ordenar lembretes
    },
  });
  if (!lead) return null;
  return lead;
}

const InfoCard = ({
  title,
  value,
  className = "",
  children,
}: {
  title: string;
  value?: string | number | null | undefined;
  className?: string;
  children?: React.ReactNode;
}) => (
  <div className={`bg-gray-700 p-4 rounded-lg ${className}`}>
    <h3 className="text-sm font-semibold text-gray-400">{title}</h3>
    {children || <p className="text-lg">{value || "Não informado"}</p>}
  </div>
);

export default async function LeadDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // 3. Obtemos a sessão diretamente no Server Component
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    // Se por algum motivo não houver sessão, nega o acesso.
    // O middleware já deve ter feito isso, mas é uma camada extra de segurança.
    notFound();
  }

  const leadId = parseInt(params.id, 10);
  // 4. Passamos o userId para a função de busca
  const lead = await getLeadDetails(leadId, userId);

  if (!lead) {
    notFound(); // Se o lead não existe OU não pertence ao usuário, a página não é encontrada
  }

  const empresa = lead.empresa;

  // O resto do seu JSX continua exatamente o mesmo, pois ele já recebe o 'lead' correto e seguro
  return (
    <main className="bg-gray-900 text-white min-h-screen p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            &larr; Voltar para a lista
          </Link>
        </div>
        <div className="bg-gray-800 shadow-md rounded-lg p-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold">{lead.nomeDevedor}</h1>
              {lead.nomeFantasia && (
                <h2 className="text-xl text-gray-400">{lead.nomeFantasia}</h2>
              )}
            </div>
            <div className="w-full sm:w-auto flex-shrink-0">
              <EnrichButton
                cnpj={lead.cnpj}
                buttonText={
                  empresa ? "Atualizar Dados Cadastrais" : "Enriquecer Dados"
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoCard title="CNPJ" value={formatCNPJ(lead.cnpj)} />
            <StatusUpdater leadId={lead.id} currentStatus={lead.status} />
            <div className="bg-red-900/50 p-4 rounded-lg border border-red-700">
              <h3 className="text-sm font-semibold text-red-300">
                Valor Total da Dívida (PGFN)
              </h3>
              <p className="text-2xl font-bold text-red-400">
                {lead.valorTotalDivida.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700 space-y-4">
            <DealManager lead={lead} />
            <ProposalManager lead={lead} />
          </div>
        </div>
        {empresa && (
          <>
            <CollapsibleCard title="Gestão de Contatos">
              <ContactManager
                contatos={empresa.contatos}
                empresaId={empresa.id}
              />
            </CollapsibleCard>
            <CollapsibleCard title="Histórico de Atividades">
              <ActivityManager leadId={lead.id} atividades={lead.atividades} />
            </CollapsibleCard>
            <CollapsibleCard title="Lembretes">
              <ReminderManager leadId={lead.id} lembretes={lead.lembretes} />
            </CollapsibleCard>
          </>
        )}
        <CollapsibleCard title="Dados Cadastrais">
          {empresa ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <InfoCard
                title="Situação Cadastral"
                value={empresa.situacaoCadastral}
              />
              <InfoCard
                title="Início da Atividade"
                value={
                  empresa.dataInicioAtividade
                    ? new Date(empresa.dataInicioAtividade).toLocaleDateString(
                        "pt-BR"
                      )
                    : "N/A"
                }
              />
              <InfoCard title="Porte da Empresa" value={empresa.porte} />
              <InfoCard
                title="Natureza Jurídica"
                value={empresa.naturezaJuridica}
              />
              <InfoCard
                title="Regime Tributário"
                value={empresa.regimeTributario}
              />
              <InfoCard
                title="Capital Social"
                value={empresa.capitalSocial?.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              />
              <InfoCard title="Telefone Principal">
                <div className="flex items-center gap-2">
                  <Phone className="text-gray-400" size={20} />
                  <p className="text-lg">{formatPhone(empresa.telefone)}</p>
                </div>
              </InfoCard>
              <InfoCard
                title="Endereço"
                value={`${empresa.logradouro || ""}, ${
                  empresa.numero || ""
                } - ${empresa.bairro || ""}, ${empresa.municipio} - ${
                  empresa.uf
                }`}
                className="md:col-span-2 lg:col-span-3"
              />
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">
              Clique em "Enriquecer Dados" para carregar estas informações.
            </p>
          )}
        </CollapsibleCard>
        {empresa && (
          <>
            <CollapsibleCard title="Atividades Econômicas (CNAE)">
              <div className="space-y-3 bg-gray-700 p-4 rounded-lg">
                <p>
                  <strong className="text-gray-400 block">Principal:</strong>{" "}
                  {empresa.cnaeFiscalDescricao}
                </p>
                <div>
                  <strong className="text-gray-400 block">Secundárias:</strong>
                  {(empresa.cnaesSecundarios as any[])?.length > 0 ? (
                    <ul className="list-disc list-inside pl-2">
                      {(empresa.cnaesSecundarios as any[])?.map((cnae: any) => (
                        <li key={cnae.codigo}>{cnae.descricao}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>Não informado.</p>
                  )}
                </div>
              </div>
            </CollapsibleCard>
            <CollapsibleCard title="Quadro de Sócios">
              <div className="space-y-2">
                {empresa.socios.map((socio) => (
                  <div
                    key={socio.id}
                    className="bg-gray-700 p-3 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-2"
                  >
                    <div>
                      <p className="font-semibold">{socio.nomeSocio}</p>
                      <p className="text-sm text-gray-400 font-mono">
                        {socio.documento || "Doc. não informado"}
                      </p>
                      <p className="text-sm text-gray-400">
                        {socio.qualificacaoSocio}
                      </p>
                    </div>
                    <p className="text-sm text-gray-400 self-start sm:self-center">
                      Desde:{" "}
                      {socio.dataEntradaSociedade
                        ? new Date(
                            socio.dataEntradaSociedade
                          ).toLocaleDateString("pt-BR")
                        : "N/A"}
                    </p>
                  </div>
                ))}
              </div>
            </CollapsibleCard>
          </>
        )}
        {!empresa && (
          <div className="bg-gray-800 shadow-md rounded-lg p-6 text-center text-gray-400">
            <p>
              Clique em "Enriquecer Dados" para carregar os detalhes do lead.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
