
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { create, getByField, getById, update, getAll } = require('../utils/dbHelper');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Create new bet
router.post('/criar', verifyToken, (req, res) => {
  try {
    const { userId, tipo, valor, modalidade, selecao, numeros } = req.body;
    console.log(`Creating bet for user ${userId}, type: ${tipo}, value: ${valor}`);
    
    // Validate user
    const user = getById('users', userId);
    if (!user) {
      console.log(`User ${userId} not found`);
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Validate balance
    if (user.saldo < valor) {
      console.log(`Insufficient balance for user ${userId}: has ${user.saldo}, needs ${valor}`);
      return res.status(400).json({ message: 'Saldo insuficiente para realizar a aposta' });
    }
    
    // Calculate odds and potential winnings based on bet type
    let odds = 1;
    
    switch(tipo) {
      case 'milhar':
        odds = 5000;
        break;
      case 'centena':
        odds = 600;
        break;
      case 'dezena':
        odds = 60;
        break;
      case 'unidade':
        odds = 6;
        break;
      case 'terno-dezena':
        odds = 8000;
        break;
      case 'terno-grupo':
        odds = 100;
        break;
      case 'duque-dezena':
        odds = 300;
        break;
      case 'duque-grupo':
        odds = 15;
        break;
      case 'dezena-fortuna':
        odds = 40000;
        break;
      case 'fazendinha':
        odds = 16;
        break;
      case 'bicho':
        odds = 18;
        break;
    }
    
    const potentialWin = valor * odds;
    
    // Create the bet
    const newBet = {
      id: uuidv4(),
      userId,
      tipo,
      valor,
      modalidade: modalidade || tipo, // Use tipo as default if modalidade not provided
      selecao: selecao || {},
      numeros: numeros || [],
      data: new Date().toISOString(),
      status: 'pendente',
      resultado: null,
      odds: odds,
      potentialWin: potentialWin
    };
    
    const bet = create('apostas', newBet);
    console.log(`Bet created with ID: ${bet.id}`);
    
    // Update user balance
    const newBalance = user.saldo - valor;
    update('users', userId, { saldo: newBalance });
    console.log(`User ${userId} balance updated from ${user.saldo} to ${newBalance}`);
    
    return res.status(201).json({ 
      message: 'Aposta realizada com sucesso', 
      aposta: bet
    });
  } catch (error) {
    console.error('Create bet error:', error);
    return res.status(500).json({ message: 'Erro ao criar aposta' });
  }
});

// List user bets
router.get('/listar/:userId', (req, res) => {
  try {
    const userId = req.params.userId;
    console.log(`Listing bets for user: ${userId}`);
    
    // Validate user
    const user = getById('users', userId);
    if (!user) {
      console.log(`User ${userId} not found`);
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Get user bets
    const apostas = getByField('apostas', 'userId', userId);
    console.log(`Found ${apostas.length} bets for user ${userId}`);
    
    // Sort by date (most recent first)
    apostas.sort((a, b) => new Date(b.data) - new Date(a.data));
    
    return res.status(200).json(apostas);
  } catch (error) {
    console.error('List bets error:', error);
    return res.status(500).json({ message: 'Erro ao listar apostas' });
  }
});

// List all bets (for admin)
router.get('/listar', verifyToken, (req, res) => {
  try {
    console.log('Listing all bets (admin request)');
    
    // Get all bets
    const apostas = getAll('apostas');
    console.log(`Found ${apostas.length} total bets`);
    
    // Sort by date (most recent first)
    apostas.sort((a, b) => new Date(b.data) - new Date(a.data));
    
    return res.status(200).json(apostas);
  } catch (error) {
    console.error('List all bets error:', error);
    return res.status(500).json({ message: 'Erro ao listar todas as apostas' });
  }
});

module.exports = router;
