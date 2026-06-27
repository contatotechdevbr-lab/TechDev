// Dados de exemplo do Painel CEO da TechDev.
// Toda a interface está pronta para conectar com um banco de dados futuramente:
// basta substituir estes arrays por queries (ex: Supabase) mantendo os mesmos tipos.

export type StatusCliente = "ativo" | "pendente" | "inativo";
export type StatusSite = "ativo" | "desenvolvimento" | "suspenso" | "cancelado";
export type StatusAssinatura = "ativa" | "pausada" | "cancelada" | "atrasada";
export type StatusPagamento = "pago" | "pendente" | "atrasado";
export type StatusProjeto = "briefing" | "design" | "desenvolvimento" | "revisao" | "finalizado";
export type CargoUsuario = "ceo" | "administrador" | "funcionario";

export interface Cliente {
  id: string;
  nome: string;
  empresa: string;
  email: string;
  telefone: string;
  plano: string;
  valorMensalCents: number;
  contratacao: string; // ISO
  status: StatusCliente;
  siteId: string | null;
  proximoPagamento: string; // ISO
  observacoes?: string;
  avatarCor: string;
}

export interface Site {
  id: string;
  nome: string;
  clienteId: string;
  dominio: string;
  status: StatusSite;
  criacao: string;
  plano: string;
  ultimaAtualizacao: string;
  link: string;
  tecnologia: string;
}

export interface Assinatura {
  id: string;
  clienteId: string;
  plano: string;
  valorCents: number;
  renovacao: string;
  status: StatusAssinatura;
  cicloMeses: number;
}

export interface Pagamento {
  id: string;
  clienteId: string;
  plano: string;
  valorCents: number;
  data: string;
  status: StatusPagamento;
  metodo: "Cartão" | "Pix" | "Boleto" | "Transferência";
}

export interface Projeto {
  id: string;
  cliente: string;
  clienteId: string;
  tipo: string;
  responsavel: string;
  status: StatusProjeto;
  prazo: string;
  progresso: number;
  checklist: { item: string; done: boolean }[];
  anotacoes: string;
}

export interface UsuarioAdmin {
  id: string;
  nome: string;
  email: string;
  cargo: CargoUsuario;
  ativo: boolean;
  ultimoAcesso: string;
}

export interface Notificacao {
  id: string;
  titulo: string;
  descricao: string;
  tempo: string;
  lida: boolean;
  tipo: "pagamento" | "cliente" | "site" | "sistema";
}

export interface LogEntry {
  id: string;
  usuario: string;
  acao: string;
  alvo: string;
  data: string;
}

export const fmtBRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const fmtData = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

export const clientes: Cliente[] = [
  { id: "c1", nome: "Mariana Lopes", empresa: "Lopes Advocacia", email: "mariana@lopesadv.com.br", telefone: "(11) 98877-1234", plano: "Profissional", valorMensalCents: 49900, contratacao: "2025-01-12", status: "ativo", siteId: "s1", proximoPagamento: "2026-07-12", observacoes: "Cliente prefere contato por WhatsApp.", avatarCor: "205 85% 55%" },
  { id: "c2", nome: "Rafael Mendes", empresa: "FitPro Academia", email: "rafael@fitpro.com", telefone: "(21) 99654-7788", plano: "Premium", valorMensalCents: 89900, contratacao: "2024-11-03", status: "ativo", siteId: "s2", proximoPagamento: "2026-07-03", avatarCor: "152 60% 50%" },
  { id: "c3", nome: "Juliana Castro", empresa: "Castro Arquitetura", email: "ju@castroarq.com.br", telefone: "(31) 98123-4567", plano: "Profissional", valorMensalCents: 49900, contratacao: "2025-03-21", status: "ativo", siteId: "s3", proximoPagamento: "2026-07-21", avatarCor: "32 90% 55%" },
  { id: "c4", nome: "Pedro Henrique", empresa: "PH Consultoria", email: "pedro@phconsult.com", telefone: "(41) 99888-3322", plano: "Essencial", valorMensalCents: 19900, contratacao: "2025-05-09", status: "pendente", siteId: "s4", proximoPagamento: "2026-07-09", observacoes: "Pagamento de junho em atraso.", avatarCor: "262 60% 60%" },
  { id: "c5", nome: "Camila Ribeiro", empresa: "Doce Sabor Confeitaria", email: "camila@docesabor.com", telefone: "(51) 98765-1100", plano: "Profissional", valorMensalCents: 49900, contratacao: "2024-08-15", status: "ativo", siteId: "s5", proximoPagamento: "2026-07-15", avatarCor: "340 75% 60%" },
  { id: "c6", nome: "Lucas Almeida", empresa: "Almeida Auto Center", email: "lucas@almeidaauto.com.br", telefone: "(62) 99432-7766", plano: "Premium", valorMensalCents: 89900, contratacao: "2024-06-28", status: "ativo", siteId: "s6", proximoPagamento: "2026-07-28", avatarCor: "205 85% 55%" },
  { id: "c7", nome: "Fernanda Dias", empresa: "Studio Bloom", email: "fernanda@studiobloom.com", telefone: "(11) 97654-9988", plano: "Essencial", valorMensalCents: 19900, contratacao: "2025-06-01", status: "inativo", siteId: null, proximoPagamento: "2026-07-01", observacoes: "Cancelou após período de teste.", avatarCor: "152 60% 50%" },
  { id: "c8", nome: "Bruno Tavares", empresa: "Tavares Imóveis", email: "bruno@tavaresimoveis.com", telefone: "(85) 98321-4455", plano: "Premium", valorMensalCents: 89900, contratacao: "2024-12-19", status: "ativo", siteId: "s7", proximoPagamento: "2026-07-19", avatarCor: "32 90% 55%" },
];

export const sites: Site[] = [
  { id: "s1", nome: "Lopes Advocacia", clienteId: "c1", dominio: "lopesadvocacia.com.br", status: "ativo", criacao: "2025-01-20", plano: "Profissional", ultimaAtualizacao: "2026-06-10", link: "https://lopesadvocacia.com.br", tecnologia: "Next.js" },
  { id: "s2", nome: "FitPro Academia", clienteId: "c2", dominio: "fitpro.com", status: "ativo", criacao: "2024-11-15", plano: "Premium", ultimaAtualizacao: "2026-06-18", link: "https://fitpro.com", tecnologia: "React + Vite" },
  { id: "s3", nome: "Castro Arquitetura", clienteId: "c3", dominio: "castroarq.com.br", status: "desenvolvimento", criacao: "2025-04-02", plano: "Profissional", ultimaAtualizacao: "2026-06-22", link: "https://castroarq.com.br", tecnologia: "Next.js" },
  { id: "s4", nome: "PH Consultoria", clienteId: "c4", dominio: "phconsult.com", status: "suspenso", criacao: "2025-05-18", plano: "Essencial", ultimaAtualizacao: "2026-05-30", link: "https://phconsult.com", tecnologia: "WordPress" },
  { id: "s5", nome: "Doce Sabor", clienteId: "c5", dominio: "docesabor.com", status: "ativo", criacao: "2024-09-01", plano: "Profissional", ultimaAtualizacao: "2026-06-12", link: "https://docesabor.com", tecnologia: "React + Vite" },
  { id: "s6", nome: "Almeida Auto Center", clienteId: "c6", dominio: "almeidaauto.com.br", status: "ativo", criacao: "2024-07-10", plano: "Premium", ultimaAtualizacao: "2026-06-20", link: "https://almeidaauto.com.br", tecnologia: "Next.js" },
  { id: "s7", nome: "Tavares Imóveis", clienteId: "c8", dominio: "tavaresimoveis.com", status: "desenvolvimento", criacao: "2025-01-05", plano: "Premium", ultimaAtualizacao: "2026-06-25", link: "https://tavaresimoveis.com", tecnologia: "Next.js" },
];

export const assinaturas: Assinatura[] = [
  { id: "a1", clienteId: "c1", plano: "Profissional", valorCents: 49900, renovacao: "2026-07-12", status: "ativa", cicloMeses: 1 },
  { id: "a2", clienteId: "c2", plano: "Premium", valorCents: 89900, renovacao: "2026-07-03", status: "ativa", cicloMeses: 1 },
  { id: "a3", clienteId: "c3", plano: "Profissional", valorCents: 49900, renovacao: "2026-07-21", status: "ativa", cicloMeses: 1 },
  { id: "a4", clienteId: "c4", plano: "Essencial", valorCents: 19900, renovacao: "2026-07-09", status: "atrasada", cicloMeses: 1 },
  { id: "a5", clienteId: "c5", plano: "Profissional", valorCents: 49900, renovacao: "2026-07-15", status: "ativa", cicloMeses: 1 },
  { id: "a6", clienteId: "c6", plano: "Premium", valorCents: 89900, renovacao: "2026-07-28", status: "ativa", cicloMeses: 1 },
  { id: "a7", clienteId: "c7", plano: "Essencial", valorCents: 19900, renovacao: "2026-07-01", status: "cancelada", cicloMeses: 1 },
  { id: "a8", clienteId: "c8", plano: "Premium", valorCents: 89900, renovacao: "2026-07-19", status: "ativa", cicloMeses: 1 },
];

export const pagamentos: Pagamento[] = [
  { id: "p1", clienteId: "c1", plano: "Profissional", valorCents: 49900, data: "2026-06-12", status: "pago", metodo: "Cartão" },
  { id: "p2", clienteId: "c2", plano: "Premium", valorCents: 89900, data: "2026-06-03", status: "pago", metodo: "Pix" },
  { id: "p3", clienteId: "c3", plano: "Profissional", valorCents: 49900, data: "2026-06-21", status: "pago", metodo: "Cartão" },
  { id: "p4", clienteId: "c4", plano: "Essencial", valorCents: 19900, data: "2026-06-09", status: "atrasado", metodo: "Boleto" },
  { id: "p5", clienteId: "c5", plano: "Profissional", valorCents: 49900, data: "2026-06-15", status: "pago", metodo: "Pix" },
  { id: "p6", clienteId: "c6", plano: "Premium", valorCents: 89900, data: "2026-06-28", status: "pago", metodo: "Transferência" },
  { id: "p7", clienteId: "c8", plano: "Premium", valorCents: 89900, data: "2026-06-19", status: "pago", metodo: "Cartão" },
  { id: "p8", clienteId: "c4", plano: "Essencial", valorCents: 19900, data: "2026-07-09", status: "pendente", metodo: "Boleto" },
];

export const projetos: Projeto[] = [
  { id: "pr1", cliente: "Castro Arquitetura", clienteId: "c3", tipo: "Site institucional", responsavel: "Ana Souza", status: "desenvolvimento", prazo: "2026-07-15", progresso: 60, checklist: [{ item: "Aprovar layout", done: true }, { item: "Integrar formulário", done: true }, { item: "Otimizar SEO", done: false }, { item: "Publicar", done: false }], anotacoes: "Cliente pediu galeria de projetos com filtro." },
  { id: "pr2", cliente: "Tavares Imóveis", clienteId: "c8", tipo: "Portal de imóveis", responsavel: "Carlos Lima", status: "design", prazo: "2026-08-02", progresso: 30, checklist: [{ item: "Wireframe", done: true }, { item: "Protótipo", done: false }, { item: "Aprovação", done: false }], anotacoes: "Necessita busca avançada por bairro." },
  { id: "pr3", cliente: "FitPro Academia", clienteId: "c2", tipo: "Landing page", responsavel: "Ana Souza", status: "finalizado", prazo: "2026-06-10", progresso: 100, checklist: [{ item: "Design", done: true }, { item: "Desenvolvimento", done: true }, { item: "Publicação", done: true }], anotacoes: "Entregue e publicado." },
  { id: "pr4", cliente: "Doce Sabor", clienteId: "c5", tipo: "E-commerce", responsavel: "João Pedro", status: "revisao", prazo: "2026-07-08", progresso: 85, checklist: [{ item: "Catálogo", done: true }, { item: "Checkout", done: true }, { item: "Testes finais", done: false }], anotacoes: "Revisar integração de pagamento." },
  { id: "pr5", cliente: "Lopes Advocacia", clienteId: "c1", tipo: "Blog jurídico", responsavel: "Carlos Lima", status: "briefing", prazo: "2026-08-20", progresso: 10, checklist: [{ item: "Reunião inicial", done: true }, { item: "Definir escopo", done: false }], anotacoes: "Aguardando conteúdo do cliente." },
];

export const usuarios: UsuarioAdmin[] = [
  { id: "u1", nome: "Diego Martins", email: "diego@techdev.com", cargo: "ceo", ativo: true, ultimoAcesso: "2026-06-26" },
  { id: "u2", nome: "Ana Souza", email: "ana@techdev.com", cargo: "administrador", ativo: true, ultimoAcesso: "2026-06-25" },
  { id: "u3", nome: "Carlos Lima", email: "carlos@techdev.com", cargo: "funcionario", ativo: true, ultimoAcesso: "2026-06-26" },
  { id: "u4", nome: "João Pedro", email: "joao@techdev.com", cargo: "funcionario", ativo: true, ultimoAcesso: "2026-06-24" },
  { id: "u5", nome: "Beatriz Nunes", email: "beatriz@techdev.com", cargo: "administrador", ativo: false, ultimoAcesso: "2026-05-30" },
];

export const notificacoes: Notificacao[] = [
  { id: "n1", titulo: "Pagamento recebido", descricao: "Almeida Auto Center pagou R$ 899,00", tempo: "há 2 horas", lida: false, tipo: "pagamento" },
  { id: "n2", titulo: "Pagamento atrasado", descricao: "PH Consultoria está com fatura em atraso", tempo: "há 5 horas", lida: false, tipo: "pagamento" },
  { id: "n3", titulo: "Novo cliente", descricao: "Camila Ribeiro contratou o plano Profissional", tempo: "ontem", lida: false, tipo: "cliente" },
  { id: "n4", titulo: "Site publicado", descricao: "FitPro Academia foi ao ar", tempo: "há 2 dias", lida: true, tipo: "site" },
  { id: "n5", titulo: "Backup concluído", descricao: "Backup automático realizado com sucesso", tempo: "há 3 dias", lida: true, tipo: "sistema" },
];

export const logs: LogEntry[] = [
  { id: "l1", usuario: "Diego Martins", acao: "Editou plano", alvo: "Plano Premium", data: "2026-06-26T14:30:00" },
  { id: "l2", usuario: "Ana Souza", acao: "Adicionou cliente", alvo: "Camila Ribeiro", data: "2026-06-25T11:10:00" },
  { id: "l3", usuario: "Carlos Lima", acao: "Atualizou projeto", alvo: "Tavares Imóveis", data: "2026-06-25T09:45:00" },
  { id: "l4", usuario: "Diego Martins", acao: "Cancelou assinatura", alvo: "Studio Bloom", data: "2026-06-24T16:20:00" },
  { id: "l5", usuario: "João Pedro", acao: "Publicou site", alvo: "FitPro Academia", data: "2026-06-23T18:05:00" },
];

// Séries para gráficos do dashboard
export const faturamentoMensal = [
  { mes: "Jan", valor: 38900 },
  { mes: "Fev", valor: 42700 },
  { mes: "Mar", valor: 47600 },
  { mes: "Abr", valor: 51200 },
  { mes: "Mai", valor: 55800 },
  { mes: "Jun", valor: 61900 },
];

export const crescimentoClientes = [
  { mes: "Jan", clientes: 18 },
  { mes: "Fev", clientes: 22 },
  { mes: "Mar", clientes: 27 },
  { mes: "Abr", clientes: 31 },
  { mes: "Mai", clientes: 36 },
  { mes: "Jun", clientes: 42 },
];

export const distribuicaoPlanos = [
  { plano: "Essencial", quantidade: 12, cor: "152 60% 50%" },
  { plano: "Profissional", quantidade: 18, cor: "205 85% 55%" },
  { plano: "Premium", quantidade: 12, cor: "32 90% 55%" },
];

export const statusProjetos = [
  { status: "Briefing", quantidade: 3 },
  { status: "Design", quantidade: 4 },
  { status: "Desenvolvimento", quantidade: 5 },
  { status: "Revisão", quantidade: 2 },
  { status: "Finalizado", quantidade: 9 },
];

export const cancelamentosMensais = [
  { mes: "Jan", cancelamentos: 2 },
  { mes: "Fev", cancelamentos: 1 },
  { mes: "Mar", cancelamentos: 3 },
  { mes: "Abr", cancelamentos: 1 },
  { mes: "Mai", cancelamentos: 2 },
  { mes: "Jun", cancelamentos: 1 },
];

export const clienteById = (id: string | null) => clientes.find((c) => c.id === id);
export const siteById = (id: string | null) => sites.find((s) => s.id === id);
