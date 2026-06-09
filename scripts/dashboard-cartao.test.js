/**
 * Testes do dashboard de cartões.
 * Executar: node scripts/dashboard-cartao.test.js
 */
import {
  montarResumoCartao,
  classificarUtilizacao,
} from '../src/utils/dashboardCartao.js';

function parseDataReferenciaBR(dataBR) {
  const match = String(dataBR || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) {
    return new Date();
  }
  return new Date(parseInt(match[3], 10), parseInt(match[2], 10) - 1, parseInt(match[1], 10));
}

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

const cartaoCredito = {
  id: 1,
  nome: 'Nubank',
  tipo_cartao: 'credito',
  vencimento: 15,
  dia_util: 7,
  limite_credito: 5000,
};

const ref31Maio = parseDataReferenciaBR('31/05/2026');

console.log('\n--- Cartão sem movimentação ---');
{
  const resumo = montarResumoCartao(cartaoCredito, [], [], ref31Maio);
  assert(resumo.utilizado === 0, 'utilizado zero');
  assert(resumo.faturaAtual === 0, 'fatura zero');
  assert(resumo.qtdLancamentos === 0, 'sem lançamentos');
  assert(resumo.proximoVencimento === '15/06/2026', 'próximo vencimento 15/06');
  assert(resumo.proximoFechamento === '07/06/2026', 'próximo fechamento 07/06');
  assert(resumo.disponivel === 5000, 'disponível = limite');
}

console.log('\n--- Compras simples na fatura ---');
{
  const contas = [
    { id: 1, tipo_cartao_id: 1, valor: 500, paga: false, vencimento: '15/06/2026' },
    { id: 2, tipo_cartao_id: 1, valor: 850, paga: false, vencimento: '15/06/2026' },
    { id: 3, tipo_cartao_id: 1, valor: 200, paga: false, vencimento: '15/07/2026' },
  ];
  const resumo = montarResumoCartao(cartaoCredito, contas, [], ref31Maio);
  assert(resumo.faturaAtual === 1350, 'fatura atual 1350');
  assert(resumo.utilizado === 1550, 'utilizado total 1550');
  assert(resumo.qtdLancamentos === 2, '2 lançamentos na fatura');
  assert(resumo.disponivel === 3450, 'disponível 3450');
  assert(resumo.percentualUtilizado === 31, '31% utilizado');
  assert(classificarUtilizacao(resumo.percentualUtilizado) === 'normal', 'faixa normal');
}

console.log('\n--- Parcelamento ---');
{
  const contas = [
    {
      id: 10,
      tipo_cartao_id: 1,
      valor: 100,
      paga: false,
      vencimento: '15/06/2026',
      parcela_atual: 2,
      total_parcelas: 6,
    },
  ];
  const resumo = montarResumoCartao(cartaoCredito, contas, [], ref31Maio);
  assert(resumo.faturaAtual === 100, 'parcela entra na fatura');
  assert(resumo.qtdLancamentos === 1, '1 parcela no ciclo');
}

console.log('\n--- Recorrência ---');
{
  const contas = [
    {
      id: 20,
      tipo_cartao_id: 1,
      valor: 89.9,
      paga: false,
      vencimento: '15/06/2026',
      recorrencia_atual: 3,
      total_recorrencias: 12,
    },
  ];
  const resumo = montarResumoCartao(cartaoCredito, contas, [], ref31Maio);
  assert(resumo.faturaAtual === 89.9, 'recorrência na fatura');
}

console.log('\n--- Cartão acima de 80% ---');
{
  const contas = [
    { id: 30, tipo_cartao_id: 1, valor: 4200, paga: false, vencimento: '15/06/2026' },
  ];
  const resumo = montarResumoCartao(cartaoCredito, contas, [], ref31Maio);
  assert(resumo.percentualUtilizado === 84, '84% utilizado');
  assert(classificarUtilizacao(resumo.percentualUtilizado) === 'critico', 'faixa crítica');
}

console.log('\n--- Virada de ano ---');
{
  const ref31Dez = parseDataReferenciaBR('31/12/2026');
  const resumo = montarResumoCartao(cartaoCredito, [], [], ref31Dez);
  assert(resumo.proximoFechamento === '07/01/2027', 'fechamento jan/2027');
  assert(resumo.proximoVencimento === '15/01/2027', 'vencimento jan/2027');
}

console.log(`\nResultado: ${passou} ok, ${falhou} falhas\n`);
process.exit(falhou > 0 ? 1 : 0);
