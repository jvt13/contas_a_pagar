async function formatarParaBRL(valor) {
    // Converte para número de forma segura
    const numero = Number(valor);

    console.log("---------------------------"+ isNaN(numero)+ " " + numero)
    // Se não for um número válido, retorna 'R$ 0,00'
    if (isNaN(numero)) {
        console.warn(`Valor inválido para formatar:`, valor);
        return 'R$ 0,00';
    }

    console.log("Valor formatado: " + numero)
    // Formata para o padrão brasileiro de moeda
    return numero.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}



module.exports = { formatarParaBRL };