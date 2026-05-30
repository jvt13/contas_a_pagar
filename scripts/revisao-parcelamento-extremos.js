/**
 * Testes de cenários extremos — parcelamento.
 * node scripts/revisao-parcelamento-extremos.js
 */
import {
  calcularValoresParcelas,
  adicionarMesesISO,
  gerarDefinicoesParcelas,
} from '../src/utils/parcelamento.js';

let ok = 0;
let fail = 0;

function test(name, fn) {
  try {
    fn();
    ok++;
    console.log('✓', name);
  } catch (e) {
    fail++;
    console.error('✗', name, '-', e.message);
  }
}

function sum(arr) {
  return arr.reduce((a, b) => a + b, 0);
}

function assertClose(a, b, msg) {
  if (Math.abs(a - b) > 0.001) throw new Error(`${msg}: ${a} vs ${b}`);
}

console.log('\n=== Arredondamento ===\n');

[2, 3, 12, 24, 36].forEach((n) => {
  test(`${n} parcelas — soma = total (1000)`, () => {
    const v = calcularValoresParcelas(1000, n);
    assertClose(sum(v), 1000, 'soma');
    if (v.length !== n) throw new Error(`length ${v.length}`);
  });
});

test('999.99 / 3', () => {
  const v = calcularValoresParcelas(999.99, 3);
  assertClose(sum(v), 999.99, 'soma');
});

test('3500 / 12 (Notebook real)', () => {
  const v = calcularValoresParcelas(3500, 12);
  assertClose(sum(v), 3500, 'soma');
});

console.log('\n=== Datas ===\n');

test('virada de ano dez→jan', () => {
  if (adicionarMesesISO('2026-12-15', 1) !== '2027-01-15') throw new Error('fail');
});

test('36 meses — virada dupla', () => {
  const d = adicionarMesesISO('2026-01-15', 36);
  if (d !== '2029-01-15') throw new Error(`got ${d}`);
});

test('31/jan → fev (não bissexto 2027)', () => {
  if (adicionarMesesISO('2027-01-31', 1) !== '2027-02-28') throw new Error('fail');
});

test('31/jan → fev (bissexto 2028)', () => {
  if (adicionarMesesISO('2028-01-31', 1) !== '2028-02-29') throw new Error('fail');
});

test('29/fev bissexto + 12 meses', () => {
  const d = adicionarMesesISO('2024-02-29', 12);
  if (d !== '2025-02-28') throw new Error(`got ${d}`);
});

test('gerar 36 parcelas — meses únicos', () => {
  const p = gerarDefinicoesParcelas({
    nome: 'Long',
    valorTotal: 3600,
    totalParcelas: 36,
    dataFormatada: '2026-01-15',
  });
  const meses = new Set(p.map((x) => x.dataFormatada.slice(0, 7)));
  if (p.length !== 36) throw new Error('count');
  if (meses.size !== 36) throw new Error(`meses duplicados: ${meses.size}`);
});

test('gerar 24 parcelas — nomes sequenciais', () => {
  const p = gerarDefinicoesParcelas({
    nome: 'Item',
    valorTotal: 2400,
    totalParcelas: 24,
    dataFormatada: '2026-11-01',
  });
  if (p[0].nome !== 'Item 1/24') throw new Error(p[0].nome);
  if (p[23].nome !== 'Item 24/24') throw new Error(p[23].nome);
  if (p[1].dataFormatada !== '2026-12-01') throw new Error(p[1].dataFormatada);
  if (p[2].dataFormatada !== '2027-01-01') throw new Error(p[2].dataFormatada);
});

console.log(`\nResultado: ${ok} ok, ${fail} falhou\n`);
process.exit(fail > 0 ? 1 : 0);
