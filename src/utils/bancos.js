/**
 * Catálogo de bancos (espelho do mobile — slug persistido em tipo_cartao).
 * @see ../../../src/utils/bancos.js
 */
export const BANCOS_CATALOGO = [
  { slug: 'nubank', nome: 'Nubank', sigla: 'NU', icone: 'card', cor: '#820AD1', corTexto: '#FFFFFF' },
  { slug: 'inter', nome: 'Inter', sigla: 'IN', icone: 'business', cor: '#FF7A00', corTexto: '#FFFFFF' },
  { slug: 'picpay', nome: 'PicPay', sigla: 'PP', icone: 'wallet', cor: '#11C76F', corTexto: '#FFFFFF' },
  { slug: 'itau', nome: 'Itaú', sigla: 'IT', icone: 'business', cor: '#EC7000', corTexto: '#FFFFFF' },
  { slug: 'santander', nome: 'Santander', sigla: 'ST', icone: 'business', cor: '#EC0000', corTexto: '#FFFFFF' },
  { slug: 'bradesco', nome: 'Bradesco', sigla: 'BD', icone: 'business', cor: '#CC092F', corTexto: '#FFFFFF' },
  { slug: 'bb', nome: 'Banco do Brasil', sigla: 'BB', icone: 'business', cor: '#FFCC29', corTexto: '#003882' },
  { slug: 'caixa', nome: 'Caixa', sigla: 'CX', icone: 'business', cor: '#0070AB', corTexto: '#FFFFFF' },
  { slug: 'sicoob', nome: 'Sicoob', sigla: 'SC', icone: 'people', cor: '#003641', corTexto: '#FFFFFF' },
  { slug: 'sicredi', nome: 'Sicredi', sigla: 'SI', icone: 'people', cor: '#3E6334', corTexto: '#FFFFFF' },
  { slug: 'outro', nome: 'Outro', sigla: '?', icone: 'card-outline', cor: '#6B7A90', corTexto: '#FFFFFF' },
];

const MAPA_BANCOS = BANCOS_CATALOGO.reduce((acc, banco) => {
  acc[banco.slug] = banco;
  return acc;
}, {});

function normalizarTexto(texto) {
  return String(texto || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function resolverBanco(slug) {
  if (!slug) {
    return null;
  }
  return MAPA_BANCOS[String(slug).trim().toLowerCase()] || null;
}

export function inferirBancoDoNome(nome) {
  const texto = normalizarTexto(nome);
  if (!texto) {
    return null;
  }

  for (const banco of BANCOS_CATALOGO.filter((b) => b.slug !== 'outro')) {
    const chave = normalizarTexto(banco.nome);
    if (texto.includes(chave) || texto.includes(normalizarTexto(banco.slug))) {
      return banco;
    }
    if (banco.slug === 'bb' && (texto.includes('banco do brasil') || texto.includes(' bb '))) {
      return banco;
    }
    if (banco.slug === 'picpay' && texto.includes('pic pay')) {
      return banco;
    }
  }

  return null;
}

export function resolverBancoParaCartao(cartao) {
  if (!cartao) {
    return null;
  }

  const porSlug = resolverBanco(cartao.banco_slug);
  if (porSlug) {
    return porSlug;
  }

  return inferirBancoDoNome(cartao.nome);
}

export function enriquecerCartaoComBanco(cartao) {
  const banco = resolverBancoParaCartao(cartao);
  return {
    bancoSlug: banco?.slug || cartao?.banco_slug || null,
    bancoNome: banco?.nome || null,
    bancoSigla: banco?.sigla || null,
    bancoCor: banco?.cor || null,
    bancoCorTexto: banco?.corTexto || '#FFFFFF',
    bancoIcone: banco?.icone || 'card-outline',
  };
}
