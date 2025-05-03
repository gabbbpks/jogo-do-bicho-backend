
const express = require('express');
const { getById, update } = require('../utils/dbHelper');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get user balance
router.get('/saldo/:userId', verifyToken, (req, res) => {
  try {
    const userId = req.params.userId;
    console.log(`Getting balance for user: ${userId}`);
    
    const user = getById('users', userId);
    
    if (!user) {
      console.log(`User ${userId} not found`);
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    console.log(`Balance for user ${userId}: ${user.saldo}`);
    return res.status(200).json({ saldo: user.saldo });
  } catch (error) {
    console.error('Get balance error:', error);
    return res.status(500).json({ message: 'Erro ao buscar saldo' });
  }
});

// Get user profile
router.get('/:userId', verifyToken, (req, res) => {
  try {
    const userId = req.params.userId;
    console.log(`Getting profile for user: ${userId}`);
    
    // Check if requesting user is the same as the profile being requested
    if (req.user.id !== userId) {
      console.log(`Unauthorized access: User ${req.user.id} tried to access ${userId}'s profile`);
      return res.status(403).json({ message: 'Acesso não autorizado' });
    }
    
    const user = getById('users', userId);
    
    if (!user) {
      console.log(`User ${userId} not found`);
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Remove password from response
    const { senha, ...userData } = user;
    
    console.log(`Profile retrieved for user ${userId}`);
    return res.status(200).json(userData);
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ message: 'Erro ao buscar perfil' });
  }
});

// Update user profile
router.put('/:userId', verifyToken, (req, res) => {
  try {
    const userId = req.params.userId;
    console.log(`Updating profile for user: ${userId}`);
    
    // Check if requesting user is the same as the profile being updated
    if (req.user.id !== userId) {
      console.log(`Unauthorized access: User ${req.user.id} tried to update ${userId}'s profile`);
      return res.status(403).json({ message: 'Acesso não autorizado' });
    }
    
    const user = getById('users', userId);
    
    if (!user) {
      console.log(`User ${userId} not found`);
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Remove fields that should not be updated directly
    const { senha, id, dataCriacao, saldo, ...updateData } = req.body;
    
    // Update last access
    updateData.ultimoAcesso = new Date().toISOString();
    
    const updatedUser = update('users', userId, updateData);
    
    if (!updatedUser) {
      console.log(`Failed to update user ${userId}`);
      return res.status(500).json({ message: 'Erro ao atualizar perfil' });
    }
    
    // Remove password from response
    const { senha: _, ...userData } = updatedUser;
    
    console.log(`Profile updated for user ${userId}`);
    return res.status(200).json({
      message: 'Perfil atualizado com sucesso',
      user: userData
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Erro ao atualizar perfil' });
  }
});

// Add money to user balance (for testing purposes)
router.post('/adicionar-saldo/:userId', verifyToken, (req, res) => {
  try {
    const userId = req.params.userId;
    const { valor } = req.body;
    console.log(`Adding ${valor} to balance for user: ${userId}`);
    
    if (!valor || isNaN(valor) || valor <= 0) {
      console.log(`Invalid amount: ${valor}`);
      return res.status(400).json({ message: 'Valor inválido' });
    }
    
    const user = getById('users', userId);
    
    if (!user) {
      console.log(`User ${userId} not found`);
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    const newBalance = user.saldo + parseFloat(valor);
    const updatedUser = update('users', userId, { saldo: newBalance });
    
    if (!updatedUser) {
      console.log(`Failed to update balance for user ${userId}`);
      return res.status(500).json({ message: 'Erro ao adicionar saldo' });
    }
    
    console.log(`Balance updated for user ${userId}: ${user.saldo} -> ${newBalance}`);
    return res.status(200).json({
      message: 'Saldo adicionado com sucesso',
      saldo: newBalance
    });
  } catch (error) {
    console.error('Add balance error:', error);
    return res.status(500).json({ message: 'Erro ao adicionar saldo' });
  }
});

module.exports = router;
