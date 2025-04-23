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
  const ano = form.querySelector("#ano").value;
  const limite = form.querySelector("#limite").value;
  let mesNum = parseInt(mes) + 1;

  try {
    const id = await obterIdLimite(ano, mesNum);
    
    if (id) {
      // Se o ID foi encontrado, podemos tentar atualizar o limite.
      await atualizarLimite(ano, mesNum, limite, id);
    } else {
      // Se nenhum ID for encontrado, poderíamos optar por inserir o limite
      await inserirLimite(ano, mesNum, limite);
    }

    form.querySelector("#limite").value = '';
  } catch (error) {
    console.error('Erro:', error);
    // Considerar informar o erro de uma forma mais amigável ao usuário.
  }
}

async function obterIdLimite(ano, mesNum) {
  try {
    let response = await fetch('limit_list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ano: ano, mes: mesNum })
    });

    if (!response.ok) {
      throw new Error('Erro ao acessar limit_list');
    }

    let { sucess, id } = await response.json();
    return sucess ? id : null; // Retorna `id` se o sucesso for verdadeiro
  } catch (error) {
    console.error(error);
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
    }else{
      alert(`Limite do mês ${mesNum} atualizado com sucesso!`);
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
    }else{
      alert(`Limite do mês ${mes} inserido com sucesso!`);
    }
  } catch (error) {
    throw new Error('Falha na inserção do limite: ' + error.message);
  }
}