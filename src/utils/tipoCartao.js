/**
 * @see ../../../src/utils/tipoCartao.js
 */
export function isCartaoDebito(cartao) {
  return String(cartao?.tipo_cartao || '').toLowerCase() === 'debito';
}

export function isCartaoCredito(cartao) {
  const tipo = String(cartao?.tipo_cartao || '').toLowerCase();
  return tipo === 'credito' || tipo === '';
}

export function dataAtualFormatadaBR() {
  const data = new Date();
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
}
