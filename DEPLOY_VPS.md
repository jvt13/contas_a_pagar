# Deploy do backend no VPS — roteiro validado

Documentação do procedimento que funcionou em produção (servidor `srv1622327`).

| Item | Valor |
|------|--------|
| Pasta | `/var/www/contas_a_pagar` |
| Repositório | `https://github.com/jvt13/contas_a_pagar.git` |
| Branch | `blackboxai/pr-git-sync` |
| Porta | **3100** |
| API pública | `https://api-contas.srv-jvt.com` |
| Process manager | PM2 (`contas-api`) |

---

## 1. Limpar PM2 antigo

Remover entradas quebradas (status `online` com `pid N/A` não serve):

```bash
pm2 delete api-contas
pm2 delete contas-api
pm2 save
pm2 list
```

---

## 2. Remover pasta e clonar de novo

```bash
cd /var/www
rm -rf contas_a_pagar
git clone https://github.com/jvt13/contas_a_pagar.git contas_a_pagar
cd /var/www/contas_a_pagar
pwd
```

---

## 3. Branch e dependências

```bash
git fetch origin
git checkout blackboxai/pr-git-sync
git pull origin blackboxai/pr-git-sync
npm install
```

---

## 4. Certificados (obrigatório)

O `server.js` lê `cert/server.key` e `cert/server.cert` na subida (mesmo rodando HTTP):

```bash
mkdir -p cert
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout cert/server.key \
  -out cert/server.cert \
  -days 3650 -subj "/CN=localhost"
ls -la cert/
```

---

## 5. Arquivo `.env`

```bash
echo "PORT=3100" > .env
cat .env
```

---

## 6. PostgreSQL

### Credenciais usadas pelo app (`src/database/conexao.js`)

| Campo | Valor |
|-------|--------|
| user | `postgres` |
| password | `4053` |
| database | `contas_a_pagar` |
| host | `localhost` |
| port | `5432` |

### Teste correto (não usar `psql -U postgres` como root)

Como **root**, `psql -U postgres` falha com `Peer authentication failed` — isso é normal.

**Opção A — TCP com senha (igual ao Node.js):**

```bash
PGPASSWORD=4053 psql -U postgres -h 127.0.0.1 -d contas_a_pagar -c "SELECT 1;"
```

**Opção B — usuário OS postgres:**

```bash
su - postgres -c "psql -d contas_a_pagar -c 'SELECT 1;'"
```

Se a senha estiver errada:

```bash
su - postgres -c "psql -c \"ALTER USER postgres PASSWORD '4053';\""
```

Se o banco não existir:

```bash
su - postgres -c "psql -c \"CREATE DATABASE contas_a_pagar;\""
```

---

## 7. Migration de parcelamento

```bash
npm run migrate:parcelamento
```

---

## 8. Teste manual (validado ✅)

Terminal 1:

```bash
cd /var/www/contas_a_pagar
PORT=3100 node server.js
```

Saída esperada:

```
🔄 Iniciando verificação do banco de dados...
✔ Banco de dados verificado/criado
✔ Tabelas verificadas/criadas
Servidor rodando na porta 3100
```

Terminal 2:

```bash
curl -s http://127.0.0.1:3100/
curl -s -X POST http://127.0.0.1:3100/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Client: mobile" \
  -d '{"email":"SEU_EMAIL","password":"SUA_SENHA"}'
```

### Sobre o retorno do `curl` em `/`

`GET http://127.0.0.1:3100/` retorna **HTML** (página web EJS do backend — formulários, scripts, toast "Dados inseridos com sucesso!", etc.). **Isso é esperado e significa que a API está no ar.**

Para JSON de saúde (se a rota existir na branch):

```bash
curl -s http://127.0.0.1:3100/health
```

Login mobile deve retornar JSON (`success: true` ou 401/404), não HTML.

Parar teste manual: **Ctrl+C** no terminal 1.

---

## 9. PM2 (permanente)

Garantir que nenhum `node server.js` manual está rodando (Ctrl+C ou liberar porta 3100).

```bash
cd /var/www/contas_a_pagar

PORT=3100 pm2 start server.js --name contas-api --cwd /var/www/contas_a_pagar

pm2 save
pm2 list
pm2 logs contas-api --lines 30
```

Em `pm2 list`, `contas-api` deve ter **pid numérico** (não `N/A`) e status **online**.

### Reiniciar após reboot do servidor

```bash
pm2 startup
# executar o comando que o PM2 imprimir
pm2 save
```

### Comandos úteis

| Ação | Comando |
|------|---------|
| Logs | `pm2 logs contas-api` |
| Reiniciar | `pm2 restart contas-api` |
| Parar | `pm2 stop contas-api` |
| Status | `pm2 list` |

---

## 10. Validar produção

No servidor:

```bash
ss -tlnp | grep 3100
curl -s http://127.0.0.1:3100/
```

No PC ou celular:

```bash
curl -s https://api-contas.srv-jvt.com/
```

Deve retornar HTML (não `502`). Testar login no **APK** com API `https://api-contas.srv-jvt.com`.

---

## 11. Atualizar código no futuro

```bash
cd /var/www/contas_a_pagar
git pull origin blackboxai/pr-git-sync
npm install
npm run migrate:parcelamento
pm2 restart contas-api
pm2 logs contas-api --lines 10
```

---

## Erros comuns

| Sintoma | Causa | Solução |
|---------|--------|---------|
| `Peer authentication failed` | `psql` como root via socket | Usar `-h 127.0.0.1` + `PGPASSWORD` ou `su - postgres` |
| `ENOENT cert/server.key` | Pasta `cert/` ausente | Refazer passo 4 |
| `HTTP 000` / connection refused | Node parado | `node server.js` ou `pm2 restart contas-api` |
| PM2 `online`, pid `N/A` | Entrada PM2 quebrada | `pm2 delete` + subir de novo (passo 9) |
| `502` em `api-contas.srv-jvt.com` | Proxy sem upstream na 3100 | Subir Node + conferir nginx/Cloudflare → `127.0.0.1:3100` |
| `curl /` retorna HTML longo | Rota raiz é a interface web | **Normal** — API REST usa `/auth/login`, `/form_conta`, etc. |

---

## Checklist

- [ ] PM2 sem entradas quebradas (`api-contas` antigo removido)
- [ ] Clone em `/var/www/contas_a_pagar`
- [ ] Branch `blackboxai/pr-git-sync`
- [ ] `npm install`
- [ ] `cert/` criado
- [ ] `.env` com `PORT=3100`
- [ ] PostgreSQL responde (`SELECT 1`)
- [ ] `npm run migrate:parcelamento`
- [ ] `node server.js` sobe sem erro
- [ ] `curl localhost:3100` retorna HTML (OK)
- [ ] PM2 `contas-api` com pid real
- [ ] `https://api-contas.srv-jvt.com` sem 502
- [ ] APK conecta e faz login

---

*Última validação: deploy do zero no VPS + teste manual + APK conectando em produção.*
