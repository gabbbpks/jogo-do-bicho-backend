
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { create, getByField, getById, update } = require('../utils/dbHelper');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Generate PIX payment
router.post('/gerar-pix', verifyToken, (req, res) => {
  try {
    const { valor, userId, nome, sobrenome, email, cpf, telefone, cupom } = req.body;
    
    if (!valor || !userId || !nome || !email) {
      return res.status(400).json({ message: 'Dados incompletos para gerar PIX' });
    }
    
    // Check if user exists
    const user = getById('users', userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Calculate discount if cupom
    let valorFinal = valor;
    let descontoAplicado = false;
    
    if (cupom) {
      // Simple cupom validation - in a real app would check against a cupoms collection
      if (cupom === 'BEMVINDO10') {
        valorFinal = valor * 0.9; // 10% discount
        descontoAplicado = true;
      }
    }
    
    // Create transaction record
    const transacao = {
      id: uuidv4(),
      tipo: 'deposito',
      metodo: 'pix',
      status: 'pendente',
      valor: valorFinal,
      valorOriginal: valor,
      descontoAplicado,
      userId,
      data: new Date().toISOString(),
      dadosPagamento: {
        nome,
        sobrenome: sobrenome || '',
        email,
        cpf: cpf || '',
        telefone: telefone || ''
      },
      pixData: {
        qrCodeBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAQMAAABmvDolAAAABlBMVEX///8AAABVwtN+AAABG0lEQVR42uyYMY7EIAxFP1JapFxxRS6RG+USuUKkNJZ/YUuTbDQ7s6NSXNgyMnngfxnIHQ542LJjjlJK7M7H7qz8dpfunRxrASJyEUttJBVlt7QOIADBUgBFxF1+jYg7FvKYOIXIUYQs2THVBz4BKO576M7KFa6V94yDP+3ACEAADr5GfttYl3zhLt9yeE/8+iQeWEf4FEDvCLDCzBGBe7jBd8z6wp0aAQjA3Bchch7ETozu7wYZFhGm0IQFAgABeMo+KXIaZBw6ySTykLlJzCIGAhCAf8RwJ0VJLTEre6fdlGQokuxiZ0oiAMFyA+5ES7QlJabtxNqMCcRwb/ne2KEAAtCl/jNPbxQRfvnFm7aTnr3wCEAAhpkUw7YdvsGHAMD9MSzWAAAAAElFTkSuQmCC',
        chave: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6',
        valor: valorFinal.toFixed(2)
      }
    };
    
    // Save transaction
    create('transacoes', transacao);
    
    return res.status(201).json({
      message: 'PIX gerado com sucesso',
      transacao
    });
  } catch (error) {
    console.error('Generate PIX error:', error);
    return res.status(500).json({ message: 'Erro ao gerar PIX' });
  }
});

// Request withdrawal
router.post('/solicitar-saque', verifyToken, (req, res) => {
  try {
    const { valor, userId, chavePix, nome, sobrenome, cpf } = req.body;
    
    if (!valor || !userId || !chavePix || !nome) {
      return res.status(400).json({ message: 'Dados incompletos para solicitar saque' });
    }
    
    // Check if user exists
    const user = getById('users', userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Check if user has enough balance
    if (user.saldo < valor) {
      return res.status(400).json({ message: 'Saldo insuficiente para realizar o saque' });
    }
    
    // Create withdrawal transaction
    const transacao = {
      id: uuidv4(),
      tipo: 'saque',
      metodo: 'pix',
      status: 'pendente',
      valor,
      userId,
      data: new Date().toISOString(),
      dadosPagamento: {
        nome,
        sobrenome: sobrenome || '',
        cpf: cpf || '',
        chavePix
      }
    };
    
    // Save transaction
    create('transacoes', transacao);
    
    // Update user balance
    const novoSaldo = user.saldo - valor;
    update('users', userId, { saldo: novoSaldo });
    
    return res.status(201).json({
      message: 'Solicitação de saque enviada com sucesso',
      transacao
    });
  } catch (error) {
    console.error('Withdrawal request error:', error);
    return res.status(500).json({ message: 'Erro ao solicitar saque' });
  }
});

// List transactions
router.get('/transacoes/:userId', verifyToken, (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Check if user exists
    const user = getById('users', userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Get user transactions
    const transacoes = getByField('transacoes', 'userId', userId);
    
    // Sort transactions by date (most recent first)
    transacoes.sort((a, b) => new Date(b.data) - new Date(a.data));
    
    return res.status(200).json(transacoes);
  } catch (error) {
    console.error('List transactions error:', error);
    return res.status(500).json({ message: 'Erro ao listar transações' });
  }
});

// Process a deposit (simulate payment received)
router.post('/processar-deposito/:transacaoId', verifyToken, (req, res) => {
  try {
    const transacaoId = req.params.transacaoId;
    
    // Find transaction
    const db = require('../utils/dbHelper').readDB();
    const transacaoIndex = db.transacoes.findIndex(t => t.id === transacaoId);
    
    if (transacaoIndex === -1) {
      return res.status(404).json({ message: 'Transação não encontrada' });
    }
    
    const transacao = db.transacoes[transacaoIndex];
    
    // Check if it's a deposit and if it's still pending
    if (transacao.tipo !== 'deposito' || transacao.status !== 'pendente') {
      return res.status(400).json({ 
        message: 'Esta transação não é um depósito pendente'
      });
    }
    
    // Update transaction status
    db.transacoes[transacaoIndex].status = 'concluido';
    db.transacoes[transacaoIndex].dataProcessamento = new Date().toISOString();
    
    // Add to user's balance
    const userIndex = db.users.findIndex(u => u.id === transacao.userId);
    
    if (userIndex !== -1) {
      db.users[userIndex].saldo = (db.users[userIndex].saldo || 0) + transacao.valor;
    }
    
    // Save changes to DB
    require('../utils/dbHelper').writeDB(db);
    
    return res.status(200).json({
      message: 'Depósito processado com sucesso',
      transacao: db.transacoes[transacaoIndex]
    });
  } catch (error) {
    console.error('Process deposit error:', error);
    return res.status(500).json({ message: 'Erro ao processar depósito' });
  }
});

module.exports = router;
