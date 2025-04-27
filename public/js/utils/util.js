function abrirModal(nome){
    document.getElementById(nome).style.display = 'flex'; // Mostra o modal
}

function fecharModal(nome){
    document.getElementById(nome).style.display = 'none'; // Oculta o modal
}

//Mensagem toast
window.showToast = function(mensagem = 'Ação realizada com sucesso!') {
    const toast = document.getElementById("toast");
    toast.textContent = mensagem;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000); // 3 segundos
}
/*function showToast(mensagem = 'Ação realizada com sucesso!') {
    const toast = document.getElementById("toast");
    toast.textContent = mensagem;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000); // 3 segundos
}*/