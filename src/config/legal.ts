/**
 * Configuração das páginas legais da TechDev.
 *
 * COMO TROCAR OS TEXTOS:
 * - Edite apenas os campos `title`, `intro` e o array `sections` de cada documento.
 * - Cada item de `sections` vira uma seção com subtítulo e entra automaticamente no índice.
 * - `paragraphs` aceita vários parágrafos; `list` (opcional) renderiza uma lista com marcadores.
 * - Ao publicar uma nova versão do documento, incremente a `version` correspondente.
 *   A versão aceita pelo usuário é gravada no banco no momento do cadastro.
 *
 * Os textos abaixo são TEMPORÁRIOS (placeholders) e devem ser substituídos pelos
 * textos jurídicos definitivos. A estrutura não precisa mudar.
 */

export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
  list?: string[];
};

export type LegalDocument = {
  slug: string;
  version: string;
  lastUpdated: string; // exibido ao usuário (formato livre)
  title: string;
  intro: string;
  seo: {
    title: string;
    description: string;
    path: string;
  };
  sections: LegalSection[];
};

const PLACEHOLDER = "Este é um texto temporário (placeholder) e será substituído pelo conteúdo jurídico definitivo da TechDev. A estrutura da página já está pronta para receber o texto final sem necessidade de alterações no código.";

export const PRIVACY_POLICY: LegalDocument = {
  slug: "politica-de-privacidade",
  version: "1.0",
  lastUpdated: "1 de julho de 2026",
  title: "Política de Privacidade",
  intro:
    "Esta Política de Privacidade descreve como a TechDev coleta, utiliza e protege os seus dados. O conteúdo abaixo é temporário e será atualizado com a versão definitiva.",
  seo: {
    title: "Política de Privacidade | TechDev",
    description:
      "Saiba como a TechDev coleta, utiliza, armazena e protege os seus dados pessoais.",
    path: "/politica-de-privacidade",
  },
  sections: [
    { id: "introducao", title: "1. Introdução", paragraphs: [PLACEHOLDER] },
    { id: "dados-coletados", title: "2. Dados que coletamos", paragraphs: [PLACEHOLDER], list: ["Dados de cadastro (placeholder)", "Dados de uso (placeholder)", "Dados de pagamento (placeholder)"] },
    { id: "uso-dos-dados", title: "3. Como usamos os dados", paragraphs: [PLACEHOLDER] },
    { id: "compartilhamento", title: "4. Compartilhamento de dados", paragraphs: [PLACEHOLDER] },
    { id: "cookies", title: "5. Cookies e tecnologias similares", paragraphs: [PLACEHOLDER] },
    { id: "seguranca", title: "6. Segurança das informações", paragraphs: [PLACEHOLDER] },
    { id: "direitos", title: "7. Seus direitos", paragraphs: [PLACEHOLDER] },
    { id: "retencao", title: "8. Retenção de dados", paragraphs: [PLACEHOLDER] },
    { id: "alteracoes", title: "9. Alterações nesta política", paragraphs: [PLACEHOLDER] },
    { id: "contato", title: "10. Contato", paragraphs: [PLACEHOLDER] },
  ],
};

export const TERMS_OF_USE: LegalDocument = {
  slug: "termos-de-uso",
  version: "1.0",
  lastUpdated: "1 de julho de 2026",
  title: "Termos de Uso",
  intro:
    "Estes Termos de Uso regem o acesso e a utilização dos serviços da TechDev. O conteúdo abaixo é temporário e será atualizado com a versão definitiva.",
  seo: {
    title: "Termos de Uso | TechDev",
    description:
      "Conheça os termos e condições que regem o uso dos serviços e da plataforma TechDev.",
    path: "/termos-de-uso",
  },
  sections: [
    { id: "aceitacao", title: "1. Aceitação dos termos", paragraphs: [PLACEHOLDER] },
    { id: "definicoes", title: "2. Definições", paragraphs: [PLACEHOLDER] },
    { id: "uso-da-plataforma", title: "3. Uso da plataforma", paragraphs: [PLACEHOLDER] },
    { id: "conta", title: "4. Conta do usuário", paragraphs: [PLACEHOLDER] },
    { id: "planos-e-pagamentos", title: "5. Planos e pagamentos", paragraphs: [PLACEHOLDER] },
    { id: "obrigacoes", title: "6. Obrigações do usuário", paragraphs: [PLACEHOLDER], list: ["Obrigação de exemplo (placeholder)", "Obrigação de exemplo (placeholder)"] },
    { id: "propriedade-intelectual", title: "7. Propriedade intelectual", paragraphs: [PLACEHOLDER] },
    { id: "limitacao", title: "8. Limitação de responsabilidade", paragraphs: [PLACEHOLDER] },
    { id: "rescisao", title: "9. Cancelamento e rescisão", paragraphs: [PLACEHOLDER] },
    { id: "alteracoes", title: "10. Alterações nos termos", paragraphs: [PLACEHOLDER] },
    { id: "contato", title: "11. Contato", paragraphs: [PLACEHOLDER] },
  ],
};

/** Versões atuais — enviadas ao backend no cadastro para registrar o aceite. */
export const TERMS_VERSION = TERMS_OF_USE.version;
export const PRIVACY_VERSION = PRIVACY_POLICY.version;
