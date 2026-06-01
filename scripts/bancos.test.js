/**
 * Testes do catálogo de bancos.
 * Executar: node scripts/bancos.test.js
 */
import {
  inferirBancoDoNome,
  resolverBanco,
  resolverBancoParaCartao,
} from '../src/utils/bancos.js';

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

console.log('\n--- Inferência por nome (legado) ---');
assert(inferirBancoDoNome('Nubank Roxinho')?.slug === 'nubank', 'Nubank');
assert(inferirBancoDoNome('Pic Pay Crédito')?.slug === 'picpay', 'PicPay');
assert(inferirBancoDoNome('Itau Uniclass')?.slug === 'itau', 'Itaú');

console.log('\n--- Slug persistido ---');
{
  const cartao = { nome: 'Principal', banco_slug: 'inter', tipo_cartao: 'credito' };
  assert(resolverBancoParaCartao(cartao)?.slug === 'inter', 'prioriza slug');
  assert(cartao.nome === 'Principal', 'apelido mantido');
}

console.log('\n--- Cartão legado sem slug ---');
{
  const cartao = { nome: 'Santander Free', tipo_cartao: 'credito' };
  assert(resolverBancoParaCartao(cartao)?.slug === 'santander', 'infere santander');
}

console.log('\n--- Resolver slug ---');
assert(resolverBanco('bb')?.nome === 'Banco do Brasil', 'BB catalogado');

console.log(`\nResultado: ${passou} ok, ${falhou} falhas\n`);
process.exit(falhou > 0 ? 1 : 0);
