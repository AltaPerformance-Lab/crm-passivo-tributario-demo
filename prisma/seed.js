const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
// A importação correta para o Faker v8.x.x
const { faker } = require('@faker-js/faker/locale/pt_BR');

// (Nós NÃO precisamos mais do 'faker-br')

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('🧹 Limpando o banco de dados...');
  // A ordem é crucial para evitar erros de chave estrangeira
  await prisma.proposta.deleteMany({});
  await prisma.lembrete.deleteMany({});
  await prisma.atividade.deleteMany({});
  await prisma.negocio.deleteMany({});
  await prisma.contato.deleteMany({});
  await prisma.socio.deleteMany({});
  
  // --- CORREÇÃO: Trocamos a ordem. Leads dependem de Empresas ---
  await prisma.lead.deleteMany({}); 
  await prisma.empresa.deleteMany({});
  // --- Fim da Correção ---
  
  await prisma.configuracao.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('✅ Banco de dados limpo.');
}

async function seedUsers() {
  console.log('👤 Criando usuários...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@demo.com',
      name: 'Admin da Demo',
      password: hashedPassword,
      role: 'ADMIN',
      configuracao: {
        create: {
          nomeEmpresa: 'APW Consultoria Tributária',
          cnpj: '00.000.000/0001-00',
          endereco: 'Av. Principal, 123, Itumbiara, GO',
          email: 'contato@apwconsultoria.com',
          telefone: '(64) 99999-8888',
          logoUrl: 'https://res.cloudinary.com/ddbhf4qut/image/upload/v1762742682/AgroMaq_rww3kx.png',
        },
      },
    },
  });

  const user1 = await prisma.user.create({
    data: {
      email: 'usuario@demo.com',
      name: 'Usuário de Demonstração',
      password: hashedPassword,
      role: 'USER',
    },
  });

  console.log('✅ Usuários criados.');
  return { adminUser, user1 };
}

// --- CORREÇÃO: Quebramos a função 'seedLeads' em duas ---

async function seedEmpresasELeads(adminUser, user1) {
  console.log('📈 Criando empresas e leads... (Isso pode levar um momento)');

  const cnpjs = [
    '79.926.197/0001-44',
    '77.235.723/0001-02',
    '64.905.012/0001-48',
    '60.157.720/0001-97',
    '89.768.440/0001-05'
  ];

  // --- Lead 1: CONVERTIDO (Admin) ---
  // Primeiro, criamos a Empresa
  const empresa1 = await prisma.empresa.create({
    data: {
      cnpj: cnpjs[0],
      razaoSocial: 'Transportadora Rápida S.A.',
      nomeFantasia: 'Expresso Veloz',
      situacaoCadastral: 'ATIVA',
      logradouro: faker.location.streetAddress(),
      municipio: 'São Paulo',
      uf: 'SP',
      capitalSocial: 5000000,
      cnaeFiscalDescricao: 'Transporte rodoviário de carga',
      socios: {
        create: [
          { nomeSocio: faker.person.fullName(), qualificacaoSocio: 'Sócio-Administrador' },
          { nomeSocio: faker.person.fullName(), qualificacaoSocio: 'Sócio' },
        ],
      },
      contatos: {
        create: { nome: faker.person.fullName(), cargo: 'Diretor Financeiro', email: faker.internet.email() },
      },
    }
  });

  // Agora, criamos o Lead e conectamos a Empresa (usando 'empresaId')
  await prisma.lead.create({
    data: {
      cnpj: cnpjs[0],
      nomeDevedor: 'Transportadora Rápida S.A.',
      nomeFantasia: 'Expresso Veloz',
      valorTotalDivida: 1250000,
      status: 'CONVERTIDO',
      municipio: 'São Paulo',
      uf: 'SP',
      userId: adminUser.id,
      empresaId: empresa1.id, // <-- AQUI ESTÁ A CORREÇÃO
      atividades: {
        create: [
          { conteudo: 'Primeiro contato realizado via telefone. Diretor financeiro (Sr. Carlos) demonstrou grande interesse.' },
          { conteudo: 'Reunião de diagnóstico agendada para 10/11.' },
          { conteudo: 'Proposta enviada.' },
        ],
      },
      negocio: {
        create: {
          valorFechado: 1250000,
          valorOutraParte: 125000,
          valorRecebido: 1125000,
          dataFechamento: new Date(),
          userId: adminUser.id,
          propostas: {
            create: {
              objeto: 'Recuperação de Créditos de PIS/COFINS sobre fretes',
              escopo: 'Análise dos últimos 5 anos de impostos.',
              caminhoArquivo: 'https://exemplo.com/proposta-demo.pdf', 
              nomeArquivo: 'Proposta_Transportadora_Rapida.pdf',
            },
          },
        },
      },
    },
  });

  // --- Lead 2: EM NEGOCIAÇÃO (Admin) ---
  // (Este não tem empresa enriquecida, então o 'create' é mais simples)
  await prisma.lead.create({
    data: {
      cnpj: cnpjs[1],
      nomeDevedor: 'Indústria Metarlúgica Forja Forte Ltda.',
      nomeFantasia: 'Forja Forte',
      valorTotalDivida: 850000,
      status: 'EM_NEGOCIACAO',
      municipio: 'Joinville',
      uf: 'SC',
      userId: adminUser.id,
      atividades: {
        create: { conteudo: 'Cliente solicitou ajuste na proposta. Enviando V2.' },
      },
      lembretes: {
        create: {
          data: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), 
          descricao: 'Fazer follow-up com a Sra. Maria sobre a V2 da proposta.',
        },
      },
    },
  });

  // --- Lead 3: NÃO TEM INTERESSE (Admin) ---
  await prisma.lead.create({
    data: {
      cnpj: cnpjs[2],
      nomeDevedor: 'Mercado Vizinhança Ltda.',
      valorTotalDivida: 150000,
      status: 'NAO_TEM_INTERESSE',
      municipio: 'Goiânia',
      uf: 'GO',
      userId: adminUser.id,
      atividades: {
        create: { conteudo: 'Cliente informou que já possui consultoria e está satisfeito. (25/10)' },
      },
    },
  });

  // --- Lead 4: A VERIFICAR (Admin) ---
  await prisma.lead.create({
    data: {
      cnpj: cnpjs[3],
      nomeDevedor: 'Panificadora Doce Pão',
      valorTotalDivida: 75000,
      status: 'A_VERIFICAR',
      municipio: 'Rio de Janeiro',
      uf: 'RJ',
      userId: adminUser.id,
    },
  });

  // --- Lead 5: VERIFICADO (Usuário 1) ---
  await prisma.lead.create({
    data: {
      cnpj: cnpjs[4],
      nomeDevedor: 'Tech Solutions ABC Ltda.',
      valorTotalDivida: 320000,
      status: 'VERIFICADO',
      municipio: 'Curitiba',
      uf: 'PR',
      userId: user1.id,
    },
  });

  console.log('✅ Leads e relacionamentos complexos criados.');
}

async function main() {
  try {
    console.log('Iniciando o script de seed "Premium ++" do Prospect CRM...');
    
    // 1. Limpa o banco de dados
    await clearDatabase();
    
    // 2. Cria os usuários
    const { adminUser, user1 } = await seedUsers();
    
    // 3. Cria os leads (a parte principal da demo)
    await seedEmpresasELeads(adminUser, user1); // <-- Nome da função atualizado

    console.log('🎉 Seed concluído com sucesso! O banco de dados da demo está pronto.');
    
  } catch (e) {
    console.error('Ocorreu um erro durante o processo de seed:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();