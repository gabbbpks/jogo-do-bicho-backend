
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { create, getAll, getByField, update } = require('../utils/dbHelper');
const { verifyToken } = require('../middleware/auth');
const { getAnimalByNumber } = require('../data/animals');

const router = express.Router();

// Generate a new draw result
router.post('/sortear', verifyToken, (req, res) => {
  try {
    const sorteios = ['10h Bahia', '13h Rio', '16h SP', '19h Federal', '21h Coruja'];
    const sorteio = req.body.sorteio || sorteios[Math.floor(Math.random() * sorteios.length)];
    
    // Generate 5 random numbers (1st, 2nd, 3rd, 4th, 5th prizes)
    const numeros = [];
    for (let i = 0; i < 5; i++) {
      // Generate a random 4-digit number (0000-9999)
      const numero = Math.floor(Math.random() * 10000);
      // Format to always have 4 digits
      numeros.push(numero.toString().padStart(4, '0'));
    }
    
    // Create result object
    const resultado = {
      id: uuidv4(),
      data: new Date().toISOString(),
      sorteio,
      numeros,
      animais: numeros.map(num => {
        const lastDigit = parseInt(num.slice(-1));
        return getAnimalByNumber(lastDigit).name;
      })
    };
    
    // Save result
    create('resultados', resultado);
    
    return res.status(201).json({
      message: 'Sorteio realizado com sucesso',
      resultado
    });
  } catch (error) {
    console.error('Draw result error:', error);
    return res.status(500).json({ message: 'Erro ao realizar sorteio' });
  }
});

// Get latest results
router.get('/latest', (req, res) => {
  try {
    const resultados = getAll('resultados');
    
    // If no results, return empty array
    if (resultados.length === 0) {
      return res.status(200).json([]);
    }
    
    // Sort results by date (most recent first)
    resultados.sort((a, b) => new Date(b.data) - new Date(a.data));
    
    // Return latest result for each draw type
    const sorteios = {};
    resultados.forEach(resultado => {
      if (!sorteios[resultado.sorteio]) {
        sorteios[resultado.sorteio] = resultado;
      }
    });
    
    return res.status(200).json(Object.values(sorteios));
  } catch (error) {
    console.error('Get latest results error:', error);
    return res.status(500).json({ message: 'Erro ao buscar resultados recentes' });
  }
});

// Get results by date
router.get('/data/:data', (req, res) => {
  try {
    const data = req.params.data;
    const resultados = getAll('resultados');
    
    // Filter results by date (YYYY-MM-DD format)
    const resultadosFiltrados = resultados.filter(resultado => {
      const resultadoData = new Date(resultado.data).toISOString().split('T')[0];
      return resultadoData === data;
    });
    
    return res.status(200).json(resultadosFiltrados);
  } catch (error) {
    console.error('Get results by date error:', error);
    return res.status(500).json({ message: 'Erro ao buscar resultados por data' });
  }
});

// List all results
router.get('/listar', (req, res) => {
  try {
    const resultados = getAll('resultados');
    
    // Sort results by date (most recent first)
    resultados.sort((a, b) => new Date(b.data) - new Date(a.data));
    
    return res.status(200).json(resultados);
  } catch (error) {
    console.error('List results error:', error);
    return res.status(500).json({ message: 'Erro ao listar resultados' });
  }
});

// Verify if a bet has won
router.post('/verificar', verifyToken, (req, res) => {
  try {
    const { apostaId } = req.body;
    
    // Get the bet
    const apostas = getAll('apostas');
    const aposta = apostas.find(a => a.id === apostaId);
    
    if (!aposta) {
      return res.status(404).json({ message: 'Aposta não encontrada' });
    }
    
    // Get latest results
    const resultados = getAll('resultados');
    resultados.sort((a, b) => new Date(b.data) - new Date(a.data));
    
    // Find the result for the specific draw
    const sorteioDesejado = aposta.selecao?.extracao || '10h Bahia';
    const resultado = resultados.find(r => r.sorteio === sorteioDesejado);
    
    if (!resultado) {
      return res.status(404).json({ message: 'Resultado não encontrado para esta extração' });
    }
    
    // Check if bet has won based on bet type
    let ganhou = false;
    let premio = 0;
    
    switch(aposta.tipo) {
      case 'milhar':
        // Check if the bet number matches any of the results
        ganhou = resultado.numeros.some(num => num === aposta.numeros.join(''));
        if (ganhou) {
          premio = aposta.valor * aposta.odds;
        }
        break;
      case 'centena':
        // Check if last 3 digits match
        ganhou = resultado.numeros.some(num => {
          const ultimosTresDigitos = num.slice(-3);
          return ultimosTresDigitos === aposta.numeros.join('');
        });
        if (ganhou) {
          premio = aposta.valor * aposta.odds;
        }
        break;
      case 'dezena':
        // Check if last 2 digits match
        ganhou = resultado.numeros.some(num => {
          const ultimosDoisDigitos = num.slice(-2);
          return ultimosDoisDigitos === aposta.numeros.join('');
        });
        if (ganhou) {
          premio = aposta.valor * aposta.odds;
        }
        break;
      case 'unidade':
        // Check if last digit matches
        ganhou = resultado.numeros.some(num => {
          const ultimoDigito = num.slice(-1);
          return parseInt(ultimoDigito) === aposta.numeros[0];
        });
        if (ganhou) {
          premio = aposta.valor * aposta.odds;
        }
        break;
      case 'bicho':
        // Check if animal matches any of the results
        const animalApostado = aposta.selecao.bicho;
        ganhou = resultado.animais.includes(animalApostado);
        if (ganhou) {
          premio = aposta.valor * 18; // Standard payout for animal bet is 18x
        }
        break;
    }
    
    // Update the bet with result
    const apostasAtualizadas = apostas.map(a => {
      if (a.id === apostaId) {
        return {
          ...a,
          resultado: {
            verificado: true,
            ganhou,
            premio,
            dataVerificacao: new Date().toISOString(),
            sorteio: resultado
          },
          status: ganhou ? 'ganhou' : 'perdeu'
        };
      }
      return a;
    });
    
    // Update the database
    const db = require('../utils/dbHelper').readDB();
    db.apostas = apostasAtualizadas;
    require('../utils/dbHelper').writeDB(db);
    
    // If user won, update their balance
    if (ganhou) {
      const user = db.users.find(u => u.id === aposta.userId);
      if (user) {
        update('users', user.id, { saldo: user.saldo + premio });
      }
    }
    
    return res.status(200).json({
      message: ganhou ? 'Parabéns! Você ganhou!' : 'Não foi dessa vez.',
      aposta: apostasAtualizadas.find(a => a.id === apostaId)
    });
  } catch (error) {
    console.error('Verify bet error:', error);
    return res.status(500).json({ message: 'Erro ao verificar aposta' });
  }
});

module.exports = router;
