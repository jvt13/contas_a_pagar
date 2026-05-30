/**
 * Remove lançamentos incorretos (pré-parcelamento) e recria via API.
 * Executar com backend rodando na porta 3100.
 */
import pool from '../src/database/conexao.js';

const API = process.env.API_URL || 'http://192.168.15.100:3100';

async function apiPost(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function main() {
  // Remove registros incorretos do diagnóstico
  const del = await pool.query(
    `DELETE FROM contas WHERE id IN (627, 628, 629) OR nome ILIKE 'TesteDiag%' RETURNING id, nome`
  );
  console.log('Removidos:', del.rows);

  const cartao = await pool.query(
    `SELECT id FROM tipo_cartao WHERE organization = '6' AND nome ILIKE '%itau%' LIMIT 1`
  );
  const tipoCartao = cartao.rows[0]?.id;
  if (!tipoCartao) {
    throw new Error('Cartão Itau não encontrado para org 6');
  }
  console.log('Cartão Itau id:', tipoCartao);

  await pool.end();

  const base = {
    vencimento: '01/06/2026',
    categoria: 'trabalho',
    tipo_cartao: tipoCartao,
    conta_user: '8',
    organization: '6',
    mes: '5',
    ano: '2026',
    parcelado: true,
  };

  console.log('\nCriando Notebook 12x R$ 3500...');
  const nb = await apiPost('/form_conta', {
    ...base,
    nome: 'Notebook',
    valor: 3500,
    total_parcelas: 12,
    categoria: 'trabalho',
  });
  console.log('Notebook success:', nb.success, 'contas junho:', nb.contas?.filter((c) => c.nome?.includes('Notebook')).length);

  console.log('\nCriando Tênis 3x R$ 300...');
  const tn = await apiPost('/form_conta', {
    ...base,
    nome: 'Tenis',
    valor: 300,
    total_parcelas: 3,
    categoria: 'presentes',
  });
  console.log('Tenis success:', tn.success);

  // Validar no banco (nova conexão)
  const { default: pool2 } = await import('../src/database/conexao.js');
  const check = await pool2.query(`
    SELECT id, nome, parcela_atual, total_parcelas, valor,
           EXTRACT(MONTH FROM vencimento)::int AS mes,
           EXTRACT(YEAR FROM vencimento)::int AS ano,
           grupo_parcelamento IS NOT NULL AS tem_grupo
    FROM contas
    WHERE nome ILIKE '%Notebook%' OR nome ILIKE '%Tenis%'
    ORDER BY nome, parcela_atual
  `);
  console.log('\n=== Registros após recriação ===');
  console.table(check.rows);
  console.log('Total:', check.rows.length, '(esperado 15)');

  const julho = await apiPost('/dados_tab', { ano: '2026', mes: '6', organization: '6' });
  const parcelasJulho = (julho.contas || []).filter((c) =>
    /Notebook|Tenis/i.test(c.nome)
  );
  console.log('\nParcelas visíveis em JULHO/2026 via API:', parcelasJulho.length);
  parcelasJulho.forEach((c) => console.log(`  - ${c.nome} R$${c.valor} ${c.vencimento}`));

  await pool2.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
