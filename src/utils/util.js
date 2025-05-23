// src/utils/util.js

/**
 * Formata um valor para o padrão brasileiro de moeda (BRL).
 * @param {number|string} valor - Valor a ser formatado.
 * @returns {Promise<string>} Valor formatado em BRL.
 */
export async function formatarParaBRL(valor) {
  const numero = Number(valor);
  console.log(`---------------------------${isNaN(numero)} ${numero}`);
  if (isNaN(numero)) {
    console.warn(`Valor inválido para formatar:`, valor);
    return 'R$ 0,00';
  }
  console.log(`Valor formatado: ${numero}`);
  return numero.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

/**
 * Retorna a data atual formatada como DD/MM/YYYY.
 * @returns {string} Data atual formatada.
 */
export function dataAtualFormatada() {
  const data = new Date();
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

/**
 * Formata uma data no formato BR (DD/MM/YYYY).
 * @param {string|Date} dta - Data a ser formatada.
 * @returns {string} Data formatada.
 */
export function formatDataBR(dta) {
  const date = new Date(dta);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Converte uma string de data no formato DD/MM/YYYY para YYYY-MM-DD.
 * @param {string} valor - Data no formato DD/MM/YYYY.
 * @returns {string} Data no formato ISO (YYYY-MM-DD).
 */
export function converterParaFormatoDate(valor) {
  if (!valor || typeof valor !== 'string') return '';
  const [dia, mes, ano] = valor.split('/');
  return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
}
