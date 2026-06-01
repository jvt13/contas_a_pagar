import { randomUUID } from 'crypto';
import { adicionarMesesISO } from './parcelamento.js';

export function gerarDefinicoesRecorrencia({
  nome,
  valor,
  totalRecorrencias,
  dataFormatada,
  grupoRecorrencia = randomUUID(),
}) {
  const total = parseInt(totalRecorrencias, 10);
  const valorNumerico = parseFloat(valor);
  const nomeBase = String(nome || '').trim();

  if (!nomeBase) {
    throw new Error('Nome da recorrência é obrigatório.');
  }
  if (Number.isNaN(total) || total < 1 || total > 36) {
    throw new Error('Quantidade de recorrências deve estar entre 1 e 36.');
  }
  if (Number.isNaN(valorNumerico) || valorNumerico <= 0) {
    throw new Error('Valor da recorrência inválido.');
  }

  return Array.from({ length: total }, (_, index) => ({
    nome: nomeBase,
    dataFormatada: adicionarMesesISO(dataFormatada, index),
    valor: valorNumerico,
    recorrenciaAtual: index + 1,
    totalRecorrencias: total,
    grupoRecorrencia,
  }));
}
