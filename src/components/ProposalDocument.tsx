import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  // Image, // Desativado para teste
  // Font, // Desativado para teste
} from "@react-pdf/renderer";
import type { Lead, Configuracao } from "@prisma/client";

/*
// --- FONTES EXTERNAS DESATIVADAS PARA TESTE ---
Font.register({
  family: "Helvetica",
  fonts: [
    {
      src: "https://fonts.cdnfonts.com/s/13057/Helvetica.woff",
      fontWeight: "normal",
    },
    {
      src: "https://fonts.cdnfonts.com/s/13057/Helvetica-Bold.woff",
      fontWeight: "bold",
    },
  ],
});
*/

interface ProposalData {
  validade: string;
  objeto: string;
  escopo: string;
  valores: string;
}

interface SimpleClient {
  nomeDevedor: string | null;
  cnpj: string | null;
}

interface SimpleConfig {
  nomeEmpresa: string | null;
  cnpj: string | null;
  endereco: string | null;
  email: string | null;
  telefone: string | null;
}

interface ProposalDocumentProps {
  client: SimpleClient;
  proposalData: ProposalData;
  config: SimpleConfig;
}

// Usamos apenas as fontes padrão (Helvetica) para o teste
const styles = StyleSheet.create({
  page: {
    paddingTop: 35,
    paddingBottom: 65,
    paddingHorizontal: 35,
    fontFamily: "Helvetica", // Fonte padrão
    fontSize: 10,
    color: "#333333",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
  },
  headerLeft: {
    width: "50%",
  },
  headerRight: {
    width: "50%",
    textAlign: "right",
    color: "#555555",
    fontSize: 9,
  },
  companyName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000000",
  },
  logo: {
    width: 70,
    height: "auto",
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 25,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#dddddd",
    paddingBottom: 3,
  },
  clientInfo: {
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 3,
    marginBottom: 20,
  },
  text: {
    marginBottom: 5,
    lineHeight: 1.4,
    textAlign: "justify",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 35,
    right: 35,
    textAlign: "center",
    fontSize: 8,
    color: "#aaaaaa",
  },
});

const formatCNPJ = (cnpj: string | null): string => {
  if (!cnpj) return "Não informado";
  return cnpj.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
};

export const ProposalDocument = ({
  client,
  proposalData,
  config,
}: ProposalDocumentProps) => {
  // const logoUrl = config.logoUrl || null; // Desativado para teste

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* O logótipo foi removido para o teste */}
            {/* {logoUrl && <Image style={styles.logo} src={logoUrl} />} */}
            <Text>Logótipo da Empresa</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.companyName}>
              {config.nomeEmpresa || "Nome da Empresa"}
            </Text>
            <Text>CNPJ: {config.cnpj || "Não informado"}</Text>
            <Text>{config.endereco || "Não informado"}</Text>
            <Text>
              Email: {config.email || "Não informado"} | Tel:{" "}
              {config.telefone || "Não informado"}
            </Text>
          </View>
        </View>

        <Text style={styles.mainTitle}>Proposta de Serviços Jurídicos</Text>

        <View style={styles.clientInfo}>
          <Text style={{ fontWeight: "bold" }}>Para:</Text>
          <Text>Razão Social: {client.nomeDevedor || "Não informado"}</Text>
          <Text>CNPJ: {formatCNPJ(client.cnpj)}</Text>
        </View>

        <View style={styles.section}>
          <Text>Data de Emissão: {new Date().toLocaleDateString("pt-BR")}</Text>
          <Text>
            Válida até:{" "}
            {proposalData.validade
              ? new Date(proposalData.validade).toLocaleDateString("pt-BR", {
                  timeZone: "UTC",
                })
              : "Não informado"}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Objeto da Proposta</Text>
          <Text style={styles.text}>
            {proposalData.objeto || "Não informado"}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Escopo dos Serviços</Text>
          <Text style={styles.text}>
            {proposalData.escopo || "Não informado"}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            3. Valores e Forma de Pagamento
          </Text>
          <Text style={styles.text}>
            {proposalData.valores || "Não informado"}
          </Text>
        </View>

        <Text style={styles.footer}>
          {config.nomeEmpresa || "Sua Empresa"} - Todos os direitos reservados.
        </Text>
      </Page>
    </Document>
  );
};
