import * as model_users from '../database/models/query_users.js';
import { verifyPassword, hashPassword } from '../utils/auth.js';

export const autenticarLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await model_users.selectEmail(email);
        if (!user) return res.status(404).json({ success: false, mensagem: 'Usuário não encontrado' });

        const isValid = verifyPassword(password, user.salt, user.hash);
        if (!isValid) return res.status(401).json({ success: false, mensagem: 'Senha incorreta' });

        const chave = await model_users.findOrganizationById(user.organizacao_compartilhada);
        const id_chave = await model_users.findOrganizationByKey(chave);
        console.log('ChaveUserOrga: Id: ' + id_chave + ' - ' + chave)

        return res.json({
            success: true,
            data: {
                userId: user.id, key_share: chave, key_share_id: id_chave
            }, mensagem: `Usuário ${email} autenticado com sucesso!`
        });
    } catch (error) {
        console.error('Erro ao autenticar usuário:', error);
        return res.status(500).json({ success: false, mensagem: 'Erro ao autenticar usuário: ' + error.message });
    }
};

export const register = async (req, res) => {
    const { name, userName, email, password } = req.body;
    const userAgent = req.headers['user-agent'];
    const { salt, hash } = hashPassword(password);
    try {
        const result = await model_users.insert(name, userName, email, salt, hash, userAgent);
        const userId = result.id;

        const { id: orgId, chave } = await model_users.createOrganization();

        await model_users.updateUserOrganization(userId, orgId);

        return res.status(201).json({
            success: true,
            data: { userId, organizationId: orgId, organizationKey: chave }
        });

    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        return res.status(500).json({ success: false, mensagem: 'Erro ao registrar usuário: ' + error.message });
    }
};

export async function updateOrgaUser(req, res) {
    // Extrai userId e chave do body
    const { userId, key } = req.body;

    // Valida campos
    if (!userId) {
        return res.status(400).json({ success: false, message: 'Campo userId é obrigatório.' });
    }
    if (!key) {
        return res.status(400).json({ success: false, message: 'Campo chave é obrigatório.' });
    }

    try {
        // Busca org pelo chave
        const orgId = await model_users.findOrganizationByKey(key);
        if (!orgId) {
            return res.status(404).json({ success: false, message: 'Organização não encontrada para a chave informada.' });
        }

        // Atualiza o usuário
        const updatedUser = await model_users.updateUserSharedOrganization(userId, orgId);

        return res.json({
            success: true,
            message: 'Organização compartilhada atualizada com sucesso.',
            data: { organizationId: orgId, user: updatedUser }
        });
    } catch (err) {
        console.error('Erro ao atualizar org compartilhada:', err);
        return res.status(500).json({ success: false, message: 'Erro interno ao processar requisição.' });
    }
}