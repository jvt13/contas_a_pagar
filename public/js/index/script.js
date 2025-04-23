// script.js

// Função para alternar a exibição do menu
function toggleMenu() {
    const navbarNav = document.querySelector('.navbar-nav');
    navbarNav.classList.toggle('show'); // Alterna a classe 'show'
}

document.getElementById('abrirModal').onclick = function() {
    document.getElementById('modalGerenciarLimite').style.display = 'flex'; // Mostra o modal
};

document.getElementById('fecharModal').onclick = function() {
    document.getElementById('modalGerenciarLimite').style.display = 'none'; // Oculta o modal
};

// Fecha o modal se o usuário clicar fora da área do modal
window.onclick = function(event) {
    const modal = document.getElementById('modalGerenciarLimite');
    //const navbarNav = document.querySelector('.navbar-nav');


    if (event.target === modal) {
        modal.style.display = 'none';
    }

    /*if (event.target === navbarNav){
        navbarNav.classList.toggle('none');
    }*/
};
