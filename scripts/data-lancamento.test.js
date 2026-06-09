/**
 * Testes de separação data_lancamento (Home) vs vencimento (Contas a Pagar).
 * Executar: npm run test:data-lancamento
 */
import pool from '../src/database/conexao.js';
import {
  addConta,
  addContasParceladas,
  addContasRecorrentes,
  getContasLancadasNoMes,
  getContas,
} from '../src/database/models/query_conta.js';
import { converterParaFormatoDate, dataAtualFormatada } from '../src/utils/util.js';

const TEST_ORG = '999991';
const PREFIX = 'TestDataLanc_';

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

async function limparTestes() {
  await pool.query(`DELETE FROM contas WHERE nome LIKE $1 AND organization = $2`, [
    `${PREFIX}%`,
    TEST_ORG,
  ]);
}

async function garantirColuna() {
  await pool.query(`
    ALTER TABLE public.contas ADD COLUMN IF NOT EXISTS data_lancamento DATE;
  `);
}

console.log('\n=== data_lancamento — helpers ===\n');

{
  const hojeBR = dataAtualFormatada();
  const hojeISO = converterParaFormatoDate(hojeBR);
  assert(hojeISO.match(/^\d{4}-\d{2}-\d{2}$/), 'dataAtualFormatada → ISO válido');
  assert(hojeBR.match(/^\d{2}\/\d{2}\/\d{4}$/), 'dataAtualFormatada → BR válido');
}

async function runDbTests() {
  await garantirColuna();
  await limparTestes();

  const base = {
    categoria: 'teste',
    tipo_cartao: null,
    conta_user: 1,
    organization: TEST_ORG,
    paga: false,
  };

  console.log('\n=== 1. Conta simples Jun/Jun ===\n');
  await addConta({
    ...base,
    nome: `${PREFIX}SimplesJun`,
    dataFormatada: '2026-06-15',
    dataLancamentoFormatada: '2026-06-15',
    valor: 100,
  });

  const junLanc = await getContasLancadasNoMes(6, 2026, TEST_ORG);
  const junVenc = await getContas(6, 2026, TEST_ORG);
  assert(
    junLanc.some((c) => c.nome === `${PREFIX}SimplesJun`),
    'simples — aparece em jun (data_lancamento)'
  );
  assert(
    junVenc.some((c) => c.nome === `${PREFIX}SimplesJun`),
    'simples — aparece em jun (vencimento)'
  );
  assert(
    junLanc.find((c) => c.nome === `${PREFIX}SimplesJun`)?.data_lancamento === '15/06/2026',
    'simples — data_lancamento formatada'
  );

  console.log('\n=== 2. Crédito — lançamento Jun, vencimento Jul ===\n');
  await addConta({
    ...base,
    nome: `${PREFIX}CreditoJunJul`,
    dataFormatada: '2026-07-15',
    dataLancamentoFormatada: '2026-06-10',
    valor: 200,
  });

  const junLanc2 = await getContasLancadasNoMes(6, 2026, TEST_ORG);
  const julVenc = await getContas(7, 2026, TEST_ORG);
  const junVenc2 = await getContas(6, 2026, TEST_ORG);

  assert(
    junLanc2.some((c) => c.nome === `${PREFIX}CreditoJunJul`),
    'crédito — lançada em junho'
  );
  assert(
    julVenc.some((c) => c.nome === `${PREFIX}CreditoJunJul`),
    'crédito — vence em julho'
  );
  assert(
    !junVenc2.some((c) => c.nome === `${PREFIX}CreditoJunJul`),
    'crédito — NÃO aparece em jun por vencimento'
  );

  console.log('\n=== 3. Parcelamento — mesma data_lancamento, vencimentos escalonados ===\n');
  await addContasParceladas(
    {
      ...base,
      nome: `${PREFIX}Parcelado`,
      dataFormatada: '2026-07-01',
      dataLancamentoFormatada: '2026-06-05',
      valor: 300,
    },
    3
  );

  const junLanc3 = await getContasLancadasNoMes(6, 2026, TEST_ORG);
  const parcelasJun = junLanc3.filter((c) => c.nome.startsWith(`${PREFIX}Parcelado`));
  assert(parcelasJun.length === 3, 'parcelamento — 3 parcelas lançadas em jun');
  const lancamentosUnicos = new Set(parcelasJun.map((c) => c.data_lancamento));
  assert(lancamentosUnicos.size === 1 && lancamentosUnicos.has('05/06/2026'), 'parcelamento — mesma data_lancamento');

  const julVenc3 = await getContas(7, 2026, TEST_ORG);
  const agoVenc = await getContas(8, 2026, TEST_ORG);
  const setVenc = await getContas(9, 2026, TEST_ORG);
  assert(
    julVenc3.some((c) => c.nome.includes(`${PREFIX}Parcelado`) && c.parcela_atual === 1),
    'parcelamento — 1ª parcela vence jul'
  );
  assert(
    agoVenc.some((c) => c.nome.includes(`${PREFIX}Parcelado`) && c.parcela_atual === 2),
    'parcelamento — 2ª parcela vence ago'
  );
  assert(
    setVenc.some((c) => c.nome.includes(`${PREFIX}Parcelado`) && c.parcela_atual === 3),
    'parcelamento — 3ª parcela vence set'
  );

  console.log('\n=== 4. Débito — data_lancamento e vencimento = hoje ===\n');
  const hojeISO = converterParaFormatoDate(dataAtualFormatada());
  const mesHoje = new Date().getMonth() + 1;
  const anoHoje = new Date().getFullYear();

  await addConta({
    ...base,
    nome: `${PREFIX}Debito`,
    dataFormatada: hojeISO,
    dataLancamentoFormatada: hojeISO,
    valor: 75,
    paga: true,
  });

  const lancHoje = await getContasLancadasNoMes(mesHoje, anoHoje, TEST_ORG);
  const vencHoje = await getContas(mesHoje, anoHoje, TEST_ORG);
  const debito = lancHoje.find((c) => c.nome === `${PREFIX}Debito`);
  assert(!!debito, 'débito — aparece no mês atual (data_lancamento)');
  assert(
    vencHoje.some((c) => c.nome === `${PREFIX}Debito`),
    'débito — aparece no mês atual (vencimento)'
  );
  assert(debito?.data_lancamento === dataAtualFormatada(), 'débito — data_lancamento = hoje');

  console.log('\n=== 5. Recorrência — mesma data_lancamento ===\n');
  await addContasRecorrentes(
    {
      ...base,
      nome: `${PREFIX}Recorrente`,
      dataFormatada: '2026-08-10',
      dataLancamentoFormatada: '2026-06-20',
      valor: 50,
    },
    3
  );

  const junLanc5 = await getContasLancadasNoMes(6, 2026, TEST_ORG);
  const recJun = junLanc5.filter((c) => c.nome.startsWith(`${PREFIX}Recorrente`));
  assert(recJun.length === 3, 'recorrência — 3 itens lançados em jun');
  assert(
    recJun.every((c) => c.data_lancamento === '20/06/2026'),
    'recorrência — mesma data_lancamento em todas'
  );

  const agoVenc5 = await getContas(8, 2026, TEST_ORG);
  assert(
    agoVenc5.some((c) => c.nome.startsWith(`${PREFIX}Recorrente`)),
    'recorrência — 1ª ocorrência vence ago'
  );

  await limparTestes();
}

async function main() {
  try {
    await runDbTests();
  } catch (err) {
    falhou += 1;
    console.error('\nErro nos testes de banco:', err.message);
    console.error('Verifique se PostgreSQL está ativo e execute: npm run migrate:data-lancamento');
  } finally {
    await pool.end();
  }

  console.log(`\nResultado: ${passou} ok, ${falhou} falhas\n`);
  process.exit(falhou > 0 ? 1 : 0);
}

main();
