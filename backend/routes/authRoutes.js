
const express = require('express');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { getByField, create, getById } = require('../utils/dbHelper');
const { generateToken, verifyToken } = require('../middleware/auth');

const router = express.Router();

// Verify CPF route
router.get('/verify-cpf/:cpf', async (req, res) => {
  try {
    const cpf = req.params.cpf;
    const existingUser = getByField('users', 'cpf', cpf)[0];
    
    if (existingUser) {
      return res.status(200).json({ 
        userExists: true,
        message: 'CPF já cadastrado'
      });
    }
    
    return res.status(200).json({
      userExists: false,
      message: 'CPF disponível para cadastro'
    });
  } catch (error) {
    console.error('Error verifying CPF:', error);
    return res.status(500).json({ message: 'Erro ao verificar CPF' });
  }
});

// Register route
router.post('/cadastro', async (req, res) => {
  try {
    const { 
      nome, 
      sobrenome, 
      email, 
      cpf, 
      telefone, 
      dataNascimento, 
      senha,
      termos,
      aceitaEmailMarketing,
      aceitaSMSMarketing
    } = req.body;
    
    // Check if user already exists
    const existingUser = getByField('users', 'cpf', cpf)[0];
    if (existingUser) {
      return res.status(400).json({ message: 'Usuário com este CPF já existe' });
    }
    
    const emailExists = getByField('users', 'email', email)[0];
    if (emailExists) {
      return res.status(400).json({ message: 'Email já está em uso' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(senha, 10);
    
    // Create new user
    const newUser = {
      id: uuidv4(),
      nome,
      sobrenome,
      email,
      cpf,
      telefone,
      dataNascimento,
      senha: hashedPassword,
      termos,
      aceitaEmailMarketing: aceitaEmailMarketing || false,
      aceitaSMSMarketing: aceitaSMSMarketing || false,
      saldo: 0,
      dataCriacao: new Date().toISOString(),
      ultimoAcesso: new Date().toISOString()
    };
    
    const user = create('users', newUser);
    
    // Generate token
    const token = generateToken(user);
    
    // Return user data without password
    const { senha: _, ...userData } = user;
    
    return res.status(201).json({ 
      message: 'Usuário registrado com sucesso', 
      token, 
      user: userData 
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Erro ao registrar usuário' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { cpf, senha } = req.body;
    
    // Find user by CPF
    const user = getByField('users', 'cpf', cpf)[0];
    
    if (!user) {
      return res.status(401).json({ message: 'CPF ou senha inválidos' });
    }
    
    // Compare password
    const isPasswordValid = await bcrypt.compare(senha, user.senha);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'CPF ou senha inválidos' });
    }
    
    // Generate token
    const token = generateToken(user);
    
    // Return user data without password
    const { senha: _, ...userData } = user;
    
    return res.status(200).json({
      message: 'Login realizado com sucesso',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Erro ao fazer login' });
  }
});

// Get current user
router.get('/usuario', verifyToken, (req, res) => {
  try {
    const user = getById('users', req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Return user data without password
    const { senha, ...userData } = user;
    
    return res.status(200).json(userData);
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ message: 'Erro ao buscar usuário' });
  }
});

// Get user by CPF
router.get('/usuario/:cpf', async (req, res) => {
  try {
    const cpf = req.params.cpf;
    const user = getByField('users', 'cpf', cpf)[0];
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Return only basic user info for security
    const basicUserInfo = {
      nome: user.nome,
      sobrenome: user.sobrenome,
      email: user.email,
      cpf: user.cpf,
      telefone: user.telefone
    };
    
    return res.status(200).json(basicUserInfo);
  } catch (error) {
    console.error('Get user by CPF error:', error);
    return res.status(500).json({ message: 'Erro ao buscar usuário' });
  }
});

// Logout route - frontend will handle token removal
router.post('/logout', (req, res) => {
  return res.status(200).json({ message: 'Logout realizado com sucesso' });
});

module.exports = router;
