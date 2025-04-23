const express = require('express');
const router = express.Router();
const controller = require('../controllers/controller');

/*---------------Get-----------------------*/
router.get('/', controller.home);
router.get('/contas_pagas', controller.getContasPagas); // Rota para contas pagas
router.get('/contas_pendentes', controller.getContasPendentes); // Rota para contas pendentes
router.get('/gerenciar_limite', controller.gerenciarLimite)

/*---------------Post----------------------*/
// Rota para adicionar nova conta
//router.post('/add', controller.add);
router.post('/form_conta', controller.addConta);
// Rota para marcar conta como paga
router.post('/marcar-paga', controller.paga); 
router.post('/salvar_limite', controller.salvarLimite)

//json
router.post('/dados_tab', controller.getDadosConta)
router.post('/limit_list', controller.getLimite)

module.exports = router;
