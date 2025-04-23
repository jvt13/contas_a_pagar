const { parseISO, format } = require('date-fns');
const model = require('../database/queries_conta'); // Importa o módulo de consultas
//const pool = require('../database/conexao');

const getDadosConta = async (req, res) => {
    let mesSelecionado = req.body.mes || ""; // Pega o mês como string
    let anoSelecionado = req.body.ano || "";

    // Define uma variável para armazenar o mês ajustado
    let mesNumero = null;

    // Verifica se o mês selecionado é um número entre 0 e 11
    if (mesSelecionado && parseInt(mesSelecionado) >= 0 && parseInt(mesSelecionado) <= 11) {
        mesNumero = parseInt(mesSelecionado, 10); // Converte para número
        mesNumero += 1; // Ajusta para correspondência no banco
    }

    try {
        const contas = await model.getContas(mesNumero, anoSelecionado);

        // Ajuste para renderizar corretamente
        if (mesNumero !== null) {
            mesSelecionado = mesNumero - 1; // Verifica se existe um mês válido
        }

        // Calcular total de contas
        const totalContas = contas.reduce((total, conta) => total + conta.valor, 0) || 0;

        // Calcular total de contas pagas
        const totalContasPagas = contas.reduce((total, conta) => total + (conta.paga ? conta.valor : 0), 0) || 0;

        // Calcular total de contas pendentes
        const totalContasPendentes = contas.reduce((total, conta) => total + (!conta.paga ? conta.valor : 0), 0) || 0;
        console.log('Parametro para o limite: ' + mesNumero + '/' + anoSelecionado)
        let limite_gastos = await model.getLimite(mesNumero, anoSelecionado);

        if(!limite_gastos){
            limite_gastos = 0;
        }else{
            limite_gastos = limite_gastos.limite
            console.log('Limite: ' + limite_gastos)
        }

        
        console.log(`Ano selecionado: ${anoSelecionado} / Mês selecionado: ${mesSelecionado}`);
        const limiteColor = (mesSelecionado !== '' && mesSelecionado >= 0 && mesSelecionado <= 11)
            ? obterCor(totalContas, limite_gastos)  // Chama a função se um mês específico foi selecionado
            : null; // Deixa null se "Todos" for selecionado
        console.log(`Cor ${limiteColor}`);

        const anos = await model.getAnos() || []; // Função para buscar anos no banco
        console.log("Anos retornados:", anos); // Verifique o que está sendo retornado

        if (!Array.isArray(anos)) {
            throw new Error('O retorno de getAnos não é um array.');
        }

        res.json({
            sucess: true,
            contas,
            total_contas: totalContas,
            total_contas_pagas: totalContasPagas,
            total_contas_pendentes: totalContasPendentes,
            total_limite: limite_gastos,
            limiteColor: limiteColor,
            mesSelecionado: mesSelecionado !== null ? mesSelecionado.toString() : "", // Envia como string para o frontend
            mensagemSucesso: null,
            anos: anos,
            anoSelecionado: anoSelecionado
        });
    } catch (err) {
        console.error('Erro ao buscar contas:', err);
        res.send("Erro ao buscar contas.");
    }
}
// Controlador para obter contas
const getContas = async (req, res) => {
    let mesSelecionado = req.query.mes || ""; // Pega o mês como string
    let anoSelecionado = req.query.ano || "";
    console.log("Ano: " + anoSelecionado);

    try {
        mesSelecionado = new Date().getMonth() + 1
        anoSelecionado = new Date().getFullYear();
        const contas = await model.getContas(mesSelecionado, anoSelecionado);

        mesSelecionado = mesSelecionado - 1;

        // Calcular total de contas
        const totalContas = contas.reduce((total, conta) => total + conta.valor, 0) || 0;

        // Calcular total de contas pagas
        const totalContasPagas = contas.reduce((total, conta) => total + (conta.paga ? conta.valor : 0), 0) || 0;

        // Calcular total de contas pendentes
        const totalContasPendentes = contas.reduce((total, conta) => total + (!conta.paga ? conta.valor : 0), 0) || 0;
        const limite_gastos = '5000';

        console.log(`Ano selecionado: ${anoSelecionado} / Mês selecionado: ${mesSelecionado}`);
        const limiteColor = (mesSelecionado !== '' && mesSelecionado >= 0 && mesSelecionado <= 11)
            ? obterCor(totalContas, limite_gastos)  // Chama a função se um mês específico foi selecionado
            : null; // Deixa null se "Todos" for selecionado
        console.log(`Cor ${limiteColor}`);

        const anos = await model.getAnos() || []; // Função para buscar anos no banco
        console.log("Anos retornados:", anos); // Verifique o que está sendo retornado

        if (!Array.isArray(anos)) {
            throw new Error('O retorno de getAnos não é um array.');
        }

        res.render('index', {
            contas,
            total_contas: totalContas,
            total_contas_pagas: totalContasPagas,
            total_contas_pendentes: totalContasPendentes,
            total_limite: limite_gastos,
            limiteColor: limiteColor,
            mesSelecionado: mesSelecionado !== null ? mesSelecionado.toString() : "", // Envia como string para o frontend
            mensagemSucesso: null,
            anos: anos,
            anoSelecionado: anoSelecionado
        });
    } catch (err) {
        console.error('Erro ao buscar contas:', err);
        res.send("Erro ao buscar contas.");
    }
};

// Função para adicionar nova conta ao banco de dados
const addConta = async (req, res) => {
    const { nome, vencimento, valor, mes, ano } = req.body;

    try {
        await model.addConta({ nome, vencimento, valor }); // Adiciona a nova conta
        console.log(`Conta ${nome} inserido com sucesso!!!`)

        // Chama getContas para obter todas as contas e renderizar a página
        // Aqui, você pode passar o mês e ano selecionados para que a paginação e filtragem funcione corretamente
        return getDadosConta(req, res); // Chama getContas passando a requisição e resposta
    } catch (error) {
        console.error('Erro ao adicionar conta:', error);
        res.send("Erro ao adicionar a conta.");
    }
};

// Controlador para visualizar contas pagas
const getContasPagas = async (req, res) => {
    try {
        const contasPagas = await model.getContasPagas(); // Usa a nova função do modelo
        const totalValores = contasPagas.reduce((total, conta) => total + conta.valor, 0);

        res.render('contas_pagas', { contasPagas, totalValores });
    } catch (err) {
        console.error('Erro ao buscar contas pagas:', err);
        res.send("Erro ao buscar contas pagas.");
    }
};

// Controlador para visualizar contas pendentes
const getContasPendentes = async (req, res) => {
    try {
        const contasPendentes = await model.getContasPendentes(); // Usa a nova função do modelo
        const totalValores = contasPendentes.reduce((total, conta) => total + conta.valor, 0);

        res.render('contas_pendentes', { contasPendentes, totalValores });
    } catch (err) {
        console.error('Erro ao buscar contas pendentes:', err);
        res.send("Erro ao buscar contas pendentes.");
    }
};

// Controlador para marcar conta como paga ou pendente
const alteraStatusConta = async (req, res) => {
    const index = req.body.index; // ID da conta a ser atualizada
    const check = req.body.paga === 'true'; // Verifica se o valor é uma string 'true', ajustando para booleano
    const mes = req.body.mes;

    try {
        await model.updateContas(index, check); // Atualiza o status da conta
        console.log(`Conta ${index} marcada como ${check ? 'paga' : 'pendente'}!`);
    } catch (err) {
        console.error('Erro ao marcar conta:', err);
        res.send("Erro ao alterar o status da conta.");
    }

    res.redirect('/?mes=' + mes);
};

const gerenciarLimite = async (req, res) => {
    const anos = await model.getAnos(); // Função para buscar anos no banco
    res.render('partials/gerenciar_limite', { anos });
}

const salvarLimite = async (req, res) => {
    const { mes, ano, limite, id, tipo } = req.body;
    //let valor_convertido = parseFloat(limite).toFixed(2).replace(',', '.'); // Convertendo limite para o formato correto
    let valor_convertido = parseFloat(limite.replace('R$', '').replace('.', '').replace(',', '.').trim());

    // Validando a conversão
    if (isNaN(valor_convertido)) {
        console.error('Valor de limite inválido:', limite);
        return res.status(400).json({ sucess: false, mensagem: 'Limite deve ser um número válido.' });
    }

    valor_convertido = valor_convertido.toFixed(2); // formatando para duas casas decimais
    console.log('Valor convertido:', valor_convertido);

    // Verificação de parâmetros
    if (!mes || !ano || !limite || (tipo === 'update' && !id)) {
        console.error('Parâmetros inválidos recebidos:', req.body);
        return res.status(400).json({ sucess: false, mensagem: 'Parâmetros inválidos.' });
    }

    console.log('Parâmetros recebidos:', { mes, ano, limite, id, tipo });

    try {
        if (tipo === 'insert') {
            const result = await model.insertLimite(mes, ano, valor_convertido);
            console.log('Limite inserido:', result);
            return res.json({ sucess: true, mensagem: `Limite de ${mes}/${ano} inserido com sucesso!` });
        } else if (tipo === 'update') {
            const result = await model.updateLimite(id, valor_convertido);
            console.log('Resultado da atualização:', result);

            if (result) {
                return res.json({ sucess: true, mensagem: `Limite de ${mes}/${ano} atualizado com sucesso!` });
            } else {
                console.error('Nenhuma linha foi atualizada para ID:', id);
                return res.status(404).json({ sucess: false, mensagem: 'Nenhum limite encontrado para atualização.' });
            }
        } else {
            console.error('Tipo inválido recebido:', tipo);
            return res.status(400).json({ sucess: false, mensagem: 'Tipo de operação inválido.' });
        }
    } catch (error) {
        console.error('Erro ao salvar limite:', error.message);
        return res.status(500).json({ sucess: false, mensagem: 'Erro ao salvar limite: ' + error.message });
    }
};

const getLimite = async (req, res) => {
    const { mes, ano } = req.body;
    console.log(`getLimite() parametros: ${mes}/${ano}`);

    try {
        const result = await model.getLimite(mes, ano);

        if (!result) { 
            console.log('Limite não encontrado, retornando id 0.');
            return res.json({ success: true, id: 0 }); // Retornando id 0 em vez de um erro
        }

        console.log('Encontrou limite. Retornando requisição - ' + result.id);
        return res.json({ sucess: true, id: result.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, mensagem: 'Erro ao processar a requisição' });
    }
};

// Controladores exportados para uso em rotas
module.exports = {
    home: getContas,
    addConta,
    paga: alteraStatusConta,
    getContasPagas,
    getContasPendentes,
    gerenciarLimite,
    salvarLimite,
    getLimite,
    getDadosConta
};


// Função para determinar a cor do card
function obterCor(total, limite) {
    console.log(`Total contas: ${total} - Limite: ${limite}`)
    if (total >= limite) {
        return 'red'; // Vermelho se ultrapassou o limite
    } else if (total >= limite - 1000) {
        return 'yellow'; // Amarelo se estiver perto do limite
    }
    return '#e0f2fe'; // Cor padrão (ou qualquer outra cor que você gostaria)
}