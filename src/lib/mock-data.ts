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

// Dados iniciais ZERADOS. O site está no ar e começa sem nenhum registro:
// as listas só serão preenchidas conforme clientes/sites/pagamentos reais forem
// criados. Mantemos os tipos e helpers para a interface continuar funcionando.
export const clientes: Cliente[] = [];

export const sites: Site[] = [];

export const assinaturas: Assinatura[] = [];

export const pagamentos: Pagamento[] = [];

export const projetos: Projeto[] = [];

export const usuarios: UsuarioAdmin[] = [];

export const notificacoes: Notificacao[] = [];

export const logs: LogEntry[] = [];

// Séries para gráficos do dashboard — iniciam vazias (sem histórico fictício).
export const faturamentoMensal: { mes: string; valor: number }[] = [];

export const crescimentoClientes: { mes: string; clientes: number }[] = [];

export const distribuicaoPlanos: { plano: string; quantidade: number; cor: string }[] = [];

export const statusProjetos: { status: string; quantidade: number }[] = [];

export const cancelamentosMensais: { mes: string; cancelamentos: number }[] = [];

export const clienteById = (id: string | null) => clientes.find((c) => c.id === id);
export const siteById = (id: string | null) => sites.find((s) => s.id === id);
