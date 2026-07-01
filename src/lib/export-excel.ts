import * as XLSX from "xlsx";
import {
  clientes as clientesSeed,
  sites,
  fmtData,
} from "./mock-data";
import { clientesStore } from "./clientes-store";
import { financasStore, clienteInfoByUserId, receitaPagaCents, mrrCents } from "./financas-store";

const reais = (cents: number) => Number((cents / 100).toFixed(2));

// Gera o arquivo Excel (.xlsx) com 5 abas: Clientes, Faturamento, Assinaturas, Sites e Relatórios.
export const exportarOperacoes = () => {
  const clientes = clientesStore.getSnapshot() ?? clientesSeed;
  const { pagamentos, assinaturas } = financasStore.getSnapshot();

  const abaClientes = clientes.map((c) => ({
    Nome: c.nome,
    Empresa: c.empresa,
    Email: c.email,
    Telefone: c.telefone,
    Plano: c.plano,
    "Valor mensal (R$)": reais(c.valorMensalCents),
    Contratação: fmtData(c.contratacao),
    Status: c.status,
    "Próximo pagamento": fmtData(c.proximoPagamento),
  }));

  const abaFaturamento = pagamentos.map((p) => ({
    Cliente: clienteInfoByUserId(p.clienteId)?.full_name ?? "—",
    Empresa: clienteInfoByUserId(p.clienteId)?.company ?? "—",
    Plano: p.plano,
    "Valor (R$)": reais(p.valorCents),
    "Data pagamento": fmtData(p.data),
    Status: p.status,
    Método: p.metodo,
  }));

  const abaAssinaturas = assinaturas.map((a) => ({
    Cliente: clienteInfoByUserId(a.clienteId)?.full_name ?? "—",
    Empresa: clienteInfoByUserId(a.clienteId)?.company ?? "—",
    Plano: a.plano,
    "Valor (R$)": reais(a.valorCents),
    "Ciclo (meses)": a.cicloMeses,
    Renovação: fmtData(a.renovacao),
    Status: a.status,
  }));

  const abaSites = sites.map((s) => ({
    Site: s.nome,
    Cliente: clienteById(s.clienteId)?.empresa ?? "—",
    Domínio: s.dominio,
    Status: s.status,
    Plano: s.plano,
    Tecnologia: s.tecnologia,
    Criação: fmtData(s.criacao),
    "Última atualização": fmtData(s.ultimaAtualizacao),
    Link: s.link,
  }));

  const receitaTotal = reais(receitaPagaCents(pagamentos));
  const mrr = reais(mrrCents(assinaturas));
  const abaRelatorios = [
    { Indicador: "Total de clientes", Valor: clientes.length },
    { Indicador: "Clientes ativos", Valor: clientes.filter((c) => c.status === "ativo").length },
    { Indicador: "Sites publicados", Valor: sites.filter((s) => s.status === "ativo").length },
    { Indicador: "Assinaturas ativas", Valor: assinaturas.filter((a) => a.status === "ativa").length },
    { Indicador: "Receita total (R$)", Valor: receitaTotal },
    { Indicador: "MRR (R$)", Valor: mrr },
    { Indicador: "Receita anual estimada (R$)", Valor: Number((mrr * 12).toFixed(2)) },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(abaClientes), "Clientes");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(abaFaturamento), "Faturamento");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(abaAssinaturas), "Assinaturas");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(abaSites), "Sites ativos");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(abaRelatorios), "Relatórios");

  const data = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `TechDev-operacoes-${data}.xlsx`);
};
