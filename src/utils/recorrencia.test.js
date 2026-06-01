import { gerarDefinicoesRecorrencia } from './recorrencia.js';

let ok = 0;
let fail = 0;

function assert(name, condition, details = '') {
  if (condition) {
    ok++;
    console.log(`✓ ${name}`);
  } else {
    fail++;
    console.error(`✗ ${name}${details ? `: ${details}` : ''}`);
  }
}

function testRecorrenciaBasica() {
  const itens = gerarDefinicoesRecorrencia({
    nome: 'Academia',
    valor: 120,
    totalRecorrencias: 6,
    dataFormatada: '2026-06-10',
  });

  assert('Gera 6 ocorrências', itens.length === 6, `obtido ${itens.length}`);
  assert('Nome sem sufixo de parcela', itens.every((i) => i.nome === 'Academia'));
  assert('Valor fixo', itens.every((i) => i.valor === 120));
  assert('Primeira competência mantém mês base', itens[0].dataFormatada === '2026-06-10');
  assert('Última competência avança corretamente', itens[5].dataFormatada === '2026-11-10');
}

function testViradaAno() {
  const itens = gerarDefinicoesRecorrencia({
    nome: 'Netflix',
    valor: 39.9,
    totalRecorrencias: 3,
    dataFormatada: '2026-11-30',
  });

  assert(
    'Virada de ano mantém sequência mensal',
    itens.map((i) => i.dataFormatada).join(',') === '2026-11-30,2026-12-30,2027-01-30'
  );
}

testRecorrenciaBasica();
testViradaAno();

console.log(`\nResultado: ${ok} ok, ${fail} falhou\n`);
process.exit(fail > 0 ? 1 : 0);
