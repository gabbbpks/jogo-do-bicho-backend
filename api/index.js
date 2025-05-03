
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const apostaRoutes = require('./routes/apostaRoutes');
const resultadoRoutes = require('./routes/resultadoRoutes');
const pagamentoRoutes = require('./routes/pagamentoRoutes');
const { verifyToken } = require('./middleware/auth');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();

// Initialize db.json if it doesn't exist
const dbPath = path.join(__dirname, './data/db.json');
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify({ users: [], apostas: [], resultados: [], transacoes: [] }));
  console.log('Created new db.json file');
}

// Enhanced CORS configuration for Vercel deployment
app.use(cors({
  origin: '*', // This allows all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Bem-vindo à API do Jogo do Bicho!', status: 'online' });
});

// Health check endpoint for Vercel
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Routes
app.use('/auth', authRoutes);
app.use('/usuarios', userRoutes);
app.use('/apostas', apostaRoutes);
app.use('/resultados', resultadoRoutes);
app.use('/pagamentos', pagamentoRoutes);

// Custom 404 route
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

// Start server if not running in production (Vercel)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel serverless
module.exports = app;
