// server.js
import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import session from 'express-session';
import ejs from 'ejs';
import cors from 'cors';
import router from './src/routers/routers.js';
import * as estrutura from './src/database/estrutura.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Carregando os certificados
const options = {
  key: fs.readFileSync(path.join(process.cwd(), 'cert', 'server.key')),
  cert: fs.readFileSync(path.join(process.cwd(), 'cert', 'server.cert'))
};

// Middleware para tratar JSON e formulários grandes
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Configuração de sessão
app.use(session({
  secret: 'keyboard cat',
  cookie: { maxAge: 10 * 60 * 1000 },
  resave: false,
  saveUninitialized: true
}));

// Configuração do EJS como template engine
app.engine('ejs', ejs.renderFile);
app.set('view engine', 'ejs');
app.use('/public', express.static(path.join(process.cwd(), 'public')));
app.set('views', path.join(process.cwd(), '/src/views'));
app.use(cors());

// Definição das rotas
app.use('/', router);

// Setup do banco de dados
(async () => {
  await estrutura.createDatabaseIfNotExists();
  await estrutura.createTablesIfNotExist();
})();

// Inicialização do servidor com verificação de porta
function startServer(port) {
  const server = http.createServer(app);

  server.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`A porta ${port} está ocupada, tentando a próxima disponível...`);
      if (port < 5050) {
        startServer(port + 1);
      } else {
        console.error("Não há portas disponíveis no intervalo definido.");
      }
    } else {
      console.error(`Erro ao iniciar o servidor: ${err.message}`);
    }
  });
}

startServer(PORT);
