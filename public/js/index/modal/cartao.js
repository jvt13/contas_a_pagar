import { postDados, putDados, getDados, deleteDados } from '/public/js/utils/services.js';
import { abrirModal, fecharModal, showToast } from '/public/js/utils/util.js';

// Função para buscar cartão por ID
async function getCartaoPorId(id) {
    try {
        const response = await getDados(`/get_cartao_id/${id}`);
        if (response.status === 200) {
            const data = await response.json();
            return data;
        }
        throw new Error(`Erro HTTP: ${response.status}`);
    } catch (error) {
        console.error('Erro ao buscar cartão:', error);
        throw error;
    }
}

// Função para adicionar novo cartão
export async function adicionarCartao() {
    console.log('Função adicionarCartao chamada');
    try {
        const btnAdicionar = document.getElementById('btn-adicionar-cartao');
        // Se estiver em modo de edição, não permite adicionar
        if (btnAdicionar.dataset.editandoId) {
            showToast('Finalize a edição atual antes de adicionar um novo cartão');
            return;
        }

        const nomeCartao = document.getElementById('nome_cartao').value;
        const select_credito_debito = document.getElementById('credito_debito').value;
        const vencimento = document.getElementById('vencimento').value;
        const diaUtil = document.getElementById('dia_util').value;

        console.log('Valores do formulário:', { nomeCartao, select_credito_debito, vencimento, diaUtil });

        const dadosCartao = {
            nome: nomeCartao,
            select: select_credito_debito,
            vencimento: vencimento,
            dia_util: diaUtil
        };

        console.log('Enviando dados:', dadosCartao);
        const response = await postDados('/add_cartao', dadosCartao);

        console.log('Resposta recebida:', response);
        
        if (response.sucess) {
            console.log('Cartão adicionado com sucesso!');  
            showToast('Cartão adicionado com sucesso!');
            //fecharModal('modal-cadastro-cartao');
            document.getElementById('form-cadastro-cartao').reset();
            // Atualizar a lista de cartões se necessário
            atualizarListaCartoes();
        } else {
            showToast(response.message || 'Erro ao adicionar cartão.');
        }
    } catch (error) {
        console.error('Erro ao adicionar cartão:', error);
        showToast('Erro ao adicionar cartão.');
    }
}

// Função para atualizar cartão
async function atualizarCartao(id) {
    try {
        // Primeiro, busca os dados do cartão
        const response = await getDados(`/get_cartao_id/${id}`);
        if (!response.success) {
            showToast('Erro ao buscar dados do cartão');
            return;
        }

        const cartao = response.data;
        if (!cartao) {
            showToast('Cartão não encontrado');
            return;
        }

        // Preenche o formulário com os dados atuais
        document.getElementById('nome_cartao').value = cartao.nome || '';
        document.getElementById('credito_debito').value = cartao.tipo_cartao || '';
        document.getElementById('vencimento').value = cartao.vencimento || '';
        document.getElementById('dia_util').value = cartao.dia_util || '';

        // Altera o texto do botão
        const btnAdicionar = document.getElementById('btn-adicionar-cartao');
        btnAdicionar.textContent = 'Atualizar Cartão';
        
        // Armazena o ID do cartão sendo editado
        btnAdicionar.dataset.editandoId = id;

        // Remove o listener antigo e adiciona um novo para atualização
        const oldClickHandler = btnAdicionar.onclick;
        btnAdicionar.onclick = async () => {
            const nomeCartao = document.getElementById('nome_cartao').value;
            const tipoCartao = document.getElementById('credito_debito').value;
            const vencimento = document.getElementById('vencimento').value;
            const diaUtil = document.getElementById('dia_util').value;

            const dadosCartao = {
                nome: nomeCartao,
                tipo_cartao: tipoCartao,
                vencimento: vencimento,
                dia_util: diaUtil
            };

            try {
                const response = await putDados(`/update_cartao/${id}`, dadosCartao);
                
                if (response.sucess) {
                    showToast('Cartão atualizado com sucesso!');
                    // Reseta o formulário e o botão
                    document.getElementById('form-cadastro-cartao').reset();
                    btnAdicionar.textContent = 'Adicionar Cartão';
                    delete btnAdicionar.dataset.editandoId;
                    // Restaura o handler original
                    btnAdicionar.onclick = oldClickHandler;
                    // Atualiza a lista
                    await atualizarListaCartoes();
                    // Fecha o modal
                    //fecharModal('modal-cadastro-cartao');
                } else {
                    showToast(response.message || 'Erro ao atualizar cartão');
                }
            } catch (error) {
                console.error('Erro ao atualizar cartão:', error);
                showToast('Erro ao atualizar cartão');
            }
        };

    } catch (error) {
        console.error('Erro ao preparar edição do cartão:', error);
        showToast('Erro ao preparar edição do cartão');
    }
}

// Função para excluir cartão
async function excluirCartao(id) {
    if (!confirm('Tem certeza que deseja excluir o cartão '+id+'?')) {
        return;
    }

    try {
        const response = await deleteDados(`/delete_cartao/${id}`);
        console.log('Resposta da exclusão:', response);
        
        if (response.sucess) {
            showToast('Cartão excluído com sucesso!');
            await atualizarListaCartoes();
        } else {
            showToast(response.message || 'Erro ao excluir cartão');
        }
    } catch (error) {
        console.error('Erro ao excluir cartão:', error);
        showToast('Erro ao excluir cartão');
    }
}

// Função para atualizar a lista de cartões
export async function atualizarListaCartoes() {
    try {
        console.log('Função atualizarListaCartoes chamada');
        const responseData = await getDados('/get_cartoes');
        console.log('Dados da resposta:', responseData);

        // Verifica se a resposta foi bem-sucedida
        if (responseData && (responseData.sucess || responseData.success)) {
            const cartoes = responseData.cartoes || responseData.data || [];
            console.log('Cartões recebidos:', cartoes);
            
            const tabela = document.getElementById('lista-cartoes');
            if (!tabela) {
                console.error('Tabela não encontrada');
                return;
            }
            
            const tbody = tabela.querySelector('tbody');
            if (!tbody) {
                console.error('tbody não encontrado');
                return;
            }
            
            // Limpa a tabela
            tbody.innerHTML = '';
            
            // Verifica se há cartões para exibir
            if (!Array.isArray(cartoes) || cartoes.length === 0) {
                console.log('Nenhum cartão encontrado');
                const tr = document.createElement('tr');
                const td = document.createElement('td');
                td.colSpan = 4;
                td.textContent = 'Nenhum cartão cadastrado';
                td.style.textAlign = 'center';
                tr.appendChild(td);
                tbody.appendChild(tr);
                return;
            }
            
            // Adiciona cada cartão na tabela
            cartoes.forEach(cartao => {
                console.log('Processando cartão:', cartao);
                const tr = document.createElement('tr');
                
                // Células de dados
                const tdNome = document.createElement('td');
                tdNome.textContent = cartao.nome || '';
                tdNome.style.textAlign = 'left';
                
                const tdVencimento = document.createElement('td');
                tdVencimento.textContent = cartao.vencimento || '';
                tdVencimento.style.textAlign = 'center';
                
                const tdDiaUtil = document.createElement('td');
                tdDiaUtil.textContent = cartao.dia_util || '';
                tdDiaUtil.style.textAlign = 'center';
                
                // Célula de ações
                const tdAcoes = document.createElement('td');
                tdAcoes.className = 'modal-cartao__acoes';
                
                // Botão Editar
                const btnEditar = document.createElement('button');
                btnEditar.textContent = 'Editar';
                btnEditar.className = 'modal-cartao__button-edit';
                btnEditar.addEventListener('click', () => atualizarCartao(cartao.id));
                
                // Botão Excluir
                const btnExcluir = document.createElement('button');
                btnExcluir.textContent = 'Excluir';
                btnExcluir.className = 'modal-cartao__button-delete';
                btnExcluir.addEventListener('click', () => excluirCartao(cartao.id));
                
                // Adiciona os botões à célula de ações
                tdAcoes.appendChild(btnEditar);
                tdAcoes.appendChild(btnExcluir);
                
                // Adiciona todas as células à linha
                tr.appendChild(tdNome);
                tr.appendChild(tdVencimento);
                tr.appendChild(tdDiaUtil);
                tr.appendChild(tdAcoes);
                
                // Adiciona a linha à tabela
                tbody.appendChild(tr);
            });
            
            console.log('Lista de cartões atualizada com sucesso');
        } else {
            console.error('Resposta da API não contém dados:', responseData);
            showToast('Erro ao carregar cartões: Dados não encontrados');
        }
    } catch (error) {
        console.error('Erro ao atualizar lista de cartões:', error);
        showToast('Erro ao atualizar lista de cartões.');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Botão para abrir modal
    const btnAbrirModal = document.getElementById('btn-abrir-modal-cartao');
    if (btnAbrirModal) {
        btnAbrirModal.addEventListener('click', () => {
            console.log('Botão abrir modal cartão clicado');
            fecharModal('modal-config-opcoes');
            abrirModal('modal-cadastro-cartao');
        });
    }

    // Configura o botão de adicionar cartão
    const btnAdicionar = document.getElementById('btn-adicionar-cartao');
    if (btnAdicionar) {
        btnAdicionar.onclick = adicionarCartao;
    }
});

// Exportar funções para uso em outros arquivos
export {
    getCartaoPorId,
    atualizarCartao,
    excluirCartao
}; 