/**
 * Configuração das páginas legais da TechDev.
 *
 * COMO TROCAR OS TEXTOS:
 * - Edite apenas os campos `title`, `intro` e o array `sections` de cada documento.
 * - Cada item de `sections` vira uma seção com subtítulo e entra automaticamente no índice.
 * - `paragraphs` aceita vários parágrafos; `list` (opcional) renderiza uma lista com marcadores.
 * - Ao publicar uma nova versão do documento, incremente a `version` correspondente.
 *   A versão aceita pelo usuário é gravada no banco no momento do cadastro.
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

export const PRIVACY_POLICY: LegalDocument = {
  slug: "politica-de-privacidade",
  version: "1.0",
  lastUpdated: "1 de julho de 2026",
  title: "Política de Privacidade",
  intro:
    "A TechDev respeita a privacidade dos seus usuários e desenvolve seus serviços buscando proteger as informações fornecidas pelos clientes. Esta Política de Privacidade explica como coletamos, utilizamos, armazenamos e protegemos dados pessoais.",
  seo: {
    title: "Política de Privacidade | TechDev",
    description:
      "Saiba como a TechDev coleta, utiliza, armazena e protege os seus dados pessoais.",
    path: "/politica-de-privacidade",
  },
  sections: [
    {
      id: "dados-coletados",
      title: "1. Dados coletados",
      paragraphs: ["A TechDev poderá coletar informações fornecidas pelo usuário, incluindo:"],
      list: [
        "nome;",
        "email;",
        "dados de cadastro;",
        "informações necessárias para contratação de serviços;",
        "histórico de pagamentos;",
        "informações de contato;",
        "registros de utilização da plataforma.",
      ],
    },
    {
      id: "utilizacao-dos-dados",
      title: "2. Utilização dos dados",
      paragraphs: ["Os dados poderão ser utilizados para:"],
      list: [
        "criação e gerenciamento de contas;",
        "prestação dos serviços contratados;",
        "processamento de pagamentos;",
        "comunicação com clientes;",
        "suporte;",
        "melhoria da plataforma;",
        "segurança e prevenção de fraudes.",
      ],
    },
    {
      id: "dados-pagamentos",
      title: "3. Dados relacionados a pagamentos",
      paragraphs: [
        "Os pagamentos são processados através de plataformas especializadas.",
        "A TechDev não armazena diretamente informações completas de cartão de crédito.",
        "Dados necessários para confirmação de pagamento poderão ser processados pelos parceiros responsáveis pelo processamento financeiro.",
      ],
    },
    {
      id: "projetos-personalizados",
      title: "4. Projetos personalizados",
      paragraphs: [
        "Quando um cliente solicita um orçamento para desenvolvimento de um site ou solução digital, a TechDev poderá utilizar as informações fornecidas para:",
      ],
      list: [
        "analisar o projeto;",
        "elaborar propostas comerciais;",
        "entrar em contato;",
        "executar o serviço contratado.",
      ],
    },
    {
      id: "compartilhamento",
      title: "5. Compartilhamento de informações",
      paragraphs: ["A TechDev poderá compartilhar dados quando necessário para:"],
      list: [
        "processamento de pagamentos;",
        "funcionamento dos serviços;",
        "cumprimento de obrigações legais;",
        "proteção de direitos da empresa e usuários.",
      ],
    },
    {
      id: "armazenamento-seguranca",
      title: "6. Armazenamento e segurança",
      paragraphs: [
        "A TechDev não comercializa dados pessoais dos usuários.",
        "A TechDev utiliza medidas técnicas e administrativas para proteger informações contra acesso indevido, perda ou alteração não autorizada.",
        "Apesar dos esforços de segurança, nenhum sistema conectado à internet possui garantia absoluta contra todos os riscos.",
      ],
    },
    {
      id: "cookies",
      title: "7. Cookies e tecnologias semelhantes",
      paragraphs: ["A TechDev poderá utilizar cookies e tecnologias semelhantes para:"],
      list: [
        "manter funcionalidades;",
        "melhorar a experiência do usuário;",
        "analisar utilização da plataforma;",
        "aumentar segurança.",
      ],
    },
    {
      id: "direitos-do-usuario",
      title: "8. Direitos do usuário",
      paragraphs: ["Conforme a legislação aplicável, o usuário poderá solicitar:"],
      list: [
        "confirmação de tratamento dos dados;",
        "acesso às informações;",
        "correção de dados;",
        "atualização;",
        "exclusão quando aplicável.",
      ],
    },
    {
      id: "alteracoes",
      title: "9. Alterações desta Política",
      paragraphs: [
        "As solicitações poderão ser realizadas através dos canais oficiais.",
        "A TechDev poderá atualizar esta Política de Privacidade para acompanhar mudanças na plataforma ou na legislação.",
        "A versão atualizada estará disponível no site.",
      ],
    },
    {
      id: "contato",
      title: "10. Contato",
      paragraphs: [
        "Para dúvidas, suporte, solicitações relacionadas aos serviços, pagamentos, privacidade ou demais assuntos, o usuário poderá entrar em contato através dos canais oficiais:",
        "Email: contato.techdev.br@gmail.com",
        "WhatsApp de suporte: +55 21 98038-6279",
        "Website: https://www.techdev.website",
      ],
    },
  ],
};

export const TERMS_OF_USE: LegalDocument = {
  slug: "termos-de-uso",
  version: "1.0",
  lastUpdated: "1 de julho de 2026",
  title: "Termos de Uso",
  intro:
    "Bem-vindo à TechDev. Estes Termos de Uso estabelecem as regras e condições aplicáveis ao uso da plataforma, contratação de serviços, aquisição de planos e desenvolvimento de soluções digitais oferecidas pela TechDev. Ao acessar nosso site, criar uma conta, contratar um serviço ou utilizar qualquer recurso disponibilizado pela TechDev, o usuário declara que leu, compreendeu e concorda com estes Termos de Uso.",
  seo: {
    title: "Termos de Uso | TechDev",
    description:
      "Conheça os termos e condições que regem o uso dos serviços e da plataforma TechDev.",
    path: "/termos-de-uso",
  },
  sections: [
    {
      id: "sobre-a-techdev",
      title: "1. Sobre a TechDev",
      paragraphs: [
        "A TechDev atua no desenvolvimento e disponibilização de soluções digitais, incluindo plataformas online, criação de sites, serviços digitais e planos de assinatura.",
        "A TechDev poderá disponibilizar diferentes modalidades de serviços, conforme as necessidades de cada cliente.",
      ],
    },
    {
      id: "cadastro",
      title: "2. Cadastro e informações do usuário",
      paragraphs: [
        "Para utilizar determinados recursos da plataforma, o usuário poderá precisar criar uma conta fornecendo informações pessoais.",
        "O usuário se compromete a fornecer informações verdadeiras, completas e atualizadas.",
        "O usuário é responsável pela proteção de suas credenciais de acesso, sendo recomendado não compartilhar login e senha com terceiros.",
      ],
    },
    {
      id: "planos-assinatura",
      title: "3. Planos de assinatura",
      paragraphs: [
        "A TechDev poderá oferecer planos de assinatura com diferentes funcionalidades, recursos e valores.",
        "As condições de cada plano serão apresentadas antes da contratação, incluindo:",
      ],
      list: [
        "valor;",
        "período de cobrança;",
        "funcionalidades disponíveis;",
        "limitações aplicáveis.",
      ],
    },
    {
      id: "projetos-personalizados",
      title: "4. Desenvolvimento de sites e projetos personalizados",
      paragraphs: [
        "A contratação será considerada realizada após a confirmação do pagamento.",
        "A TechDev também oferece serviços personalizados de desenvolvimento de sites e soluções digitais.",
        "Devido à natureza personalizada desses serviços, cada projeto poderá possuir um valor diferente, considerando fatores como:",
      ],
      list: [
        "complexidade do projeto;",
        "quantidade de páginas;",
        "funcionalidades necessárias;",
        "integrações solicitadas;",
        "prazo de desenvolvimento;",
        "nível de personalização.",
      ],
    },
    {
      id: "aprovacao-projetos",
      title: "5. Aprovação de projetos personalizados",
      paragraphs: [
        "O valor final será definido após análise das necessidades apresentadas pelo cliente.",
        "O orçamento informado pela TechDev representa uma proposta comercial específica para aquele projeto e poderá variar conforme alterações solicitadas pelo cliente.",
        "Antes do início de um projeto personalizado, o cliente deverá concordar com as condições apresentadas pela TechDev, incluindo:",
      ],
      list: [
        "escopo do projeto;",
        "valores;",
        "prazos;",
        "entregas previstas;",
        "condições de pagamento.",
      ],
    },
    {
      id: "pagamentos",
      title: "6. Pagamentos",
      paragraphs: [
        "Alterações solicitadas após a aprovação poderão gerar ajustes de prazo e valores.",
        "Os pagamentos poderão ser realizados através dos meios disponibilizados pela TechDev.",
        "Ao contratar um serviço ou assinatura, o usuário autoriza a cobrança referente ao produto ou serviço escolhido.",
        "Em assinaturas recorrentes, novas cobranças poderão ocorrer automaticamente conforme o período contratado até que o cancelamento seja solicitado.",
      ],
    },
    {
      id: "entrega",
      title: "7. Entrega e disponibilização dos serviços",
      paragraphs: [
        "No caso de planos digitais, o acesso será liberado após a confirmação do pagamento.",
        "No caso de projetos personalizados, a entrega ocorrerá conforme o escopo e prazo acordados entre as partes.",
        "O cliente reconhece que a disponibilização do acesso, entrega de arquivos, publicação do site ou disponibilização das funcionalidades representa a prestação do serviço contratado.",
      ],
    },
    {
      id: "cancelamento",
      title: "8. Cancelamento",
      paragraphs: [
        "O usuário poderá solicitar o cancelamento de assinaturas através dos canais oficiais da TechDev.",
        "O cancelamento impedirá cobranças futuras, porém não cancela automaticamente valores já pagos referentes a serviços já iniciados, períodos já utilizados ou projetos aprovados.",
      ],
    },
    {
      id: "reembolsos",
      title: "9. Reembolsos e contestações",
      paragraphs: [
        "A TechDev busca resolver qualquer dúvida ou problema através dos canais oficiais de atendimento.",
        "Antes da abertura de uma contestação de pagamento, o cliente concorda em tentar solucionar a situação diretamente com a TechDev.",
        "Em casos de contestação, a TechDev poderá apresentar registros como:",
      ],
      list: [
        "cadastro;",
        "aceite dos termos;",
        "comprovantes de pagamento;",
        "conversas de atendimento;",
        "aprovação de orçamento;",
        "registros de acesso;",
        "comprovação de entrega dos serviços.",
      ],
    },
    {
      id: "uso-adequado",
      title: "10. Uso adequado dos serviços",
      paragraphs: [
        "O usuário concorda em utilizar os serviços da TechDev de forma legal e adequada.",
        "É proibido:",
      ],
      list: [
        "utilizar os serviços para atividades ilegais;",
        "tentar comprometer sistemas da TechDev;",
        "acessar informações de terceiros sem autorização;",
        "utilizar recursos para prejudicar outros usuários.",
      ],
    },
    {
      id: "propriedade-intelectual",
      title: "11. Propriedade intelectual",
      paragraphs: [
        "Os materiais, sistemas, códigos, elementos visuais e tecnologias desenvolvidas pela TechDev permanecem protegidos por direitos de propriedade intelectual.",
        "A utilização dos serviços não transfere automaticamente direitos sobre tecnologias internas ou materiais proprietários da TechDev.",
        "Em projetos personalizados, a transferência de determinados materiais poderá ocorrer conforme acordado comercialmente.",
      ],
    },
    {
      id: "disponibilidade",
      title: "12. Disponibilidade dos serviços",
      paragraphs: [
        "A TechDev trabalha para manter seus serviços disponíveis, porém podem ocorrer interrupções temporárias por motivos técnicos, manutenção, atualizações ou fatores externos.",
      ],
    },
    {
      id: "alteracoes-termos",
      title: "13. Alterações dos termos",
      paragraphs: [
        "A TechDev poderá atualizar estes Termos de Uso sempre que necessário.",
        "A versão atualizada estará disponível no site oficial.",
      ],
    },
    {
      id: "aceitacao",
      title: "14. Aceitação",
      paragraphs: ["Ao utilizar a TechDev, o usuário confirma que:"],
      list: [
        "leu estes Termos de Uso;",
        "compreendeu as condições;",
        "concorda com as regras apresentadas.",
      ],
    },
    {
      id: "contato",
      title: "15. Contato",
      paragraphs: [
        "Contato: contato.techdev.br@gmail.com",
        "WhatsApp de suporte: +55 21 98038-6279",
        "Site: https://www.techdev.website",
      ],
    },
  ],
};

/** Versões atuais — enviadas ao backend no cadastro para registrar o aceite. */
export const TERMS_VERSION = TERMS_OF_USE.version;
export const PRIVACY_VERSION = PRIVACY_POLICY.version;
