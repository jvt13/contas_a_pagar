/*--- Mask valor do Modal ---*/
const inputLimite = document.getElementById("limite");

inputLimite.addEventListener("input", function () {
  let valor = this.value.replace(/\D/g, ""); // remove tudo que não for dígito
  valor = (parseInt(valor, 10) / 100).toFixed(2); // transforma em decimal
  this.value = `R$ ${valor.replace(".", ",")}`;
});

// Remove o "R$" para envio ao backend
inputLimite.addEventListener("blur", function () {
  this.value = this.value.replace("R$ ", "");
});

async function enviarPost(event) {
  if (event) event.preventDefault(); // Impede o envio padrão do formulário
  const form = document.getElementById('form_addLimite');
  const mes = form.querySelector("#mes").value;
  const ano_select = form.querySelector("#ano").value;
  const limite = form.querySelector("#limite").value;
  const novo_ano = form.querySelector("#novo_ano").value;
  const anoSelecionado = ano_select.value || novo_ano;
  let mesNum = parseInt(mes) + 1;
  var ano = 0;

  const mensagem = 'O campo do ano está vazio. Se o ano desejado não estiver na lista, clique no botão ao lado para adicionar um novo ano. Após a ação, uma vez que o mês e o limite estejam preenchidos, clique no botão "Salvar Limite" para finalizar.';

  try {

    if (ano_select === '' && novo_ano == '') {
      alert(mensagem);
      return false;
    }

    if (ano_select === '') {
      ano = novo_ano;
    } else {
      ano = ano_select;
    }
    ano_select_ger_limite = parseInt(ano);
    mes_select_ger_limite = parseInt(mes);

    const id = await obterIdLimite(ano, mesNum);

    if (id) {
      // Se o ID foi encontrado, podemos tentar atualizar o limite.
      await atualizarLimite(ano, mesNum, limite, id);
    } else {
      // Se nenhum ID for encontrado, poderíamos optar por inserir o limite
      await inserirLimite(ano, mesNum, limite);
    }

    //form.querySelector("#limite").value = '';
    //form.querySelector("#limite").value = '';

    setTimeout(() => {//Fechar modal
      const novoAnoCampo = document.getElementById('novoAnoCampo');
      novoAnoCampo.style.display = novoAnoCampo.style.display === 'none' ? 'flex' : 'none';
      fecharModal('modalGerenciarLimite');
    }, 500);

    try {
      const formSelector = document.getElementById('form_selector');
      /*formSelector.querySelector('#ano').value = ano;
      formSelector.querySelector("#inputMes").value = mes;*/

      const anoElement = formSelector.querySelector("#ano"); // Seleciona o ano dentro do formulário
      const mesElement = formSelector.querySelector("#inputMes"); // Seleciona o mês dentro do formulário

      const ano = anoElement.value; // Pega o valor do ano
      const mes = mesElement.value; // Pega o valor do mês
      //console.log('Ano: ' + ano)

      form.querySelector("#mes").value = '';
      form.querySelector("#ano").value = '';
      form.querySelector("#limite").value = '';
      form.querySelector("#novo_ano").value = '';

      getDadosTab(ano, mes, true); //atualiza dados da tela principal.
    } catch (error) {
      console.error(error)
    }

  } catch (error) {
    console.error('Erro:', error);
    // Considerar informar o erro de uma forma mais amigável ao usuário.
  }
}

async function obterIdLimite(ano, mesNum) {
  try {
    ano = parseInt(ano);
    mesNum = parseInt(mesNum);

    // Validação simples antes do envio
    if (!Number.isInteger(ano) || !Number.isInteger(mesNum)) {
      throw new Error(`Parâmetros inválidos: ano=${ano}, mes=${mesNum}`);
    }

    const response = await fetch('limit_list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ano: ano, mes: mesNum })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro HTTP: ${response.status} - ${errorText}`);
    }

    const { success, id } = await response.json();

    if (!success) {
      console.warn("Requisição respondida com sucesso = false");
      return null;
    }

    return id ?? null; // Garante que o retorno seja null se id não existir
  } catch (error) {
    console.error("Erro na função obterIdLimite:", error);
    throw new Error('Falha na obtenção do ID do limite: ' + error.message);
  }
}

async function atualizarLimite(ano, mesNum, limite, id) {
  try {
    const response = await fetch('salvar_limite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ano: ano, mes: mesNum, limite: limite, id: id, tipo: 'update' })
    });

    if (!response.ok) {
      throw new Error('Erro ao salvar limite com atualização');
    }

    let { sucess, mensagem } = await response.json();
    if (!sucess) {
      throw new Error('Atualização não foi bem-sucedida.');
    } else {
      showToast(`Limite do mês ${mesNum} atualizado com sucesso!`)
    }
  } catch (error) {
    console.error('Erro no atualizarLimite:', error);
    throw new Error('Falha na atualização do limite: ' + error.message);
  }
}

// Função para inserir limite
async function inserirLimite(ano, mes, limite) {
  try {
    const response = await fetch('salvar_limite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ano: ano, mes: mes, limite: limite, tipo: 'insert' })
    });

    if (!response.ok) {
      throw new Error('Erro ao salvar limite com inserção');
    }

    let { sucess } = await response.json();
    if (!sucess) {
      throw new Error('Falha ao inserir limite.');
    } else {
      showToast(`Limite do mês ${mes} inserido com sucesso!`);
    }
  } catch (error) {
    throw new Error('Falha na inserção do limite: ' + error.message);
  }
}