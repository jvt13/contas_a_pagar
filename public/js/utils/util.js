// Fecha o modal se o usuário clicar fora da área do modal
document.addEventListener('click', function (event) {
    // Se o clique foi em um botão de fechar ou dentro do conteúdo do modal, não faz nada
    if (event.target.classList.contains('close') ||
        event.target.closest('.modal-content-style')) {
        return;
    }

    const classe = event.target.classList;

    if (classe.length > 0) { // Verifica se há classes
        console.log("Trata clique: " + classe);

        // Itera sobre todas as classes do elemento clicado
        classe.forEach(className => {
            const modais = document.querySelectorAll('.' + className); // Seleciona todos os elementos com a classe

            modais.forEach(modal => {
                if (modal.style.display === 'block' || modal.style.display === 'flex') { // Verifica se o modal está visível
                    fecharModal(modal.id); // Fecha o modal
                }
            });
        });
    }
});

// Função para alternar a exibição do menu
export function toggleMenu() {
    const menu = document.querySelector('.navbar-nav');
    const toggle = document.getElementById('menuToggle');

    // Alterna a classe para mostrar/ocultar o menu
    menu.classList.toggle('show');

    // Alterna a classe para mudar o ícone para X
    toggle.classList.toggle('open');

    // Se o menu foi aberto, escuta clique fora
    if (menu.classList.contains('show')) {
        document.addEventListener('click', handleClickOutsideMenu);
    } else {
        document.removeEventListener('click', handleClickOutsideMenu);
    }
}

function handleClickOutsideMenu(event) {
    const menu = document.querySelector('.navbar-nav');
    const toggle = document.getElementById('menuToggle');
    const navbar = document.querySelector('.navbar');

    if (!navbar.contains(event.target)) {
        // Clicou fora do menu
        menu.classList.remove('show');
        toggle.classList.remove('open');
        document.removeEventListener('click', handleClickOutsideMenu);
    }
}

export function abrirModal(nome) {
    console.log('Abrindo modal - ' + nome);
    document.getElementById(nome).style.display = 'flex'; // Mostra o modal
}

export function fecharModal(nome) {
    document.getElementById(nome).style.display = 'none'; // Oculta o modal
}

//Mensagem toast
export function showToast(mensagem = 'Ação realizada com sucesso!') {
    const toast = document.getElementById("toast");
    toast.textContent = mensagem;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000); // 3 segundos
}