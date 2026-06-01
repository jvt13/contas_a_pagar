/**
 * Testes de competência de cartão de crédito.
 * node src/utils/competenciaCartao.test.js  (mobile)
 * node api-contas-a-pagar/scripts/competencia-cartao.test.js
 */
import {
  calcularVencimentoContaCartao,
  parseDataReferenciaBR,
} from '../../src/utils/competenciaCartao.js';

const CARTAO_ITAU = { vencimento: 1, dia_util: 22, tipo_cartao: 'credito' };
const CARTAO_FECH7_VENC15 = { vencimento: 15, dia_util: 7, tipo_cartao: 'credito' };

let ok = 0;
let fail = 0;

function test(name, hoje, esperado, cartao = CARTAO_ITAU) {
  const result = calcularVencimentoContaCartao(cartao, parseDataReferenciaBR(hoje));
  if (result === esperado) {
    ok++;
    console.log(`✓ ${name}: ${result}`);
  } else {
    fail++;
    console.error(`✗ ${name}: esperado ${esperado}, obtido ${result}`);
  }
}

console.log('\n=== Itaú fechamento 22 / vencimento 01 ===\n');

test('Exemplo 1 — antes do fechamento', '03/05/2026', '01/06/2026');
test('Exemplo 2 — após fechamento (caso real)', '29/05/2026', '01/07/2026');
test('Exemplo 3 — dezembro antes fechamento', '15/12/2026', '01/01/2027');
test('Exemplo 4 — dezembro após fechamento', '29/12/2026', '01/02/2027');

console.log('\n=== Edge cases ===\n');

test('No dia do fechamento (incluso na fatura corrente)', '22/05/2026', '01/06/2026');
test('Dia após fechamento', '23/05/2026', '01/07/2026');
test('Janeiro após fechamento dez', '29/01/2027', '01/03/2027');

console.log('\n=== Cenários solicitados (fechamento 07 / vencimento 15) ===\n');
test('Cenário A', '31/05/2026', '15/06/2026', CARTAO_FECH7_VENC15);
test('Cenário B', '08/06/2026', '15/07/2026', CARTAO_FECH7_VENC15);
test('Cenário C', '20/12/2026', '15/01/2027', CARTAO_FECH7_VENC15);
test('Cenário D', '08/01/2027', '15/02/2027', CARTAO_FECH7_VENC15);

const cartaoFech25Venc5 = { vencimento: 5, dia_util: 25, tipo_cartao: 'credito' };
const r1 = calcularVencimentoContaCartao(cartaoFech25Venc5, parseDataReferenciaBR('20/05/2026'));
const r2 = calcularVencimentoContaCartao(cartaoFech25Venc5, parseDataReferenciaBR('29/05/2026'));
if (r1 === '05/06/2026' && r2 === '05/07/2026') {
  ok += 2;
  console.log('✓ Fechamento 25 / vencimento 05 — antes e depois');
} else {
  fail += 2;
  console.error('✗ Fechamento 25 / vencimento 05:', r1, r2);
}

const cartaoSemFech = { vencimento: 1, dia_util: '', tipo_cartao: 'credito' };
const rFallback = calcularVencimentoContaCartao(cartaoSemFech, parseDataReferenciaBR('29/05/2026'));
if (rFallback === '01/06/2026') {
  ok++;
  console.log('✓ Fallback sem fechamento:', rFallback);
} else {
  fail++;
  console.error('✗ Fallback sem fechamento:', rFallback);
}

const cartaoFev = { vencimento: 31, dia_util: 15, tipo_cartao: 'credito' };
const rFev = calcularVencimentoContaCartao(cartaoFev, parseDataReferenciaBR('10/01/2028'));
if (rFev === '31/01/2028') {
  ok++;
  console.log('✓ Vencimento > fechamento permanece no mesmo mês da fatura:', rFev);
} else {
  fail++;
  console.error('✗ Bissexto:', rFev);
}

console.log(`\nResultado: ${ok} ok, ${fail} falhou\n`);
process.exit(fail > 0 ? 1 : 0);
