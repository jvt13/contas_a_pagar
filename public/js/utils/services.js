// utils/services.js

// Função genérica de requisição que intercepta todas as chamadas
async function request(url, { method = 'GET', body = null, headers = {} } = {}) {
    console.log(`[Interceptando] ${method} -> ${url}`); // Mostra no console qual método e URL estão sendo chamados

    // Monta as opções básicas da requisição
    const options = {
        method, // Método HTTP (GET, POST, PUT, DELETE etc.)
        headers: {
            'Content-Type': 'application/json', // Define que os dados enviados serão no formato JSON
            ...headers // Permite sobrescrever ou adicionar novos headers personalizados
        }
    };

    // Se houver um corpo (body), transforma o objeto JS em uma string JSON
    if (body) {
        options.body = JSON.stringify(body);
        console.log('[Payload]:', body); // Exibe no console o conteúdo enviado
    }

    try {
        // Realiza a requisição usando fetch
        const response = await fetch(url, options);

        // Se a resposta NÃO for OK (status HTTP diferente de 2xx)
        if (!response.ok) {
            console.warn(`[Erro ${response.status}] na URL: ${url}`); // Log de erro no console
            throw new Error(`Erro ${response.status}`); // Gera uma exceção para o catch
        }

        // Se a resposta for OK, converte o JSON de volta para objeto
        const json = await response.json();
        console.log('[Resposta]:', json); // Mostra a resposta recebida
        return json; // Retorna o objeto para quem chamou a função
    } catch (error) {
        // Caso ocorra qualquer erro (rede, servidor, etc.)
        console.error('[Interceptador - Falha de requisição]:', error.message);
        throw error; // Repassa o erro para quem chamou tratar
    }
}

// Função específica para fazer requisições POST
export async function postDados(url, dados) {
    // Chama a função request definindo método POST e passando os dados
    return await request(url, {
        method: 'POST',
        body: dados
    });
}

export async function putDados(url, dados) {
    // Chama a função request definindo método PUT e passando os dados
    return await request(url, {
        method: 'PUT',
        body: dados
    });
}

// Função específica para fazer requisições GET
export async function getDados(url) {
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response; // Retorna o objeto Response completo
    } catch (error) {
        console.error('Erro no getDados:', error);
        throw error;
    }
}

export async function deleteDados(url) {
    return await request(url, { method: 'DELETE' });
}
