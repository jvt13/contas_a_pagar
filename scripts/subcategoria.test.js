/**
 * Testes de subcategoria em contas (persistência e propagação).
 * Executar: npm run test:subcategoria
 */
import pool from '../src/database/conexao.js';
import {
  addConta,
  addContasParceladas,
  addContasRecorrentes,
  getContas,
  updateContaComEscopo,
} from '../src/database/models/query_conta.js';

const TEST_ORG = '999992';
const PREFIX = 'TestSubcat_';

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
    ALTER TABLE public.contas ADD COLUMN IF NOT EXISTS subcategoria VARCHAR(50);
  `);
}

async function runDbTests() {
  await garantirColuna();
  await limparTestes();

  const base = {
    categoria: 'alimentacao',
    subcategoria: 'mercado',
    tipo_cartao: null,
    conta_user: 1,
    organization: TEST_ORG,
    paga: false,
  };

  console.log('\n=== 1. Conta simples com subcategoria ===\n');
  await addConta({
    ...base,
    nome: `${PREFIX}Simples`,
    dataFormatada: '2026-06-15',
    dataLancamentoFormatada: '2026-06-15',
    valor: 100,
  });

  const contas = await getContas(6, 2026, TEST_ORG);
  const simples = contas.find((c) => c.nome === `${PREFIX}Simples`);
  assert(simples?.categoria === 'alimentacao', 'simples — categoria salva');
  assert(simples?.subcategoria === 'mercado', 'simples — subcategoria salva');

  console.log('\n=== 2. Conta sem subcategoria (NULL) ===\n');
  await addConta({
    ...base,
    subcategoria: null,
    nome: `${PREFIX}SemSub`,
    dataFormatada: '2026-06-16',
    dataLancamentoFormatada: '2026-06-16',
    valor: 50,
  });

  const semSub = contas.concat(await getContas(6, 2026, TEST_ORG)).find(
    (c) => c.nome === `${PREFIX}SemSub`
  );
  assert(semSub?.subcategoria == null, 'sem sub — subcategoria NULL');

  console.log('\n=== 3. Parcelamento — subcategoria propagada ===\n');
  await addContasParceladas(
    {
      ...base,
      subcategoria: 'restaurante',
      nome: `${PREFIX}Parcelado`,
      dataFormatada: '2026-07-01',
      dataLancamentoFormatada: '2026-06-05',
      valor: 300,
    },
    3
  );

  const todasParcelas = (await getContas(null, 2026, TEST_ORG)).filter((c) =>
    c.nome.startsWith(`${PREFIX}Parcelado`)
  );
  assert(todasParcelas.length === 3, 'parcelamento — 3 parcelas criadas');
  assert(
    todasParcelas.every((p) => p.subcategoria === 'restaurante'),
    'parcelamento — mesma subcategoria em todas'
  );

  console.log('\n=== 4. Recorrência — subcategoria propagada ===\n');
  await addContasRecorrentes(
    {
      ...base,
      subcategoria: 'delivery',
      nome: `${PREFIX}Recorrente`,
      dataFormatada: '2026-08-10',
      dataLancamentoFormatada: '2026-06-20',
      valor: 80,
    },
    3
  );

  const ago = await getContas(8, 2026, TEST_ORG);
  const recs = ago.filter((c) => c.nome.startsWith(`${PREFIX}Recorrente`));
  assert(recs.length >= 1, 'recorrência — ocorrências criadas');
  const todasRec = (await getContas(null, 2026, TEST_ORG)).filter((c) =>
    c.nome.startsWith(`${PREFIX}Recorrente`)
  );
  assert(
    todasRec.every((r) => r.subcategoria === 'delivery'),
    'recorrência — mesma subcategoria em todas'
  );

  console.log('\n=== 5. Edição com escopo — subcategoria atualizada ===\n');
  const primeiraParcela = todasParcelas[0];
  if (primeiraParcela?.id) {
    await updateContaComEscopo(
      {
        id: primeiraParcela.id,
        nome: `${PREFIX}Parcelado`,
        dataFormatada: '2026-07-01',
        valor: 300,
        categoria: 'alimentacao',
        subcategoria: 'mercado',
        tipo_cartao: null,
      },
      'todas'
    );

    const julAtualizado = await getContas(7, 2026, TEST_ORG);
    const parcelasAtual = julAtualizado.filter((c) => c.nome.startsWith(`${PREFIX}Parcelado`));
    assert(
      parcelasAtual.every((p) => p.subcategoria === 'mercado'),
      'escopo todas — subcategoria atualizada no grupo'
    );
  } else {
    assert(false, 'escopo todas — parcela de teste não encontrada');
  }

  await limparTestes();
}

async function main() {
  try {
    await runDbTests();
  } catch (err) {
    falhou += 1;
    console.error('\nErro nos testes de banco:', err.message);
    console.error('Verifique se PostgreSQL está ativo e execute: npm run migrate:subcategoria');
  } finally {
    await pool.end();
  }

  console.log(`\nResultado: ${passou} ok, ${falhou} falhas\n`);
  process.exit(falhou > 0 ? 1 : 0);
}

main();
