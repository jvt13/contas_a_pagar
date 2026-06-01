// Controller.js
import { parseISO, format } from 'date-fns';
import * as model from '../database/models/query_conta.js';
import * as model_config from '../database/models/query_config.js';
import * as model_users from '../database/models/query_users.js';
import {
  formatarParaBRL,
  dataAtualFormatada,
  formatDataBR,
  converterParaFormatoDate
} from '../utils/util.js';
import { verifyPassword, hashPassword } from '../utils/auth.js';
import { calcularVencimentoContaCartaoISO } from '../utils/competenciaCartao.js';
import { montarDashboardCartoes } from '../utils/dashboardCartao.js';

export const getDadosConta = async (req, res) => {
  let mesSelecionado = req.body.mes || "";
  let anoSelecionado = req.body.ano || "";
  let organization = req.body.organization || "";
  console.log(`--------------------------------Mês selecionado: ${mesSelecionado} - Ano selecionado: ${anoSelecionado}`);
  console.log('Organização getDadosConta: ' + organization)

  if (!anoSelecionado) {
    return res.status(400).json({
      success: false,
      error: "Ano é obrigatório",
      message: "Por favor, selecione um ano válido"
    });
  }

  let mesNumero = null;
  if (mesSelecionado && parseInt(mesSelecionado) >= 0 && parseInt(mesSelecionado) <= 11) {
    mesNumero = parseInt(mesSelecionado, 10) + 1;
  }

  try {
    const contas = await model.getContas(mesNumero, anoSelecionado, organization);

    if (mesNumero !== null) {
      mesSelecionado = mesNumero - 1;
    }

    const totalContas = contas.reduce((sum, c) => sum + c.valor, 0);
    const totalContasPagas = contas.reduce((sum, c) => sum + (c.paga ? c.valor : 0), 0);
    const totalContasPendentes = contas.reduce((sum, c) => sum + (!c.paga ? c.valor : 0), 0);

    let limite_gastos = await model.getLimite(mesNumero, anoSelecionado, organization);
    limite_gastos = limite_gastos ? limite_gastos.limite : 0;

    console.log(`Ano selecionado: ${anoSelecionado} / Mês selecionado: ${mesSelecionado}`);
    const limiteColor = (mesSelecionado !== '' && mesSelecionado >= 0 && mesSelecionado <= 11)
      ? obterCor(totalContas, limite_gastos)
      : null;

    const anos = await model.getTodosAnos() || [];
    if (!Array.isArray(anos)) throw new Error('O retorno de getAnos não é um array.');

    const tipos_cartao = await model_config.selectAll();

    return res.json({
      success: true,
      contas,
      total_contas: totalContas,
      total_contas_pagas: totalContasPagas,
      total_contas_pendentes: totalContasPendentes,
      total_limite: limite_gastos,
      limiteColor,
      mesSelecionado: mesSelecionado !== null ? mesSelecionado.toString() : "",
      mensagemsuccesso: null,
      anos,
      anoSelecionado,
      tipos_cartao
    });
  } catch (err) {
    console.error('Erro ao buscar contas:', err);
    return res.status(500).json({
      success: false,
      error: "Erro ao buscar contas.",
      message: err.message
    });
  }
};

export const getContas = async (req, res) => {
  let mesSelecionado = new Date().getMonth() + 1;
  let anoSelecionado = new Date().getFullYear();
  try {
    const contas = await model.getContas(mesSelecionado, anoSelecionado);
    mesSelecionado = mesSelecionado - 1;

    const totalContas = contas.reduce((sum, c) => sum + c.valor, 0);
    const totalContasPagas = contas.reduce((sum, c) => sum + (c.paga ? c.valor : 0), 0);
    const totalContasPendentes = contas.reduce((sum, c) => sum + (!c.paga ? c.valor : 0), 0);

    let limite_gastos = await model.getLimite(mesSelecionado + 1, anoSelecionado);
    limite_gastos = limite_gastos ? limite_gastos.limite : 0;

    const limiteColor = (mesSelecionado >= 0 && mesSelecionado <= 11)
      ? obterCor(totalContas, limite_gastos)
      : null;

    const anos = await model.getTodosAnos() || [];
    if (!Array.isArray(anos)) throw new Error('O retorno de getAnos não é um array.');

    const tipos_cartao = await model_config.selectAll();

    return res.render('index', {
      contas,
      total_contas: totalContas,
      total_contas_pagas: totalContasPagas,
      total_contas_pendentes: totalContasPendentes,
      total_limite: limite_gastos,
      limiteColor,
      mesSelecionado: mesSelecionado.toString(),
      mensagemsuccesso: null,
      anos,
      anoSelecionado,
      cartoes: tipos_cartao
    });
  } catch (err) {
    console.error('Erro ao buscar contas:', err);
    return res.send("Erro ao buscar contas.");
  }
};

export const addConta = async (req, res) => {
  const {
    nome, vencimento, valor, mes, ano, categoria, tipo_cartao, conta_user, organization,
    parcelado, total_parcelas, recorrente, total_recorrencias,
  } = req.body;

  try {
    const dataFormatada = converterParaFormatoDate(vencimento);
    const valorNumerico = parseFloat(valor);
    const totalParcelas = parseInt(total_parcelas, 10);
    const totalRecorrencias = parseInt(total_recorrencias, 10);
    const isParcelado = parcelado === true || parcelado === 'true' || parcelado === 1 || parcelado === '1';
    const isRecorrente =
      recorrente === true || recorrente === 'true' || recorrente === 1 || recorrente === '1';

    const contaBase = {
      nome,
      dataFormatada,
      valor: valorNumerico,
      categoria,
      tipo_cartao,
      conta_user,
      organization,
    };

    if (isParcelado && isRecorrente) {
      return res.status(400).json({
        success: false,
        message: 'Escolha apenas um modo: parcelado ou recorrente.',
      });
    }

    if (isParcelado && totalParcelas > 1) {
      if (Number.isNaN(totalParcelas) || totalParcelas < 2 || totalParcelas > 36) {
        return res.status(400).json({
          success: false,
          message: 'Quantidade de parcelas deve estar entre 2 e 36.',
        });
      }
      if (Number.isNaN(valorNumerico) || valorNumerico <= 0) {
        return res.status(400).json({ success: false, message: 'Valor inválido para parcelamento.' });
      }

      await model.addContasParceladas(contaBase, totalParcelas);
    } else if (isRecorrente && totalRecorrencias > 1) {
      if (Number.isNaN(totalRecorrencias) || totalRecorrencias < 2 || totalRecorrencias > 36) {
        return res.status(400).json({
          success: false,
          message: 'Quantidade de recorrências deve estar entre 2 e 36.',
        });
      }
      if (Number.isNaN(valorNumerico) || valorNumerico <= 0) {
        return res.status(400).json({ success: false, message: 'Valor inválido para recorrência.' });
      }

      await model.addContasRecorrentes(contaBase, totalRecorrencias);
    } else {
      await model.addConta(contaBase);
    }

    return getDadosConta(req, res);
  } catch (error) {
    console.error('Erro ao adicionar conta:', error);
    return res.status(400).json({ success: false, message: error.message || 'Erro ao adicionar conta' });
  }
};

export const updateConta = async (req, res) => {
  const {
    id, nome, vencimento, valor, categoria, tipo_cartao, conta_user, organization, escopo,
  } = req.body;

  try {
    const dataFormatada = converterParaFormatoDate(vencimento);
    const escopoValido = ['apenas_esta', 'esta_e_futuras', 'todas'].includes(escopo)
      ? escopo
      : 'apenas_esta';

    await model.updateContaComEscopo(
      { id, nome, dataFormatada, valor, categoria, tipo_cartao, conta_user, organization },
      escopoValido
    );
    return getDadosConta(req, res);
  } catch (error) {
    console.error('Erro ao atualizar conta:', error);
    return res.status(400).json({ success: false, message: error.message || 'Erro ao atualizar conta' });
  }
};

export const getContasPagas = async (req, res) => {
  try {
    const { ano, mes, organization } = req.query;

    let mesNumero = 0;
    if (mes && parseInt(mes) >= 0 && parseInt(mes) <= 11) {
      mesNumero = parseInt(mes, 10) + 1;
    }

    console.log(`Obtendo contas pagas para Ano: ${ano}, Mês: ${mesNumero}, Organização: ${organization}`);
    const contasPagas = await model.getContasPagas(ano, mesNumero, organization);
    const totalValores = contasPagas.reduce((sum, c) => sum + c.valor, 0);

    const anos = await model.getFiltroAnos(organization) || [];
    console.log('Anos disponíveis:', anos);

    return res.json({
      success: true,
      contasPagas,
      totalValores: formatarParaBRL(totalValores),
      anos,
    });
    //return res.render('contas_pagas', { contasPagas, totalValores });
  } catch (err) {
    console.error('Erro ao buscar contas pagas:', err);
    return res.send("Erro ao buscar contas pagas.");
  }
};

export const getContasPendentes = async (req, res) => {
  try {
    const { ano, mes, organization } = req.query;

    let mesNumero = null;
    if (mes !== undefined && mes !== '' && parseInt(mes, 10) >= 0 && parseInt(mes, 10) <= 11) {
      mesNumero = parseInt(mes, 10) + 1;
    }

    let anoNumero = null;
    if (ano !== undefined && ano !== '') {
      anoNumero = parseInt(ano, 10);
      if (Number.isNaN(anoNumero)) {
        anoNumero = null;
      }
    }

    console.log(`Obtendo contas pendentes — Ano: ${anoNumero}, Mês: ${mesNumero}, Organização: ${organization}`);

    const contasPendentes = await model.getContasPendentes(anoNumero, mesNumero, organization);
    const totalValores = contasPendentes.reduce((sum, c) => sum + c.valor, 0);
    console.log('Total de valores pendentes:', totalValores);
    const anos = await model.getFiltroAnos(organization) || [];
    console.log('Anos disponíveis para contas pendentes:', anos);
    return res.json({
      success: true,
      contasPendentes,
      totalValores: formatarParaBRL(totalValores),
      anos,
    });
    //return res.render('contas_pendentes', { contasPendentes, totalValores });
  } catch (err) {
    console.error('Erro ao buscar contas pendentes:', err);
    return res.status(500).json({ success: false, message: 'Erro ao buscar contas pendentes.' });
  }
};

export const getContasPendentes__ = async (req, res) => {
  try {
    const contasPendentes = await model.getContasPendentes();
    const totalValores = contasPendentes.reduce((sum, c) => sum + c.valor, 0);
    return res.render('contas_pendentes', { contasPendentes, totalValores });
  } catch (err) {
    console.error('Erro ao buscar contas pendentes:', err);
    return res.send("Erro ao buscar contas pendentes.");
  }
};

export const alteraStatusConta = async (req, res) => {
  const { index, paga: check } = req.body;
  try {
    await model.updateContasStatus(index, check);
    return res.json({ success: true, message: 'Status atualizado com sucesso' });
  } catch (err) {
    console.error('Erro ao marcar conta:', err);
    return res.status(500).json({ success: false, message: 'Erro ao alterar o status da conta' });
  }
};

export const gerenciarLimite = (req, res) => {
  model.getTodosAnos()
    .then(anos => res.render('partials/gerenciar_limite', { anos }))
    .catch(err => {
      console.error('Erro ao buscar anos para limite:', err);
      res.send("Erro ao carregar limites.");
    });
};

export const salvarLimite = async (req, res) => {
  const { mes, ano, limite, id, user, organization, tipo } = req.body;
  let valor_convertido = limite;
  if (isNaN(valor_convertido)) {
    return res.status(400).json({ success: false, mensagem: 'Limite deve ser um número válido.' });
  }
  if (!mes || !ano || !limite || (tipo === 'update' && !id)) {
    return res.status(400).json({ success: false, mensagem: 'Parâmetros inválidos.' });
  }
  try {
    if (tipo === 'insert') {
      await model.insertLimite(mes, ano, valor_convertido, user, organization);
      return res.json({ success: true, mensagem: `Limite de ${mes}/${ano} inserido com sucesso!` });
    } else {
      const result = await model.updateLimite(id, valor_convertido);
      if (result) {
        return res.json({ success: true, mensagem: `Limite de ${mes}/${ano} atualizado com sucesso!` });
      }
      return res.status(404).json({ success: false, mensagem: 'Nenhum limite encontrado para atualização.' });
    }
  } catch (error) {
    console.error('Erro ao salvar limite:', error);
    return res.status(500).json({ success: false, mensagem: 'Erro ao salvar limite: ' + error.message });
  }
};

export const getLimite = async (req, res) => {
  const { mes, ano, organization } = req.body;
  console.log(`Obtendo limite para Mês: ${mes}, Ano: ${ano}, Organização: ${organization}`);
  try {
    const result = await model.getLimite(mes, ano, organization);
    return res.json({ success: true, id: result ? result.id : 0 });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, mensagem: 'Erro ao processar a requisição' });
  }
};

export const excluirConta = async (req, res) => {
  const { id } = req.params;
  const escopo = req.query.escopo || 'apenas_esta';
  const escopoValido = ['apenas_esta', 'esta_e_futuras', 'todas'].includes(escopo)
    ? escopo
    : 'apenas_esta';

  try {
    const response = await model.excluirConta(id, escopoValido);
    if (!response) {
      return res.status(404).json({ success: false, mensagem: 'Conta não encontrada.' });
    }
    return res.json({ success: true, mensagem: 'Conta excluída com sucesso!' });
  } catch (error) {
    console.error('Erro ao excluir conta:', error);
    return res.status(500).json({ success: false, mensagem: error.message || 'Erro ao excluir conta.' });
  }
};

export const getContaID = async (req, res) => {
  const { id } = req.params;
  try {
    const conta = await model.getContaID(id);
    if (!conta) {
      return res.status(404).json({ success: false, message: 'Conta não encontrada' });
    }
    return res.json({ success: true, data: conta });
  } catch (error) {
    console.error('Erro no backend:', error);
    return res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
};

export const addCartao = async (req, res) => {
  const { nome, tipo_cartao, vencimento, dia_util, conta_user, organization, limite_credito } = req.body;

  console.log('Adicionando cartão: Nome:', nome, 'Tipo:', tipo_cartao, 'Vencimento:', vencimento, 'Dia útil:', dia_util, 'Conta do usuário:', conta_user, 'Organização:', organization);

  try {
    const limite = limite_credito != null && limite_credito !== '' ? parseFloat(limite_credito) : null;
    await model_config.insert(
      nome,
      tipo_cartao,
      vencimento,
      dia_util,
      conta_user,
      organization,
      null,
      Number.isNaN(limite) ? null : limite
    );
    return res.json({ success: true, mensagem: `Cartão ${nome} inserido com sucesso!` });
  } catch (error) {
    console.error('Erro ao inserir cartão:', error);
    return res.status(500).json({ success: false, mensagem: 'Erro ao inserir cartão: ' + error.message });
  }
};

export const getCartoes = async (req, res) => {
  const { orgaId } = req.query;

  console.log('Obtendo cartões com keyShareId:', orgaId);

  try {
    const result = await model_config.selectAll(orgaId);

    if (!result || result.length === 0) {
      console.warn('Nenhum cartão encontrado para a organização:', orgaId);
      return res.json({ success: false, mensagem: 'Nenhum cartão encontrado.', result: [] });
    }

    console.log('Cartões encontrados:', result.length);
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('Erro ao buscar cartões:', err);
    return res.status(500).json({ success: false, mensagem: 'Erro ao buscar cartões.' });
  }
};

export const excluirCartao = async (req, res) => {
  const { id } = req.params;
  try {
    await model_config.deleteId(id);
    return res.json({ success: true, mensagem: 'Cartão excluído com sucesso!' });
  } catch (error) {
    console.error('Erro ao excluir cartão:', error);
    return res.status(500).json({ success: false, mensagem: 'Erro ao excluir cartão: ' + error.message });
  }
};

export const getCartaoID = async (req, res) => {
  const { id } = req.params;
  console.log('Obtendo cartão com ID:', id);

  try {
    const cartao = await model_config.selectId(id);
    if (!cartao) {
      return res.status(404).json({ success: false, message: 'Cartão não encontrado' });
    }

    cartao.dia_vencimento = parseInt(cartao.vencimento, 10);
    cartao.vencimento_conta = calcularVencimentoContaCartaoISO(cartao, new Date());
    cartao.vencimento = cartao.vencimento_conta;

    return res.status(200).json({ success: true, data: cartao });
  } catch (error) {
    console.error('Erro no backend:', error);
    return res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
};

export const updateCartao = async (req, res) => {
  const { id } = req.params;
  const { nome, tipo_cartao, vencimento, dia_util, conta_user, organization, limite_credito } = req.body;
  try {
    const limite = limite_credito != null && limite_credito !== '' ? parseFloat(limite_credito) : null;
    await model_config.update(
      id,
      nome,
      tipo_cartao,
      vencimento,
      dia_util,
      conta_user,
      organization,
      null,
      Number.isNaN(limite) ? null : limite
    );
    return res.json({ success: true, mensagem: `Cartão ${nome} atualizado com sucesso!` });
  } catch (error) {
    console.error('Erro ao atualizar cartão:', error);
    return res.status(500).json({ success: false, mensagem: 'Erro ao atualizar cartão: ' + error.message });
  }
};

export const getDashboardCartoes = async (req, res) => {
  const { orgaId } = req.query;

  if (!orgaId) {
    return res.status(400).json({ success: false, mensagem: 'orgaId é obrigatório.' });
  }

  try {
    const [cartoes, contas] = await Promise.all([
      model_config.selectAll(orgaId),
      model.getContasPendentesOrganizacao(orgaId),
    ]);

    const resumos = montarDashboardCartoes(cartoes || [], contas || [], new Date());

    return res.json({
      success: true,
      data: resumos,
      atualizadoEm: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Erro ao montar dashboard de cartões:', err);
    return res.status(500).json({ success: false, mensagem: 'Erro ao carregar dashboard de cartões.' });
  }
};

function obterCor(total, limite) {
  if (total >= limite) return 'red';
  if (total >= limite - 1000) return 'yellow';
  return '#e0f2fe';
}
