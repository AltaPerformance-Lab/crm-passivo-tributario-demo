// src/lib/utils.ts

export function formatCNPJ(cnpj: string): string {
  // Remove qualquer caractere que não seja um dígito
  const cleaned = cnpj.replace(/\D/g, "");

  // Verifica se a string tem 14 dígitos para ser um CNPJ válido
  if (cleaned.length !== 14) {
    return cnpj; // Retorna o original se não for um CNPJ
  }

  // Aplica a máscara do CNPJ (XX.XXX.XXX/XXXX-XX)
  return cleaned.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    "$1.$2.$3/$4-$5"
  );
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "Não informado";

  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.length === 11) {
    // Celular (XX) XXXXX-XXXX
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (cleaned.length === 10) {
    // Fixo (XX) XXXX-XXXX
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }

  // Retorna o original se não se encaixar nos padrões
  return phone;
}

export function formatPhoneOnType(phone: string): string {
  if (!phone) return "";

  const cleaned = phone.replace(/\D/g, "");
  const match = cleaned.match(/^(\d{2})(\d{0,5})(\d{0,4})$/);

  if (match) {
    let formatted = "(" + match[1];
    if (match[2]) {
      formatted += ") " + match[2];
    }
    if (match[3]) {
      formatted += "-" + match[3];
    }
    return formatted;
  }

  return phone;
}
