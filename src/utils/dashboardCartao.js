/**
 * Agregação do dashboard de cartões (espelho do mobile).
 * @see ../../../src/utils/dashboardCartao.js
 */
import {
  calcularProximoFechamentoContaCartaoISO,
  calcularVencimentoContaCartaoISO,
  extrairMesAnoCompetenciaISO,
} from './competenciaCartao.js';
import { enriquecerCartaoComBanco, resolverBancoParaCartao } from './bancos.js';
import { isCartaoDebito } from './tipoCartao.js';

function formatarDataISO(date) {
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const ano = date.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

function normalizarCartaoId(conta) {
  return String(conta?.tipo_cartao_id ?? conta?.tipo_cartao ?? '');
}

function parseValor(valor) {
  const n = parseFloat(valor);
  return Number.isNaN(n) ? 0 : n;
}

function normalizarApelido(texto) {
  return String(texto || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function filtrarContasMesCartao(contas, cartaoId, dataReferencia) {
  const ref = dataReferencia instanceof Date ? dataReferencia : new Date(dataReferencia);
  const mesIndex = ref.getMonth();
  const ano = ref.getFullYear();

  return (contas || []).filter((conta) => {
    if (normalizarCartaoId(conta) !== cartaoId) {
      return false;
    }
    const competencia = extrairMesAnoCompetenciaISO(conta.vencimento);
    return competencia && competencia.mesIndex0 === mesIndex && competencia.ano === ano;
  });
}

export function classificarUtilizacao(percentual) {
  if (percentual == null || Number.isNaN(percentual)) {
    return 'sem_limite';
  }
  if (percentual >= 80) {
    return 'critico';
  }
  if (percentual >= 50) {
    return 'atencao';
  }
  return 'normal';
}

function labelTipoCartao(tipo) {
  const chave = String(tipo || '').trim().toLowerCase();
  if (chave === 'credito') return 'Crédito';
  if (chave === 'debito') return 'Débito';
  return chave ? chave.charAt(0).toUpperCase() + chave.slice(1) : '';
}

export function montarResumoCartao(
  cartao,
  contasPendentes = [],
  contasMes = [],
  dataReferencia = new Date()
) {
  const cartaoId = String(cartao?.id ?? '');
  const tipo = String(cartao?.tipo_cartao || '').toLowerCase();
  const ehDebito = isCartaoDebito(cartao);
  const bancoInfo = enriquecerCartaoComBanco(cartao);
  const banco = resolverBancoParaCartao(cartao);

  if (ehDebito) {
    const contasDebitoMes = filtrarContasMesCartao(contasMes, cartaoId, dataReferencia).filter(
      (c) => c.paga
    );
    const gastosNoMes = contasDebitoMes.reduce((sum, conta) => sum + parseValor(conta.valor), 0);

    return {
      id: cartao.id,
      nome: cartao.nome || 'Sem nome',
      nomeExibicao: banco?.nome || cartao.nome || 'Sem nome',
      apelido:
        banco && cartao.nome && normalizarApelido(cartao.nome) !== normalizarApelido(banco.nome)
          ? cartao.nome
          : null,
      ...bancoInfo,
      tipo,
      tipoLabel: labelTipoCartao(tipo),
      ehDebito: true,
      gastosNoMes,
      qtdLancamentos: contasDebitoMes.length,
      contasFatura: contasDebitoMes.map((conta) => ({
        id: conta.id,
        nome: conta.nome,
        valor: parseValor(conta.valor),
        vencimento: conta.vencimento,
        parcela_atual: conta.parcela_atual,
        total_parcelas: conta.total_parcelas,
        recorrencia_atual: conta.recorrencia_atual,
        total_recorrencias: conta.total_recorrencias,
      })),
      limite: 0,
      utilizado: 0,
      disponivel: null,
      faturaAtual: 0,
      proximoVencimento: null,
      proximoFechamento: null,
      percentualUtilizado: null,
      faixaUtilizacao: 'sem_limite',
    };
  }

  const contasCartao = (contasPendentes || []).filter(
    (conta) => !conta.paga && normalizarCartaoId(conta) === cartaoId
  );

  const limite = parseValor(cartao?.limite_credito);
  const utilizado = contasCartao.reduce((sum, conta) => sum + parseValor(conta.valor), 0);
  const disponivel = limite > 0 ? Math.max(0, limite - utilizado) : null;
  const percentualUtilizado =
    limite > 0 ? Math.min(100, Math.round((utilizado / limite) * 1000) / 10) : null;

  const vencISO = calcularVencimentoContaCartaoISO(cartao, dataReferencia);
  const fechISO = calcularProximoFechamentoContaCartaoISO(cartao, dataReferencia);
  const proximoVencimento = vencISO ? formatarDataISO(new Date(vencISO + 'T12:00:00')) : null;
  const proximoFechamento = fechISO ? formatarDataISO(new Date(fechISO + 'T12:00:00')) : null;

  let contasFatura = [];
  if (proximoVencimento) {
    contasFatura = contasCartao.filter((conta) => conta.vencimento === proximoVencimento);
  }

  const faturaAtual = contasFatura.reduce((sum, conta) => sum + parseValor(conta.valor), 0);

  return {
    id: cartao.id,
    nome: cartao.nome || 'Sem nome',
    nomeExibicao: banco?.nome || cartao.nome || 'Sem nome',
    apelido:
      banco && cartao.nome && normalizarApelido(cartao.nome) !== normalizarApelido(banco.nome)
        ? cartao.nome
        : null,
    ...bancoInfo,
    tipo,
    tipoLabel: labelTipoCartao(tipo),
    ehDebito: false,
    gastosNoMes: null,
    limite,
    utilizado,
    disponivel,
    faturaAtual,
    proximoVencimento,
    proximoFechamento,
    qtdLancamentos: contasFatura.length,
    percentualUtilizado,
    faixaUtilizacao: classificarUtilizacao(percentualUtilizado),
    contasFatura: contasFatura.map((conta) => ({
      id: conta.id,
      nome: conta.nome,
      valor: parseValor(conta.valor),
      vencimento: conta.vencimento,
      parcela_atual: conta.parcela_atual,
      total_parcelas: conta.total_parcelas,
      recorrencia_atual: conta.recorrencia_atual,
      total_recorrencias: conta.total_recorrencias,
    })),
  };
}

export function montarDashboardCartoes(
  cartoes = [],
  contasPendentes = [],
  contasMes = [],
  dataReferencia = new Date()
) {
  return (cartoes || []).map((cartao) =>
    montarResumoCartao(cartao, contasPendentes, contasMes, dataReferencia)
  );
}
