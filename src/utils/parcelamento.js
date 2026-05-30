import { randomUUID } from 'crypto';

/**
 * Divide valor total em N parcelas (centavos) com arredondamento correto.
 * Ex.: R$ 1000 / 3 → [333.34, 333.33, 333.33]
 */
export function calcularValoresParcelas(valorTotal, totalParcelas) {
  const total = parseFloat(valorTotal);
  const n = parseInt(totalParcelas, 10);

  if (Number.isNaN(total) || total <= 0 || Number.isNaN(n) || n < 1) {
    throw new Error('Valor ou quantidade de parcelas inválidos.');
  }

  const totalCents = Math.round(total * 100);
  const baseCents = Math.floor(totalCents / n);
  const remainder = totalCents - baseCents * n;

  return Array.from({ length: n }, (_, i) => {
    const cents = baseCents + (i < remainder ? 1 : 0);
    return cents / 100;
  });
}

/** YYYY-MM-DD → adiciona meses preservando dia (ajusta fim de mês). */
export function adicionarMesesISO(dataISO, meses) {
  const [anoStr, mesStr, diaStr] = String(dataISO).split('-');
  const ano = parseInt(anoStr, 10);
  const mes = parseInt(mesStr, 10);
  const dia = parseInt(diaStr, 10);

  let mesIndex = mes - 1 + meses;
  let anoFinal = ano + Math.floor(mesIndex / 12);
  mesIndex = ((mesIndex % 12) + 12) % 12;

  const ultimoDia = new Date(anoFinal, mesIndex + 1, 0).getDate();
  const diaFinal = Math.min(dia, ultimoDia);

  return `${anoFinal}-${String(mesIndex + 1).padStart(2, '0')}-${String(diaFinal).padStart(2, '0')}`;
}

export function formatarNomeParcela(nomeBase, parcelaAtual, totalParcelas) {
  const base = String(nomeBase || '').trim();
  return `${base} ${parcelaAtual}/${totalParcelas}`;
}

export function extrairNomeBase(nome) {
  return String(nome || '').replace(/\s+\d+\/\d+$/, '').trim();
}

/**
 * Gera definições das parcelas para INSERT.
 * @param {object} params
 * @returns {Array<{nome, dataFormatada, valor, parcelaAtual, totalParcelas, grupoParcelamento}>}
 */
export function gerarDefinicoesParcelas({
  nome,
  valorTotal,
  totalParcelas,
  dataFormatada,
  grupoParcelamento = randomUUID(),
}) {
  const n = parseInt(totalParcelas, 10);
  if (Number.isNaN(n) || n < 1 || n > 36) {
    throw new Error('Quantidade de parcelas deve estar entre 1 e 36.');
  }

  const nomeBase = extrairNomeBase(nome);
  const valores = calcularValoresParcelas(valorTotal, n);

  return valores.map((valor, index) => {
    const parcelaAtual = index + 1;
    return {
      nome: formatarNomeParcela(nomeBase, parcelaAtual, n),
      dataFormatada: adicionarMesesISO(dataFormatada, index),
      valor,
      parcelaAtual,
      totalParcelas: n,
      grupoParcelamento,
    };
  });
}

/** Recalcula vencimentos a partir da parcela editada como âncora. */
export function recalcularVencimentosGrupo({
  dataFormatadaAnchor,
  parcelaAtualAnchor,
  parcelaAtual,
  totalParcelas,
}) {
  const offset = parcelaAtual - parcelaAtualAnchor;
  return adicionarMesesISO(dataFormatadaAnchor, offset);
}
