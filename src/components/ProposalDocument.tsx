import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";
import type { Lead, Configuracao } from "@prisma/client";

// O registro de fontes permanece o mesmo
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

interface ProposalData {
  validade: string;
  objeto: string;
  escopo: string;
  valores: string;
}

interface ProposalDocumentProps {
  client: Lead;
  proposalData: ProposalData;
  config: Configuracao;
}

// Os estilos permanecem os mesmos
const styles = StyleSheet.create({
  page: {
    paddingTop: 35,
    paddingBottom: 65,
    paddingHorizontal: 35,
    fontFamily: "Helvetica",
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
  // --- CORREÇÃO NA LÓGICA DO LOGÓTIPO ---
  // A URL do Vercel Blob já é um caminho absoluto, não precisamos de adicionar o domínio.
  const logoAbsPath = config.logoUrl;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* Adicionamos uma verificação extra para garantir que a URL do logo não está vazia */}
            {logoAbsPath && <Image style={styles.logo} src={logoAbsPath} />}
          </View>
          <View style={styles.headerRight}>
            {/* --- CORREÇÃO DE ROBUSTEZ: Adicionamos fallbacks para todos os dados --- */}
            <Text style={styles.companyName}>
              {config.nomeEmpresa || "Nome da Empresa"}
            </Text>
            <Text>CNPJ: {config.cnpj || "Não informado"}</Text>
            <Text>{config.endereco || "Endereço não informado"}</Text>
            <Text>
              Email: {config.email || "N/A"} | Tel: {config.telefone || "N/A"}
            </Text>
          </View>
        </View>

        <Text style={styles.mainTitle}>Proposta de Serviços Jurídicos</Text>

        <View style={styles.clientInfo}>
          <Text style={{ fontWeight: "bold" }}>Para:</Text>
          <Text>
            Razão Social: {client.nomeDevedor || "Cliente não informado"}
          </Text>
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
