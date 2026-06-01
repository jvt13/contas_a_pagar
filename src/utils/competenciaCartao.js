/**
 * Regras de competência para cartão de crédito (espelho do mobile).
 * @see ../../../src/utils/competenciaCartao.js
 */

function parseDia(value) {
  const dia = parseInt(String(value), 10);
  if (Number.isNaN(dia) || dia < 1 || dia > 31) {
    return null;
  }
  return dia;
}

function dataLocal(ano, mesIndex0, dia) {
  const ultimoDia = new Date(ano, mesIndex0 + 1, 0).getDate();
  const diaAjustado = Math.min(dia, ultimoDia);
  const date = new Date(ano, mesIndex0, diaAjustado);
  if (
    date.getFullYear() !== ano ||
    date.getMonth() !== mesIndex0 ||
    date.getDate() !== diaAjustado
  ) {
    return null;
  }
  return date;
}

function inicioDoDia(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function avancarMes(ano, mesIndex0) {
  let mes = mesIndex0 + 1;
  let year = ano;
  if (mes > 11) {
    mes = 0;
    year += 1;
  }
  return { ano: year, mesIndex0: mes };
}

function calcularVencimentoSomenteDiaPagamento(diaVencimento, dataReferencia) {
  const ref = inicioDoDia(dataReferencia);
  let ano = ref.getFullYear();
  let mesIndex = ref.getMonth();

  let vencimentoAtual = dataLocal(ano, mesIndex, diaVencimento);
  if (!vencimentoAtual) {
    return null;
  }

  if (ref > inicioDoDia(vencimentoAtual)) {
    const next = avancarMes(ano, mesIndex);
    ano = next.ano;
    mesIndex = next.mesIndex0;
    vencimentoAtual = dataLocal(ano, mesIndex, diaVencimento);
  }

  return vencimentoAtual;
}

export function calcularProximoFechamentoContaCartaoDate(cartao, dataReferencia = new Date()) {
  const diaFechamento = parseDia(cartao?.dia_util);
  if (!diaFechamento) {
    return null;
  }

  const ref = inicioDoDia(dataReferencia);
  let anoFechamento = ref.getFullYear();
  let mesFechamentoIndex = ref.getMonth();
  let fechamento = dataLocal(anoFechamento, mesFechamentoIndex, diaFechamento);

  if (!fechamento) {
    return null;
  }

  if (ref > inicioDoDia(fechamento)) {
    const next = avancarMes(anoFechamento, mesFechamentoIndex);
    anoFechamento = next.ano;
    mesFechamentoIndex = next.mesIndex0;
    fechamento = dataLocal(anoFechamento, mesFechamentoIndex, diaFechamento);
  }

  return fechamento;
}

export function calcularProximoFechamentoContaCartaoISO(cartao, dataReferencia = new Date()) {
  const date = calcularProximoFechamentoContaCartaoDate(cartao, dataReferencia);
  if (!date) {
    return null;
  }
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const ano = date.getFullYear();
  return `${ano}-${mes}-${dia}`;
}

export function calcularVencimentoContaCartaoDate(cartao, dataReferencia = new Date()) {
  const diaVencimento = parseDia(cartao?.vencimento);
  const diaFechamento = parseDia(cartao?.dia_util);

  if (!diaVencimento) {
    return null;
  }

  const ref = inicioDoDia(dataReferencia);

  if (!diaFechamento) {
    return calcularVencimentoSomenteDiaPagamento(diaVencimento, ref);
  }

  const fechamento = calcularProximoFechamentoContaCartaoDate(cartao, ref);
  if (!fechamento) {
    return null;
  }

  const anoFechamento = fechamento.getFullYear();
  const mesFechamentoIndex = fechamento.getMonth();

  const pagamento =
    diaVencimento > diaFechamento
      ? { ano: anoFechamento, mesIndex0: mesFechamentoIndex }
      : avancarMes(anoFechamento, mesFechamentoIndex);

  return dataLocal(pagamento.ano, pagamento.mesIndex0, diaVencimento);
}

export function calcularVencimentoContaCartaoISO(cartao, dataReferencia = new Date()) {
  const date = calcularVencimentoContaCartaoDate(cartao, dataReferencia);
  if (!date) {
    return null;
  }
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const ano = date.getFullYear();
  return `${ano}-${mes}-${dia}`;
}

export function calcularVencimentoPorCartao(cartao, { dataReferencia = new Date() } = {}) {
  if (!cartao) {
    return null;
  }

  const tipo = String(cartao.tipo_cartao || '').toLowerCase();
  if (tipo === 'credito') {
    return calcularVencimentoContaCartaoISO(cartao, dataReferencia);
  }

  return null;
}

export function calcularVencimentoContaDebitoISO(diaVencimento, mesIndex0, ano, dataReferencia = new Date()) {
  const dia = parseDia(diaVencimento);
  const mesIndex = parseInt(String(mesIndex0), 10);
  const year = parseInt(String(ano), 10);

  if (dia === null || Number.isNaN(mesIndex) || Number.isNaN(year)) {
    return null;
  }

  const date = dataLocal(year, mesIndex, dia);
  if (!date) {
    return null;
  }

  const ref = inicioDoDia(dataReferencia);
  let target = date;
  if (ref > inicioDoDia(date)) {
    const next = avancarMes(year, mesIndex);
    target = dataLocal(next.ano, next.mesIndex0, dia);
  }

  if (!target) {
    return null;
  }

  const d = String(target.getDate()).padStart(2, '0');
  const m = String(target.getMonth() + 1).padStart(2, '0');
  const y = target.getFullYear();
  return `${y}-${m}-${d}`;
}

export function extrairMesAnoCompetenciaISO(dataBR) {
  const match = String(dataBR || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) {
    return null;
  }

  return {
    mesIndex0: parseInt(match[2], 10) - 1,
    ano: parseInt(match[3], 10),
  };
}
