/**
 * Testes de regras de cartão débito.
 * Executar: node scripts/debito-cartao.test.js
 */
import { isCartaoDebito } from '../src/utils/tipoCartao.js';
import { montarResumoCartao } from '../src/utils/dashboardCartao.js';
import { aplicarRegrasContaPorCartao, validarModosCreditoDebito } from '../src/utils/contaDebito.js';

let passou = 0;
let falhou = 0;

function assert(condicao, msg) {
  if (condicao) {
    passou += 1;
    console.log(`  ✓ ${msg}`);
  } else {
    falhou += 1;
    console.error(`  ✗ ${msg}`);
  }
}

const cartaoDebito = { id: 2, nome: 'PicPay', tipo_cartao: 'debito', banco_slug: 'picpay' };
const cartaoCredito = {
  id: 1,
  nome: 'Nubank',
  tipo_cartao: 'credito',
  vencimento: 15,
  dia_util: 7,
  limite_credito: 5000,
};

console.log('\n--- Tipo débito ---');
assert(isCartaoDebito(cartaoDebito), 'identifica débito');
assert(!isCartaoDebito(cartaoCredito), 'crédito não é débito');

console.log('\n--- Bloqueio parcelamento ---');
assert(
  validarModosCreditoDebito(true, { parcelado: true, recorrente: false }) !== null,
  'bloqueia parcelamento'
);

console.log('\n--- Dashboard débito ---');
{
  const hoje = new Date();
  const dia = String(hoje.getDate()).padStart(2, '0');
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const ano = hoje.getFullYear();
  const venc = `${dia}/${mes}/${ano}`;

  const contasMes = [
    { id: 1, tipo_cartao_id: 2, valor: 250, paga: true, vencimento: venc },
    { id: 2, tipo_cartao_id: 2, valor: 50, paga: true, vencimento: venc },
  ];

  const resumo = montarResumoCartao(cartaoDebito, [], contasMes, hoje);
  assert(resumo.ehDebito === true, 'flag ehDebito');
  assert(resumo.gastosNoMes === 300, 'gastos no mês');
  assert(resumo.proximoVencimento === null, 'sem vencimento futuro');
  assert(resumo.faturaAtual === 0, 'sem fatura');
}

console.log('\n--- Dashboard crédito inalterado ---');
{
  const ref = new Date(2026, 4, 31);
  const contasPendentes = [
    { id: 10, tipo_cartao_id: 1, valor: 500, paga: false, vencimento: '15/06/2026' },
  ];
  const resumo = montarResumoCartao(cartaoCredito, contasPendentes, [], ref);
  assert(resumo.ehDebito === false, 'crédito mantém modo fatura');
  assert(resumo.faturaAtual === 500, 'fatura atual crédito');
}

console.log(`\nResultado: ${passou} ok, ${falhou} falhas\n`);
process.exit(falhou > 0 ? 1 : 0);
