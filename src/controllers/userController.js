import * as model_users from '../database/models/query_users.js';
import { verifyPassword, hashPassword } from '../utils/auth.js';

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