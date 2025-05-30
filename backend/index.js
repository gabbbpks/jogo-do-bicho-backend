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
const PORT = process.env.PORT || 3000;

// Initialize db.json if it doesn't exist
const dbPath = path.join(__dirname, './data/db.json');
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify({ users: [], apostas: [], resultados: [], transacoes: [] }));
  console.log('Created new database file');
}

// Enhanced CORS configuration for Render deployment
app.use(cors({
  origin: '*', // Allow all origins
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

// Health check endpoint for Render
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

// Start server - optimized for Render
if (process.env.NODE_ENV === 'production') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} in production mode`);
  });
} else {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in development mode`);
  });
}

// Export for testing
module.exports = app;
