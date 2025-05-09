// Importando funções do arquivo de utilidades
import { abrirModal, fecharModal } from '../../utils/util.js';

// Funções para o Modal de Opções
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOMContentLoaded iniciado');

    // Elementos do modal de opções
    const modalConfigOpcoes = document.getElementById('modal-config-opcoes');
    const btnCriarCartao = document.getElementById('btn-criar-cartao');
    const btnGerLimite = document.getElementById('btn-gerenciar-limite');
    const btnExcluirCartao = document.getElementById('btn-excluir-cartao');
    const btnFecharModal = document.getElementById('fechar-modal-config');


    // Função para abrir o modal de opções
    function abrirModalConfigOpcoes() {
        modalConfigOpcoes.style.display = 'block';
    }

    // Função para fechar o modal de opções
    function fecharModalConfigOpcoes() {
        fecharModal('modal-config-opcoes');
    }

    // Event Listeners para os botões
    if (btnCriarCartao) {
        btnCriarCartao.addEventListener('click', function () {
            console.log('Botão criar cartão clicado');
            fecharModalConfigOpcoes();
            document.getElementById('form-cadastro-cartao').reset(); // Limpa o formulário antes de abrir o modal
            abrirModal('modal-cadastro-cartao');
        });
    }

    if (btnGerLimite) {
        btnGerLimite.addEventListener('click', function () {
            console.log('Botão gerenciar limite clicado');
            fecharModalConfigOpcoes();
            document.getElementById('form_addLimite').reset(); // Limpa o formulário antes de abrir o modal
            const novoAnoCampo = document.getElementById('novoAnoCampo');
            novoAnoCampo.style.display = 'none';
            abrirModal('modal-gerenciar-limite');
        });
    }

    if (btnExcluirCartao) {
        btnExcluirCartao.addEventListener('click', function () {
            console.log('Botão excluir cartão clicado');
            fecharModalConfigOpcoes();
            // Aqui você pode adicionar a função para abrir o modal de excluir cartão
        });
    }

    // Fechar modal ao clicar no X
    if (btnFecharModal) {
        btnFecharModal.addEventListener('click', function (event) {
            event.stopPropagation();
            fecharModal('modal-config-opcoes');
        });
    } else {
        console.log('Botão fechar não encontrado!');
    }

    // Exportar a função de abrir modal para uso em outros arquivos
    window.abrirModalConfigOpcoes = abrirModalConfigOpcoes;
});

