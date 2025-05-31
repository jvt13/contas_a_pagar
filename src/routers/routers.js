// src/routers/routers.js
import express from 'express';
import * as controller from '../controllers/controller.js';
import * as userController from '../controllers/userController.js';

const router = express.Router();

/*---------------Get-----------------------*/
router.get('/', controller.getContas);
router.get('/contas_pagas', controller.getContasPagas);
router.get('/contas_pendentes', controller.getContasPendentes);
router.get('/gerenciar_limite', controller.gerenciarLimite);
router.get('/get_conta_id/:id', controller.getContaID);
router.post('/get_cartoes', controller.getCartoes);
router.get('/get_cartoes', controller.getCartoes);
router.get('/get_cartao_id/:id', controller.getCartaoID);

/*---------------Post----------------------*/
router.post('/form_conta', controller.addConta);
router.post('/form_conta/editar', controller.updateConta);
router.post('/marcar-paga', controller.alteraStatusConta);
router.post('/salvar_limite', controller.salvarLimite);
router.put('/salvar_limite', controller.salvarLimite);
router.post('/add_cartao', controller.addCartao);
router.put('/update_cartao/:id', controller.updateCartao);

/*--------- Organization ---------------- */
router.post('/user/organization/share', userController.updateOrgaUser);
/*----- Usuarios ----- */
router.post('/auth/login', userController.autenticarLogin);
router.post('/auth/register', userController.register);

/*---------------Delete-------------------*/
router.delete('/delete_conta/:id', controller.excluirConta);
router.delete('/delete_cartao/:id', controller.excluirCartao);

/*---------- JSON endpoints -------------*/
router.post('/dados_tab', controller.getDadosConta);
router.post('/limit_list', controller.getLimite);

export default router;
