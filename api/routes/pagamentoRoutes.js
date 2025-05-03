
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { create, getById, getByField, update } = require('../utils/dbHelper');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Generate PIX payment
router.post('/gerar-pix', verifyToken, (req, res) => {
  try {
    const { valor, userId, nome, sobrenome, email, cpf, telefone, cupom } = req.body;
    console.log(`Generating PIX payment for user ${userId}, amount: ${valor}`);
    
    if (!valor || isNaN(valor) || valor <= 0) {
      console.log(`Invalid amount: ${valor}`);
      return res.status(400).json({ message: 'Valor inválido' });
    }
    
    // Validate user
    const user = getById('users', userId);
    if (!user) {
      console.log(`User ${userId} not found`);
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Apply discount code if provided
    let valorFinal = parseFloat(valor);
    let descontoAplicado = false;
    
    if (cupom) {
      // Simple coupon logic for demonstration
      if (cupom === 'PROMO10') {
        valorFinal = valorFinal * 0.9; // 10% off
        descontoAplicado = true;
        console.log(`Discount applied: ${cupom}, new amount: ${valorFinal}`);
      }
    }
    
    // Generate fake PIX data
    const pixCode = `00020126580014br.gov.bcb.pix0136${uuidv4()}5204000053039865406${valorFinal}5802BR5913Jogo do Bicho6008Sao Paulo62070503***63048D4E`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixCode)}`;
    
    // Create transaction record
    const transacao = {
      id: uuidv4(),
      userId,
      tipo: 'deposito',
      metodo: 'pix',
      valor: valorFinal,
      status: 'pendente',
      dataCriacao: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString(),
      detalhes: {
        pixCode,
        qrCodeUrl,
        nome,
        sobrenome,
        email,
        cpf,
        telefone,
        cupom: descontoAplicado ? cupom : null
      }
    };
    
    create('transacoes', transacao);
    console.log(`PIX transaction created with ID: ${transacao.id}`);
    
    return res.status(200).json({
      message: 'PIX gerado com sucesso',
      pixCode,
      qrCodeUrl,
      valor: valorFinal,
      transacaoId: transacao.id
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
    console.log(`Processing withdrawal request for user ${userId}, amount: ${valor}`);
    
    if (!valor || isNaN(valor) || valor <= 0) {
      console.log(`Invalid amount: ${valor}`);
      return res.status(400).json({ message: 'Valor inválido' });
    }
    
    if (!chavePix) {
      console.log('No PIX key provided');
      return res.status(400).json({ message: 'Chave PIX é obrigatória' });
    }
    
    // Validate user
    const user = getById('users', userId);
    if (!user) {
      console.log(`User ${userId} not found`);
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Check if user has enough balance
    if (user.saldo < valor) {
      console.log(`Insufficient balance: has ${user.saldo}, requested ${valor}`);
      return res.status(400).json({ message: 'Saldo insuficiente' });
    }
    
    // Create withdrawal transaction
    const transacao = {
      id: uuidv4(),
      userId,
      tipo: 'saque',
      metodo: 'pix',
      valor: parseFloat(valor),
      status: 'pendente',
      dataCriacao: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString(),
      detalhes: {
        chavePix,
        nome,
        sobrenome,
        cpf
      }
    };
    
    create('transacoes', transacao);
    console.log(`Withdrawal transaction created with ID: ${transacao.id}`);
    
    // Update user balance
    const newBalance = user.saldo - parseFloat(valor);
    update('users', userId, { saldo: newBalance });
    console.log(`User ${userId} balance updated from ${user.saldo} to ${newBalance} (withdrawal)`);
    
    return res.status(200).json({
      message: 'Solicitação de saque realizada com sucesso',
      transacaoId: transacao.id,
      novoSaldo: newBalance
    });
  } catch (error) {
    console.error('Request withdrawal error:', error);
    return res.status(500).json({ message: 'Erro ao solicitar saque' });
  }
});

// List user transactions
router.get('/transacoes/:userId', verifyToken, (req, res) => {
  try {
    const userId = req.params.userId;
    console.log(`Listing transactions for user: ${userId}`);
    
    // Check if request is made by the same user
    if (req.user.id !== userId) {
      console.log(`Unauthorized access: User ${req.user.id} tried to access ${userId}'s transactions`);
      return res.status(403).json({ message: 'Acesso não autorizado' });
    }
    
    // Validate user
    const user = getById('users', userId);
    if (!user) {
      console.log(`User ${userId} not found`);
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Get user transactions
    const transacoes = getByField('transacoes', 'userId', userId);
    console.log(`Found ${transacoes.length} transactions for user ${userId}`);
    
    // Sort by date (most recent first)
    transacoes.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));
    
    return res.status(200).json(transacoes);
  } catch (error) {
    console.error('List transactions error:', error);
    return res.status(500).json({ message: 'Erro ao listar transações' });
  }
});

// Mock endpoint to simulate PIX payment confirmation
router.post('/confirmar-deposito/:transacaoId', (req, res) => {
  try {
    const transacaoId = req.params.transacaoId;
    console.log(`Confirming deposit for transaction: ${transacaoId}`);
    
    // Get the transaction
    const db = require('../utils/dbHelper').readDB();
    const transacao = db.transacoes.find(t => t.id === transacaoId);
    
    if (!transacao) {
      console.log(`Transaction ${transacaoId} not found`);
      return res.status(404).json({ message: 'Transação não encontrada' });
    }
    
    if (transacao.status !== 'pendente') {
      console.log(`Transaction ${transacaoId} is not pending (status: ${transacao.status})`);
      return res.status(400).json({ message: 'Transação já processada' });
    }
    
    // Update transaction
    const transacoesAtualizadas = db.transacoes.map(t => {
      if (t.id === transacaoId) {
        return {
          ...t,
          status: 'concluido',
          dataAtualizacao: new Date().toISOString()
        };
      }
      return t;
    });
    
    // Update user balance
    const usuario = db.users.find(u => u.id === transacao.userId);
    if (!usuario) {
      console.log(`User ${transacao.userId} not found`);
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    const usuariosAtualizados = db.users.map(u => {
      if (u.id === transacao.userId) {
        const novoSaldo = u.saldo + transacao.valor;
        console.log(`User ${u.id} balance updated from ${u.saldo} to ${novoSaldo} (deposit confirmed)`);
        return { ...u, saldo: novoSaldo };
      }
      return u;
    });
    
    // Update database
    db.transacoes = transacoesAtualizadas;
    db.users = usuariosAtualizados;
    require('../utils/dbHelper').writeDB(db);
    
    console.log(`Deposit confirmed for transaction ${transacaoId}`);
    return res.status(200).json({
      message: 'Depósito confirmado com sucesso',
      transacao: transacoesAtualizadas.find(t => t.id === transacaoId)
    });
  } catch (error) {
    console.error('Confirm deposit error:', error);
    return res.status(500).json({ message: 'Erro ao confirmar depósito' });
  }
});

module.exports = router;
