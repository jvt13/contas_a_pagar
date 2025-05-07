// script.js

const form_limite = document.getElementById("form-add-limite");

form_limite.addEventListener("input", function () {
    let valor = this.value.replace(/\D/g, ""); // remove tudo que não for número
    if (valor === "") return;

    valor = parseInt(valor, 10) / 100; // converte para decimal

    // Formata para moeda brasileira com separadores corretos
    this.value = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
});

// Remove o "R$" para envio ao backend
form_limite.addEventListener("blur", function () {
    //this.value = this.value.replace("R$ ", "");
    this.value = this.value.replace(/[R$\s.]/g, '') // remove "R$", espaços e pontos de milhar
        .replace(',', '.')      // troca vírgula por ponto
})