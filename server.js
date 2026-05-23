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

const DEFAULT_PORT = 3100;
const parsedPort = Number(process.env.PORT);
const PORT = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : DEFAULT_PORT;

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
async function initialize() {
  try {
    console.log("🔄 Iniciando verificação do banco de dados...");
    await estrutura.createDatabaseIfNotExists();
    console.log("✔ Banco de dados verificado/criado");
    await estrutura.createTablesIfNotExist();
    console.log("✔ Tabelas verificadas/criadas");

    startServer(PORT);
  } catch (error) {
    console.error("❌ ERRO NA INICIALIZAÇÃO DO BANCO:", error);
    //process.exit(1); // Descomente se quiser encerrar o servidor em caso de erro
  }
}



// Inicialização do servidor com verificação de porta
function startServer(port) {
  const server = http.createServer(app);

  server.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `Porta ${port} já está em uso. Libere a porta ou defina PORT=${DEFAULT_PORT} no ambiente do servidor.`
      );
      process.exit(1);
    } else {
      console.error(`Erro ao iniciar o servidor: ${err.message}`);
      process.exit(1);
    }
  });
}

initialize().catch(err => {
  console.error("Falha crítica na inicialização:", err);
  process.exit(1);
});
