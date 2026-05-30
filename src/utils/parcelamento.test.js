/**
 * Testes unitários das regras de parcelamento.
 * Executar: node api-contas-a-pagar/src/utils/parcelamento.test.js
 */
import {
  calcularValoresParcelas,
  adicionarMesesISO,
  gerarDefinicoesParcelas,
  extrairNomeBase,
} from './parcelamento.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${message}`);
  } else {
    failed += 1;
    console.error(`  ✗ ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    console.error(`    esperado: ${JSON.stringify(expected)}`);
    console.error(`    obtido:   ${JSON.stringify(actual)}`);
  }
  assert(ok, message);
}

console.log('\n--- calcularValoresParcelas ---');

assertEqual(
  calcularValoresParcelas(1200, 12),
  Array(12).fill(100),
  '1200 / 12 = 12x R$100'
);

const tresParcelas = calcularValoresParcelas(999.99, 3);
assertEqual(tresParcelas, [333.33, 333.33, 333.33], '999.99 / 3 = 333.33 cada');
assert(
  Math.abs(tresParcelas.reduce((a, b) => a + b, 0) - 999.99) < 0.001,
  'soma das parcelas = valor total (999.99)'
);

const milTres = calcularValoresParcelas(1000, 3);
assertEqual(milTres, [333.34, 333.33, 333.33], '1000 / 3 arredondamento');
assert(
  Math.abs(milTres.reduce((a, b) => a + b, 0) - 1000) < 0.001,
  'soma das parcelas = valor total (1000)'
);

console.log('\n--- adicionarMesesISO / virada de ano ---');

assertEqual(
  adicionarMesesISO('2026-11-15', 0),
  '2026-11-15',
  'mês 0 mantém data'
);
assertEqual(
  adicionarMesesISO('2026-11-15', 1),
  '2026-12-15',
  'nov → dez'
);
assertEqual(
  adicionarMesesISO('2026-12-15', 1),
  '2027-01-15',
  'dez → jan (virada de ano)'
);

assertEqual(
  adicionarMesesISO('2026-01-31', 1),
  '2026-02-28',
  '31/jan + 1 mês → 28/fev (ano não bissexto)'
);

console.log('\n--- gerarDefinicoesParcelas ---');

const parcelas = gerarDefinicoesParcelas({
  nome: 'Notebook',
  valorTotal: 3000,
  totalParcelas: 12,
  dataFormatada: '2026-06-15',
  grupoParcelamento: 'test-grupo',
});

assert(parcelas.length === 12, 'gera 12 registros');
assertEqual(parcelas[0].nome, 'Notebook 1/12', 'nome parcela 1');
assertEqual(parcelas[11].nome, 'Notebook 12/12', 'nome parcela 12');
assertEqual(parcelas[0].valor, 250, 'valor parcela = 250');
assertEqual(parcelas[0].dataFormatada, '2026-06-15', 'vencimento parcela 1');
assertEqual(parcelas[1].dataFormatada, '2026-07-15', 'vencimento parcela 2');
assert(
  parcelas.every((p) => p.grupoParcelamento === 'test-grupo'),
  'todas compartilham grupo_parcelamento'
);

console.log('\n--- extrairNomeBase ---');
assertEqual(extrairNomeBase('Notebook 3/12'), 'Notebook', 'remove sufixo parcela');

console.log(`\nResultado: ${passed} ok, ${failed} falhou\n`);
process.exit(failed > 0 ? 1 : 0);
