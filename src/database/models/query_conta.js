// database/queries_contas.js
import pool from '../conexao.js';
import { format } from 'date-fns';
import {
  extrairNomeBase,
  formatarNomeParcela,
  gerarDefinicoesParcelas,
  recalcularVencimentosGrupo,
} from '../../utils/parcelamento.js';
import { gerarDefinicoesRecorrencia } from '../../utils/recorrencia.js';

const CAMPOS_CONTA = `
  c.id,
  c.nome,
  tc.nome as tipo_cartao,
  c.categoria,
  c.subcategoria,
  c.vencimento,
  c.data_lancamento,
  c.valor,
  c.organization,
  c.conta_user,
  c.paga,
  c.data_inclusao,
  c.grupo_parcelamento,
  c.parcela_atual,
  c.total_parcelas,
  c.grupo_recorrencia,
  c.recorrencia_atual,
  c.total_recorrencias,
  c.tipo_cartao as tipo_cartao_id
`;

function mapContaRow(conta) {
  return {
    ...conta,
    valor: parseFloat(conta.valor) || 0,
    vencimento: format(new Date(conta.vencimento), 'dd/MM/yyyy'),
    data_lancamento: conta.data_lancamento
      ? format(new Date(conta.data_lancamento), 'dd/MM/yyyy')
      : null,
    parcela_atual: conta.parcela_atual != null ? parseInt(conta.parcela_atual, 10) : null,
    total_parcelas: conta.total_parcelas != null ? parseInt(conta.total_parcelas, 10) : null,
    recorrencia_atual: conta.recorrencia_atual != null ? parseInt(conta.recorrencia_atual, 10) : null,
    total_recorrencias:
      conta.total_recorrencias != null ? parseInt(conta.total_recorrencias, 10) : null,
  };
}

/**
 * Função para obter todas as contas do banco de dados.
 */
export async function getContas(mes, ano, organization) {
  const mesInt = Number.isInteger(parseInt(mes)) ? parseInt(mes) : null;
  const anoInt = Number.isInteger(parseInt(ano)) ? parseInt(ano) : null;
  const key_share = organization;

  const query = `
    SELECT ${CAMPOS_CONTA}
    FROM contas c
    LEFT JOIN public.tipo_cartao tc ON tc.id = c.tipo_cartao
    WHERE
      ($1::integer IS NULL OR EXTRACT(MONTH FROM c.vencimento) = $1::integer)
      AND ($2::integer IS NULL OR EXTRACT(YEAR FROM c.vencimento) = $2::integer)
      AND c.organization = $3
    ORDER BY c.vencimento, c.id;
  `;

  const result = await pool.query(query, [mesInt, anoInt, key_share]);
  return result.rows.map(mapContaRow);
}

/** Contas lançadas no mês (Home — eixo data_lancamento). */
export async function getContasLancadasNoMes(mes, ano, organization) {
  const mesInt = Number.isInteger(parseInt(mes)) ? parseInt(mes) : null;
  const anoInt = Number.isInteger(parseInt(ano)) ? parseInt(ano) : null;
  const key_share = organization;

  const query = `
    SELECT ${CAMPOS_CONTA}
    FROM contas c
    LEFT JOIN public.tipo_cartao tc ON tc.id = c.tipo_cartao
    WHERE
      ($1::integer IS NULL OR EXTRACT(MONTH FROM c.data_lancamento) = $1::integer)
      AND ($2::integer IS NULL OR EXTRACT(YEAR FROM c.data_lancamento) = $2::integer)
      AND c.organization = $3
    ORDER BY c.data_lancamento, c.id;
  `;

  const result = await pool.query(query, [mesInt, anoInt, key_share]);
  return result.rows.map(mapContaRow);
}

export async function getContaRaw(id) {
  const query = `
    SELECT id, nome, vencimento, valor, categoria, subcategoria, tipo_cartao,
           grupo_parcelamento, parcela_atual, total_parcelas,
           grupo_recorrencia, recorrencia_atual, total_recorrencias,
           organization
    FROM contas
    WHERE id = $1;
  `;
  const result = await pool.query(query, [id]);
  return result.rows.length > 0 ? result.rows[0] : null;
}

export async function addConta(conta) {
  const paga = conta.paga === true;
  await pool.query(
    `INSERT INTO contas (
      nome, vencimento, data_lancamento, valor, categoria, subcategoria, tipo_cartao, paga, conta_user, organization,
      grupo_parcelamento, parcela_atual, total_parcelas,
      grupo_recorrencia, recorrencia_atual, total_recorrencias
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
    [
      conta.nome,
      conta.dataFormatada,
      conta.dataLancamentoFormatada,
      conta.valor,
      conta.categoria,
      conta.subcategoria || null,
      conta.tipo_cartao,
      paga,
      conta.conta_user,
      conta.organization,
      conta.grupo_parcelamento || null,
      conta.parcela_atual || null,
      conta.total_parcelas || null,
      conta.grupo_recorrencia || null,
      conta.recorrencia_atual || null,
      conta.total_recorrencias || null,
    ]
  );
}

/**
 * Cria N parcelas em transação atômica.
 */
export async function addContasParceladas(conta, totalParcelas) {
  const definicoes = gerarDefinicoesParcelas({
    nome: conta.nome,
    valorTotal: conta.valor,
    totalParcelas,
    dataFormatada: conta.dataFormatada,
  });
  const paga = conta.paga === true;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const parcela of definicoes) {
      await client.query(
        `INSERT INTO contas (
          nome, vencimento, data_lancamento, valor, categoria, subcategoria, tipo_cartao, paga, conta_user, organization,
          grupo_parcelamento, parcela_atual, total_parcelas,
          grupo_recorrencia, recorrencia_atual, total_recorrencias
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NULL, NULL, NULL)`,
        [
          parcela.nome,
          parcela.dataFormatada,
          conta.dataLancamentoFormatada,
          parcela.valor,
          conta.categoria,
          conta.subcategoria || null,
          conta.tipo_cartao,
          paga,
          conta.conta_user,
          conta.organization,
          parcela.grupoParcelamento,
          parcela.parcelaAtual,
          parcela.totalParcelas,
        ]
      );
    }

    await client.query('COMMIT');
    return definicoes.length;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Cria N recorrências mensais em transação atômica.
 */
export async function addContasRecorrentes(conta, totalRecorrencias) {
  const definicoes = gerarDefinicoesRecorrencia({
    nome: conta.nome,
    valor: conta.valor,
    totalRecorrencias,
    dataFormatada: conta.dataFormatada,
  });
  const paga = conta.paga === true;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const item of definicoes) {
      await client.query(
        `INSERT INTO contas (
          nome, vencimento, data_lancamento, valor, categoria, subcategoria, tipo_cartao, paga, conta_user, organization,
          grupo_parcelamento, parcela_atual, total_parcelas,
          grupo_recorrencia, recorrencia_atual, total_recorrencias
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NULL, NULL, NULL, $11, $12, $13)`,
        [
          item.nome,
          item.dataFormatada,
          conta.dataLancamentoFormatada,
          item.valor,
          conta.categoria,
          conta.subcategoria || null,
          conta.tipo_cartao,
          paga,
          conta.conta_user,
          conta.organization,
          item.grupoRecorrencia,
          item.recorrenciaAtual,
          item.totalRecorrencias,
        ]
      );
    }

    await client.query('COMMIT');
    return definicoes.length;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateConta(conta) {
  await pool.query(
    'UPDATE contas SET nome = $1, vencimento = $2, valor = $3, categoria = $4, subcategoria = $5, tipo_cartao = $6 WHERE id = $7',
    [conta.nome, conta.dataFormatada, conta.valor, conta.categoria, conta.subcategoria || null, conta.tipo_cartao, conta.id]
  );
}

function obterMetaGrupo(conta) {
  if (conta.grupo_parcelamento && conta.parcela_atual && conta.total_parcelas) {
    return {
      tipo: 'parcelamento',
      groupColumn: 'grupo_parcelamento',
      currentColumn: 'parcela_atual',
      totalColumn: 'total_parcelas',
      groupId: conta.grupo_parcelamento,
      atual: conta.parcela_atual,
      total: conta.total_parcelas,
    };
  }

  if (conta.grupo_recorrencia && conta.recorrencia_atual && conta.total_recorrencias) {
    return {
      tipo: 'recorrencia',
      groupColumn: 'grupo_recorrencia',
      currentColumn: 'recorrencia_atual',
      totalColumn: 'total_recorrencias',
      groupId: conta.grupo_recorrencia,
      atual: conta.recorrencia_atual,
      total: conta.total_recorrencias,
    };
  }

  return null;
}

/**
 * Atualiza conta(s) de um grupo conforme escopo.
 * @param {'apenas_esta'|'esta_e_futuras'|'todas'} escopo
 */
export async function updateContaComEscopo(conta, escopo = 'apenas_esta') {
  const atual = await getContaRaw(conta.id);
  if (!atual) {
    return false;
  }

  const metaGrupo = obterMetaGrupo(atual);
  const nomeBase = extrairNomeBase(conta.nome);
  const escopoFinal = !metaGrupo ? 'apenas_esta' : escopo;

  if (escopoFinal === 'apenas_esta') {
    let nomeFinal = conta.nome;
    if (metaGrupo?.tipo === 'parcelamento') {
      nomeFinal = formatarNomeParcela(nomeBase, metaGrupo.atual, metaGrupo.total);
    }
    await updateConta({ ...conta, nome: nomeFinal });
    return true;
  }

  const params = [metaGrupo.groupId];
  let filtro = `${metaGrupo.groupColumn} = $1`;

  if (escopoFinal === 'esta_e_futuras') {
    filtro += ` AND ${metaGrupo.currentColumn} >= $2`;
    params.push(metaGrupo.atual);
  }

  const { rows: parcelas } = await pool.query(
    `SELECT id, ${metaGrupo.currentColumn} AS atual, ${metaGrupo.totalColumn} AS total
     FROM contas WHERE ${filtro} ORDER BY ${metaGrupo.currentColumn}`,
    params
  );

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const parcela of parcelas) {
      const nomeFinal =
        metaGrupo.tipo === 'parcelamento'
          ? formatarNomeParcela(nomeBase, parcela.atual, parcela.total)
          : nomeBase;
      const vencimentoFinal =
        escopoFinal === 'todas' || escopoFinal === 'esta_e_futuras'
          ? recalcularVencimentosGrupo({
              dataFormatadaAnchor: conta.dataFormatada,
              parcelaAtualAnchor: metaGrupo.atual,
              parcelaAtual: parcela.atual,
              totalParcelas: parcela.total,
            })
          : conta.dataFormatada;

      await client.query(
        `UPDATE contas SET nome = $1, vencimento = $2, valor = $3, categoria = $4, subcategoria = $5, tipo_cartao = $6 WHERE id = $7`,
        [nomeFinal, vencimentoFinal, conta.valor, conta.categoria, conta.subcategoria || null, conta.tipo_cartao, parcela.id]
      );
    }

    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateContasStatus(id, status) {
  await pool.query('UPDATE contas SET paga = $2 WHERE id = $1', [id, status]);
}

export async function getContasPagas(ano, mes, organization) {
  const query = `
    SELECT ${CAMPOS_CONTA}
    FROM contas c
    LEFT JOIN public.tipo_cartao tc ON tc.id = c.tipo_cartao
    WHERE c.paga = TRUE
      AND ($1::int IS NULL OR EXTRACT(MONTH FROM c.vencimento) = $1::int)
      AND ($2::int IS NULL OR EXTRACT(YEAR FROM c.vencimento) = $2::int)
      AND c.organization = $3
    ORDER BY c.vencimento, c.id`;

  const result = await pool.query(query, [mes, ano, organization]);
  return result.rows.map(mapContaRow);
}

export async function getContasPendentes(ano, mes, organization) {
  const query = `
    SELECT ${CAMPOS_CONTA}
    FROM contas c
    LEFT JOIN public.tipo_cartao tc ON tc.id = c.tipo_cartao
    WHERE c.paga = FALSE
      AND ($1::int IS NULL OR EXTRACT(MONTH FROM c.vencimento) = $1::int)
      AND ($2::int IS NULL OR EXTRACT(YEAR FROM c.vencimento) = $2::int)
      AND c.organization = $3
    ORDER BY c.vencimento, c.id`;

  const result = await pool.query(query, [mes, ano, organization]);
  if (result.rows.length === 0) {
    return [];
  }
  return result.rows.map(mapContaRow);
}

/** Todas as contas pendentes da organização (sem filtro de mês — dashboard de cartões). */
export async function getContasPendentesOrganizacao(organization) {
  const query = `
    SELECT ${CAMPOS_CONTA}
    FROM contas c
    LEFT JOIN public.tipo_cartao tc ON tc.id = c.tipo_cartao
    WHERE c.paga = FALSE
      AND c.organization = $1
    ORDER BY c.vencimento, c.id`;

  const result = await pool.query(query, [organization]);
  return result.rows.map(mapContaRow);
}

/** Contas da organização no mês (pagas e pendentes) — dashboard débito. */
export async function getContasOrganizacaoMes(mes, ano, organization) {
  const mesInt = Number.isInteger(parseInt(mes, 10)) ? parseInt(mes, 10) : null;
  const anoInt = Number.isInteger(parseInt(ano, 10)) ? parseInt(ano, 10) : null;

  const query = `
    SELECT ${CAMPOS_CONTA}
    FROM contas c
    LEFT JOIN public.tipo_cartao tc ON tc.id = c.tipo_cartao
    WHERE c.organization = $1
      AND ($2::integer IS NULL OR EXTRACT(MONTH FROM c.vencimento) = $2::integer)
      AND ($3::integer IS NULL OR EXTRACT(YEAR FROM c.vencimento) = $3::integer)
    ORDER BY c.vencimento, c.id`;

  const result = await pool.query(query, [organization, mesInt, anoInt]);
  return result.rows.map(mapContaRow);
}

export async function getContasPendentes__() {
  const result = await pool.query('SELECT * FROM contas WHERE paga = FALSE');
  return result.rows.map(mapContaRow);
}

export async function getLimiteAll(mes, ano) {
  const query = 'SELECT DISTINCT limite FROM public.limites';
  const result = await pool.query(query);
  return result.rows.length > 0 ? result.rows[0].limite : 0;
}

export async function getLimite(mes, ano, organization) {
  const mesInt = parseInt(mes);
  const anoInt = parseInt(ano);
  if (isNaN(mesInt) || isNaN(anoInt)) {
    throw new Error('O mês ou o ano fornecido não são válidos.');
  }

  const query = 'SELECT id, limite FROM public.limites WHERE mes = $1 AND ano = $2 AND organization = $3 LIMIT 1';
  const result = await pool.query(query, [mesInt, anoInt, organization]);
  return result.rows.length > 0
    ? { id: result.rows[0].id, limite: result.rows[0].limite }
    : null;
}

export async function insertLimite(mes, ano, limite, conta_user, organization) {
  const query = 'INSERT INTO public.limites (mes, ano, limite, conta_user, organization) VALUES ($1, $2, $3, $4, $5) RETURNING id';
  try {
    const result = await pool.query(query, [mes, ano, limite, conta_user, organization]);
    if (result.rows.length > 0) {
      return result.rows[0].id;
    }
    throw new Error('Erro ao inserir limite, nenhum ID retornado.');
  } catch (error) {
    throw new Error('Falha na inserção do limite: ' + error.message);
  }
}

export async function updateLimite(id, limite) {
  const query = 'UPDATE public.limites SET limite = $1 WHERE id = $2 RETURNING *';
  const result = await pool.query(query, [limite, id]);
  return result.rows.length > 0 ? result.rows[0] : null;
}

export async function getFiltroAnos(organization) {
  const result = await pool.query(
    'SELECT DISTINCT ano FROM public.limites WHERE organization = $1 ORDER BY ano DESC',
    [organization]
  );
  return result.rows;
}

export async function getTodosAnos() {
  const result = await pool.query('SELECT DISTINCT ano FROM public.limites ORDER BY ano DESC');
  return result.rows;
}

/**
 * Exclui conta(s) conforme escopo de parcelamento.
 * @param {'apenas_esta'|'esta_e_futuras'|'todas'} escopo
 */
export async function excluirConta(id, escopo = 'apenas_esta') {
  const atual = await getContaRaw(id);
  if (!atual) {
    return false;
  }

  const metaGrupo = obterMetaGrupo(atual);

  if (!metaGrupo || escopo === 'apenas_esta') {
    const result = await pool.query('DELETE FROM contas WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  if (escopo === 'todas') {
    const result = await pool.query(
      `DELETE FROM contas WHERE ${metaGrupo.groupColumn} = $1`,
      [metaGrupo.groupId]
    );
    return result.rowCount > 0;
  }

  if (escopo === 'esta_e_futuras') {
    const result = await pool.query(
      `DELETE FROM contas WHERE ${metaGrupo.groupColumn} = $1 AND ${metaGrupo.currentColumn} >= $2`,
      [metaGrupo.groupId, metaGrupo.atual]
    );
    return result.rowCount > 0;
  }

  const result = await pool.query('DELETE FROM contas WHERE id = $1', [id]);
  return result.rowCount > 0;
}

export async function getContaID(id) {
  const query = `
    SELECT id, nome,
           TO_CHAR(vencimento, 'YYYY-MM-DD') as vencimento,
           valor, categoria, subcategoria, tipo_cartao,
           grupo_parcelamento, parcela_atual, total_parcelas,
           grupo_recorrencia, recorrencia_atual, total_recorrencias
    FROM contas
    WHERE id = $1;
  `;
  const result = await pool.query(query, [id]);
  if (result.rows.length === 0) {
    return null;
  }

  const conta = result.rows[0];
  return {
    ...conta,
    valor: parseFloat(conta.valor) || 0,
    parcela_atual: conta.parcela_atual != null ? parseInt(conta.parcela_atual, 10) : null,
    total_parcelas: conta.total_parcelas != null ? parseInt(conta.total_parcelas, 10) : null,
    recorrencia_atual:
      conta.recorrencia_atual != null ? parseInt(conta.recorrencia_atual, 10) : null,
    total_recorrencias:
      conta.total_recorrencias != null ? parseInt(conta.total_recorrencias, 10) : null,
  };
}
