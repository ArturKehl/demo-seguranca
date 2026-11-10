// ============================================================
// APLICACAO EXPRESS - 5 camadas de seguranca + login
// ============================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const { securityHeaders, apiLimiter, loginLimiter } = require('./middlewares/security');

const app = express();

// 1) Security Headers
app.use(securityHeaders);

// CORS
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 2) Rate Limiting global
app.use('/api', apiLimiter);

// Frontend estatico
app.use(express.static(path.join(__dirname, '..', 'public')));

// ============================================================
// SESSAO (simples, em memoria - para demonstracao)
// ============================================================
const sessoes = new Map();

// Usuarios de demonstracao
const USUARIOS = [
  { id: 1, nome: 'Professor Demo', email: 'professor@demo.com', senha: 'prof123', tipo: 'professor' },
  { id: 2, nome: 'Aluno Demo', email: 'aluno@demo.com', senha: 'aluno123', tipo: 'aluno' }
];

// ============================================================
// MIDDLEWARE DE AUTENTICACAO
// ============================================================
function autenticar(req, res, next) {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token || !sessoes.has(token)) {
    return res.status(401).json({ erro: 'Nao autenticado' });
  }
  req.usuario = sessoes.get(token);
  next();
}

// ============================================================
// ROTAS DE AUTENTICACAO
// ============================================================

// Login (com rate limit rigoroso)
app.post('/api/auth/login', loginLimiter, (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Email e senha obrigatorios' });
  }

  const emailLimpo = String(email).trim().toLowerCase();
  const usuario = USUARIOS.find(u => u.email === emailLimpo && u.senha === senha);

  if (!usuario) {
    return res.status(401).json({ erro: 'Email ou senha incorretos' });
  }

  // Gerar token
  const token = require('crypto').randomBytes(32).toString('hex');
  const dadosSessao = { id: usuario.id, nome: usuario.nome, email: usuario.email, tipo: usuario.tipo };
  sessoes.set(token, dadosSessao);

  console.log('[AUTH] Login OK:', usuario.email, '| Tipo:', usuario.tipo);

  res.json({
    mensagem: 'Login realizado!',
    token,
    usuario: dadosSessao
  });
});

// Logout
app.post('/api/auth/logout', autenticar, (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (token) sessoes.delete(token);
  res.json({ mensagem: 'Logout realizado' });
});

// Perfil (rota protegida)
app.get('/api/auth/perfil', autenticar, (req, res) => {
  res.json({ usuario: req.usuario });
});

// ============================================================
// ROTAS PUBLICAS
// ============================================================
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', ambiente: process.env.NODE_ENV || 'development' });
});

app.get('/api/erro', (req, res) => { throw new Error('Erro simulado'); });

// Dashboard (protegida)
app.get('/api/dashboard', autenticar, (req, res) => {
  res.json({
    mensagem: 'Bem-vindo ao dashboard!',
    usuario: req.usuario,
    estatisticas: {
      pontos: 1500,
      nivel: 3,
      quizzes: 8,
      conquistas: 5
    }
  });
});

// 404
app.use((req, res) => res.status(404).json({ erro: 'Rota nao encontrada' }));

// 4) Tratamento centralizado de erros
app.use((err, req, res, next) => {
  console.error('[ERRO]', err.message);
  if (process.env.NODE_ENV !== 'production') console.error(err.stack);

  const isProd = process.env.NODE_ENV === 'production';
  res.status(err.statusCode || 500).json({
    erro: isProd ? 'Erro interno do servidor' : err.message,
    ...(isProd ? {} : { stack: err.stack })
  });
});

module.exports = app;
