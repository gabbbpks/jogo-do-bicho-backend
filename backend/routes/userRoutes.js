
const express = require('express');
const { getById, update } = require('../utils/dbHelper');

const router = express.Router();

// Get user balance
router.get('/saldo/:userId', (req, res) => {
  try {
    const userId = req.params.userId;
    const user = getById('users', userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    return res.status(200).json({ saldo: user.saldo || 0 });
  } catch (error) {
    console.error('Get balance error:', error);
    return res.status(500).json({ message: 'Erro ao buscar saldo' });
  }
});

// Get user profile
router.get('/:userId', (req, res) => {
  try {
    const userId = req.params.userId;
    const user = getById('users', userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Return user data without password
    const { senha, ...userData } = user;
    
    return res.status(200).json(userData);
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ message: 'Erro ao buscar perfil' });
  }
});

// Update user profile
router.put('/:userId', (req, res) => {
  try {
    const userId = req.params.userId;
    const updates = req.body;
    
    // Don't allow updating sensitive fields directly
    delete updates.senha;
    delete updates.saldo;
    delete updates.id;
    
    const user = getById('users', userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    const updatedUser = update('users', userId, updates);
    
    // Return user data without password
    const { senha, ...userData } = updatedUser;
    
    return res.status(200).json({
      message: 'Perfil atualizado com sucesso',
      user: userData
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Erro ao atualizar perfil' });
  }
});

module.exports = router;
