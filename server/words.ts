// Basic French words to guess. Common nouns, easy to give clues for.
export const WORDS: readonly string[] = [
  // Maison
  'maison', 'porte', 'fenêtre', 'table', 'chaise', 'lit', 'cuisine', 'jardin',
  'toit', 'escalier', 'lampe', 'miroir', 'clé', 'canapé', 'armoire', 'bougie',
  // Nourriture
  'pain', 'fromage', 'pomme', 'banane', 'chocolat', 'gâteau', 'café', 'lait',
  'soupe', 'beurre', 'croissant', 'fraise', 'orange', 'carotte', 'tomate', 'miel',
  'confiture', 'pizza', 'salade', 'œuf', 'sucre', 'sel', 'vin', 'baguette',
  // Animaux
  'chat', 'chien', 'cheval', 'vache', 'cochon', 'mouton', 'poule', 'lapin',
  'oiseau', 'poisson', 'lion', 'tigre', 'éléphant', 'singe', 'girafe', 'serpent',
  'souris', 'abeille', 'papillon', 'requin', 'baleine', 'ours', 'loup', 'renard',
  // Nature
  'soleil', 'lune', 'étoile', 'nuage', 'pluie', 'neige', 'vent', 'orage',
  'mer', 'plage', 'montagne', 'forêt', 'arbre', 'fleur', 'rivière', 'île',
  'désert', 'volcan', 'arc-en-ciel', 'feuille', 'herbe', 'sable', 'glace', 'feu',
  // Transport
  'voiture', 'vélo', 'train', 'avion', 'bateau', 'bus', 'moto', 'fusée',
  'métro', 'camion', 'taxi', 'route', 'pont', 'gare', 'port', 'aéroport',
  // Corps
  'main', 'pied', 'tête', 'œil', 'nez', 'bouche', 'oreille', 'cœur',
  'dent', 'cheveu', 'bras', 'jambe', 'doigt', 'genou', 'épaule', 'dos',
  // Objets
  'livre', 'stylo', 'téléphone', 'ordinateur', 'télévision', 'montre', 'lunettes', 'parapluie',
  'chapeau', 'chaussure', 'sac', 'ballon', 'guitare', 'piano', 'cadeau', 'couteau',
  'fourchette', 'cuillère', 'assiette', 'verre', 'bouteille', 'valise', 'appareil photo', 'ciseaux',
  // Lieux & métiers
  'école', 'hôpital', 'église', 'château', 'musée', 'cinéma', 'restaurant', 'boulangerie',
  'médecin', 'professeur', 'pompier', 'policier', 'boulanger', 'pilote', 'cuisinier', 'facteur',
  // Divers
  'musique', 'football', 'vacances', 'Noël', 'anniversaire', 'mariage', 'rêve', 'fantôme',
  'pirate', 'roi', 'reine', 'princesse', 'sorcière', 'dragon', 'robot', 'trésor',
  'hiver', 'été', 'printemps', 'automne', 'matin', 'nuit', 'argent', 'Paris',
]

export function pickWords(count: number, random: () => number = Math.random): string[] {
  const pool = [...WORDS]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, count)
}
