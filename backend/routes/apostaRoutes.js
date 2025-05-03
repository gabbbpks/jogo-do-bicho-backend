
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { create, getByField, getById, update, getAll } = require('../utils/dbHelper');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Create new bet
router.post('/criar', verifyToken, (req, res) => {
  try {
    const { userId, tipo, valor, modalidade, selecao, numeros } = req.body;
    
    // Validate user
    const user = getById('users', userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Validate balance
    if (user.saldo < valor) {
      return res.status(400).json({ message: 'Saldo insuficiente para realizar a aposta' });
    }
    
    // Validate bet based on type
    let betValid = true;
    let errorMessage = '';
    
    switch(tipo) {
      case 'milhar':
        if (!numeros || numeros.length !== 4) {
          betValid = false;
          errorMessage = 'Uma aposta de milhar precisa ter exatamente 4 números.';
        }
        break;
      case 'centena':
        if (!numeros || numeros.length !== 3) {
          betValid = false;
          errorMessage = 'Uma aposta de centena precisa ter exatamente 3 números.';
        }
        break;
      case 'dezena':
        if (!numeros || numeros.length !== 2) {
          betValid = false;
          errorMessage = 'Uma aposta de dezena precisa ter exatamente 2 números.';
        }
        break;
      case 'unidade':
        if (!numeros || numeros.length !== 1) {
          betValid = false;
          errorMessage = 'Uma aposta de unidade precisa ter exatamente 1 número.';
        }
        break;
      case 'terno-dezena':
        if (!numeros || numeros.length !== 3) {
          betValid = false;
          errorMessage = 'Uma aposta de terno-dezena precisa ter exatamente 3 números.';
        }
        break;
      case 'terno-grupo':
        if (!numeros || numeros.length !== 3) {
          betValid = false;
          errorMessage = 'Uma aposta de terno-grupo precisa ter exatamente 3 números (grupos).';
        }
        break;
      case 'duque-dezena':
        if (!numeros || numeros.length !== 2) {
          betValid = false;
          errorMessage = 'Uma aposta de duque-dezena precisa ter exatamente 2 números.';
        }
        break;
      case 'duque-grupo':
        if (!numeros || numeros.length !== 2) {
          betValid = false;
          errorMessage = 'Uma aposta de duque-grupo precisa ter exatamente 2 números (grupos).';
        }
        break;
      case 'dezena-fortuna':
        if (!numeros || numeros.length !== 1) {
          betValid = false;
          errorMessage = 'Uma aposta de dezena-fortuna precisa ter exatamente 1 número.';
        }
        break;
      case 'fazendinha':
        if (!numeros || numeros.length !== 1) {
          betValid = false;
          errorMessage = 'Uma aposta de fazendinha precisa ter exatamente 1 grupo.';
        }
        break;
    }
    
    if (!betValid) {
      return res.status(400).json({ message: errorMessage });
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
    
    // Update user balance
    const newBalance = user.saldo - valor;
    update('users', userId, { saldo: newBalance });
    
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
    
    // Validate user
    const user = getById('users', userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Get user bets
    const apostas = getByField('apostas', 'userId', userId);
    
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
    // Get all bets
    const apostas = getAll('apostas');
    
    // Sort by date (most recent first)
    apostas.sort((a, b) => new Date(b.data) - new Date(a.data));
    
    return res.status(200).json(apostas);
  } catch (error) {
    console.error('List all bets error:', error);
    return res.status(500).json({ message: 'Erro ao listar todas as apostas' });
  }
});

module.exports = router;
