
// Animal definitions for Jogo do Bicho
const animals = [
  { id: 1, name: 'Avestruz', group: 1, numbers: [1, 2, 3, 4] },
  { id: 2, name: 'Águia', group: 2, numbers: [5, 6, 7, 8] },
  { id: 3, name: 'Burro', group: 3, numbers: [9, 10, 11, 12] },
  { id: 4, name: 'Borboleta', group: 4, numbers: [13, 14, 15, 16] },
  { id: 5, name: 'Cachorro', group: 5, numbers: [17, 18, 19, 20] },
  { id: 6, name: 'Cabra', group: 6, numbers: [21, 22, 23, 24] },
  { id: 7, name: 'Carneiro', group: 7, numbers: [25, 26, 27, 28] },
  { id: 8, name: 'Camelo', group: 8, numbers: [29, 30, 31, 32] },
  { id: 9, name: 'Cobra', group: 9, numbers: [33, 34, 35, 36] },
  { id: 10, name: 'Coelho', group: 10, numbers: [37, 38, 39, 40] },
  { id: 11, name: 'Cavalo', group: 11, numbers: [41, 42, 43, 44] },
  { id: 12, name: 'Elefante', group: 12, numbers: [45, 46, 47, 48] },
  { id: 13, name: 'Galo', group: 13, numbers: [49, 50, 51, 52] },
  { id: 14, name: 'Gato', group: 14, numbers: [53, 54, 55, 56] },
  { id: 15, name: 'Jacaré', group: 15, numbers: [57, 58, 59, 60] },
  { id: 16, name: 'Leão', group: 16, numbers: [61, 62, 63, 64] },
  { id: 17, name: 'Macaco', group: 17, numbers: [65, 66, 67, 68] },
  { id: 18, name: 'Porco', group: 18, numbers: [69, 70, 71, 72] },
  { id: 19, name: 'Pavão', group: 19, numbers: [73, 74, 75, 76] },
  { id: 20, name: 'Peru', group: 20, numbers: [77, 78, 79, 80] },
  { id: 21, name: 'Touro', group: 21, numbers: [81, 82, 83, 84] },
  { id: 22, name: 'Tigre', group: 22, numbers: [85, 86, 87, 88] },
  { id: 23, name: 'Urso', group: 23, numbers: [89, 90, 91, 92] },
  { id: 24, name: 'Veado', group: 24, numbers: [93, 94, 95, 96] },
  { id: 25, name: 'Vaca', group: 25, numbers: [97, 98, 99, 0] }
];

// Get animal by number
const getAnimalByNumber = (number) => {
  // Convert to a number between 0-99
  const n = number % 100;
  
  for (let animal of animals) {
    if (animal.numbers.includes(n)) {
      return animal;
    }
  }
  
  return null;
};

// Get animal by name
const getAnimalByName = (name) => {
  return animals.find(animal => animal.name.toLowerCase() === name.toLowerCase()) || null;
};

// Get animal by group
const getAnimalByGroup = (group) => {
  return animals.find(animal => animal.group === group) || null;
};

module.exports = {
  animals,
  getAnimalByNumber,
  getAnimalByName,
  getAnimalByGroup
};
