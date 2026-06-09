/**
 * Regras de lançamento para cartão de débito (valor já debitado da conta).
 */
import * as model_config from '../database/models/query_config.js';
import { converterParaFormatoDate, dataAtualFormatada } from './util.js';
import { isCartaoDebito } from './tipoCartao.js';

export async function obterCartaoDaConta(tipoCartaoId) {
  if (!tipoCartaoId) {
    return null;
  }
  return model_config.selectId(tipoCartaoId);
}

/**
 * Ajusta conta antes de insert: débito nasce pago, data = hoje (compra imediata).
 */
export async function aplicarRegrasContaPorCartao(contaBase) {
  const cartao = await obterCartaoDaConta(contaBase.tipo_cartao);

  if (!cartao || !isCartaoDebito(cartao)) {
    return {
      conta: { ...contaBase, paga: false },
      cartao,
      ehDebito: false,
    };
  }

  const dataBR = dataAtualFormatada();
  const dataFormatada = converterParaFormatoDate(dataBR);

  return {
    conta: {
      ...contaBase,
      paga: true,
      dataFormatada,
      dataLancamentoFormatada: dataFormatada,
    },
    cartao,
    ehDebito: true,
  };
}

export function validarModosCreditoDebito(ehDebito, { parcelado, recorrente }) {
  if (ehDebito && (parcelado || recorrente)) {
    return 'Parcelamento e recorrência estão disponíveis apenas para cartão de crédito.';
  }
  return null;
}
