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

function dataAtualFormatada() {
    var data = new Date(),
        dia = data.getDate().toString().padStart(2, '0'),
        mes = (data.getMonth() + 1).toString().padStart(2, '0'), //+1 pois no getMonth Janeiro começa com zero.
        ano = data.getFullYear();
    return dia + "/" + mes + "/" + ano;
}

function formatDataBR(dta) {
    const date = new Date(dta);
    var formatedDate = date.toLocaleDateString({
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
    //console.log(formatedDate)
    return formatedDate;
}

function converterParaFormatoDate(valor) {
    if (!valor || typeof valor !== 'string') return '';
    
    const [dia, mes, ano] = valor.split('/');
    return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
}


module.exports = { formatarParaBRL, dataAtualFormatada, formatDataBR, converterParaFormatoDate };