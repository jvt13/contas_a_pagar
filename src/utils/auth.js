// src/utils/auth.js
import crypto from 'crypto';

const saltLength = 16;
const iterations = 100000;
const keyLength = 64;
const digest = 'sha512';

/**
 * Gera um hash de senha com PBKDF2.
 * @param {string} password - Senha em texto plano.
 * @returns {{ salt: string, hash: string }} Objeto contendo o salt e o hash.
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(saltLength).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, iterations, keyLength, digest).toString('hex');
  return { salt, hash };
}

/**
 * Verifica se a senha fornecida corresponde ao hash.
 * @param {string} password - Senha em texto plano.
 * @param {string} salt - Salt usado na geração do hash original.
 * @param {string} hash - Hash original para comparação.
 * @returns {boolean} True se válido, false caso contrário.
 */
export function verifyPassword(password, salt, hash) {
  const hashToVerify = crypto.pbkdf2Sync(password, salt, iterations, keyLength, digest).toString('hex');
  return hash === hashToVerify;
}
