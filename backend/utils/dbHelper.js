
const fs = require('fs');
const path = require('path');

// Use absolute path to ensure compatibility with Vercel
const DB_PATH = path.join(__dirname, '../data/db.json');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Function to read the database - with error handling for Vercel
const readDB = () => {
  try {
    // If file doesn't exist yet, create it with default structure
    if (!fs.existsSync(DB_PATH)) {
      const defaultDb = { users: [], apostas: [], resultados: [], transacoes: [] };
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2));
      return defaultDb;
    }
    
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    // Return default structure if there's an error
    return { users: [], apostas: [], resultados: [], transacoes: [] };
  }
};

// Function to write to the database - with error handling for Vercel
const writeDB = (data) => {
  try {
    // Ensure the directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing to database:', error);
    return false;
  }
};

// Function to create a new entry in a collection
const create = (collection, newItem) => {
  try {
    const db = readDB();
    
    if (!db[collection]) {
      db[collection] = [];
    }
    
    db[collection].push(newItem);
    writeDB(db);
    return newItem;
  } catch (error) {
    console.error(`Error creating item in ${collection}:`, error);
    return null;
  }
};

// Function to get an entry by ID from a collection
const getById = (collection, id) => {
  try {
    const db = readDB();
    
    if (!db[collection]) {
      return null;
    }
    
    return db[collection].find(item => item.id === id);
  } catch (error) {
    console.error(`Error getting item by ID from ${collection}:`, error);
    return null;
  }
};

// Function to get entries by field from a collection
const getByField = (collection, field, value) => {
  try {
    const db = readDB();
    
    if (!db[collection]) {
      return [];
    }
    
    return db[collection].filter(item => item[field] === value);
  } catch (error) {
    console.error(`Error getting items by field from ${collection}:`, error);
    return [];
  }
};

// Function to update an entry in a collection
const update = (collection, id, updatedItem) => {
  try {
    const db = readDB();
    
    if (!db[collection]) {
      return null;
    }
    
    const index = db[collection].findIndex(item => item.id === id);
    
    if (index === -1) {
      return null;
    }
    
    db[collection][index] = { ...db[collection][index], ...updatedItem };
    writeDB(db);
    return db[collection][index];
  } catch (error) {
    console.error(`Error updating item in ${collection}:`, error);
    return null;
  }
};

// Function to remove an entry from a collection
const remove = (collection, id) => {
  try {
    const db = readDB();
    
    if (!db[collection]) {
      return false;
    }
    
    const index = db[collection].findIndex(item => item.id === id);
    
    if (index === -1) {
      return false;
    }
    
    db[collection].splice(index, 1);
    writeDB(db);
    return true;
  } catch (error) {
    console.error(`Error removing item from ${collection}:`, error);
    return false;
  }
};

// Get the entire collection
const getAll = (collection) => {
  try {
    const db = readDB();
    
    if (!db[collection]) {
      db[collection] = [];
      writeDB(db);
    }
    
    return db[collection];
  } catch (error) {
    console.error(`Error getting all from ${collection}:`, error);
    return [];
  }
};

module.exports = {
  create,
  getById,
  getByField,
  update,
  remove,
  getAll,
  readDB,
  writeDB
};
