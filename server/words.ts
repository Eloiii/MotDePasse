// French words to guess: well-known, but rich enough to make clues interesting.
// Every word must exist in the dictionary (checked by game.test.ts).
export const WORDS: readonly string[] = [
  // Quelques classiques
  'éléphant', 'girafe', 'papillon', 'requin', 'baleine', 'serpent', 'abeille', 'renard',
  'volcan', 'désert', 'arc-en-ciel', 'orage', 'fusée', 'aéroport', 'escalier', 'miroir',
  'bougie', 'croissant', 'confiture', 'baguette', 'ordinateur', 'lunettes', 'parapluie', 'guitare',
  'piano', 'cadeau', 'valise', 'ciseaux', 'appareil photo', 'hôpital', 'château', 'musée',
  'cinéma', 'boulangerie', 'pompier', 'pilote', 'facteur', 'football', 'vacances', 'Noël',
  'anniversaire', 'mariage', 'fantôme', 'pirate', 'princesse', 'sorcière', 'dragon', 'robot',
  'trésor',

  // Géographie & météo
  'archipel', 'banquise', 'iceberg', 'glacier', 'cascade', 'grotte', 'falaise', 'oasis',
  'mirage', 'geyser', 'cratère', 'stalactite', 'séisme', 'tornade', 'ouragan', 'avalanche',
  'inondation', 'sécheresse', 'canicule', 'brouillard', 'tonnerre', 'foudre', 'grêle', 'marée',
  'dune', 'clairière', 'ruisseau', 'étang', 'colline', 'vallée', 'sommet', 'marécage',
  'lagune', 'horizon', 'frontière', 'boussole',
  // Espace & sciences
  'aurore', 'éclipse', 'comète', 'galaxie', 'constellation', 'météorite', 'satellite', 'astronaute',
  'gravité', 'atome', 'molécule', 'aimant', 'fossile', 'télescope', 'microscope', 'sablier',
  'thermomètre', 'baromètre', 'pendule', 'prisme', 'loupe', 'kaléidoscope', 'métronome', 'périscope',
  'laboratoire', 'observatoire', 'planétarium', 'aquarium', 'dinosaure', 'électricité',
  // Corps & santé
  'squelette', 'cerveau', 'poumon', 'cicatrice', 'vaccin', 'stéthoscope', 'béquille', 'hoquet',
  'moustache', 'sourcil', 'nombril', 'fossette', 'tatouage', 'migraine', 'éternuement', 'allergie',
  'fièvre', 'plâtre', 'piqûre', 'ordonnance', 'radiographie', 'ambulance', 'pansement', 'bâillement',
  // Animaux
  'hippocampe', 'caméléon', 'pieuvre', 'méduse', 'paon', 'hérisson', 'castor', 'loutre',
  'lynx', 'pélican', 'toucan', 'perroquet', 'autruche', 'kangourou', 'koala', 'panda',
  'morse', 'phoque', 'dauphin', 'scorpion', 'libellule', 'coccinelle', 'escargot', 'chauve-souris',
  'hibou', 'chouette', 'vautour', 'colibri', 'salamandre', 'crocodile', 'tortue', 'dromadaire',
  'zèbre', 'rhinocéros', 'hippopotame', 'gorille', 'paresseux', 'narval', 'orque', 'homard',
  'oursin', 'manchot', 'cigogne', 'héron', 'corbeau', 'luciole', 'termite', 'écureuil',
  'araignée', 'fourmi', 'moustique', 'chenille', 'grenouille', 'têtard', 'taupe', 'marmotte',
  'sanglier', 'mouette', 'crabe', 'corail', 'coquillage', 'perle', 'caniche',
  // Plantes
  'tournesol', 'coquelicot', 'muguet', 'lavande', 'cactus', 'bambou', 'champignon', 'citrouille',
  'gland', 'ortie', 'pissenlit', 'rosier', 'baobab', 'palmier', 'sapin', 'nénuphar',
  // Histoire
  'pharaon', 'pyramide', 'momie', 'chevalier', 'armure', 'catapulte', 'donjon', 'gladiateur',
  'viking', 'samouraï', 'mousquetaire', 'corsaire', 'empereur', 'révolution', 'guillotine', 'croisade',
  'sceptre', 'couronne', 'trône', 'blason', 'épée', 'bouclier', 'arbalète', 'parchemin',
  'potion', 'shérif', 'diligence', 'carrosse', 'cathédrale', 'forteresse', 'aqueduc', 'amphithéâtre',
  // Mythes & magie
  'sphinx', 'cyclope', 'sirène', 'licorne', 'centaure', 'phénix', 'griffon', 'labyrinthe',
  'oracle', 'titan', 'vampire', 'loup-garou', 'zombie', 'alchimiste', 'grimoire', 'sortilège',
  'talisman', 'amulette', 'elfe', 'lutin', 'ogre', 'fée', 'génie',
  'superstition', 'horoscope', 'voyante', 'malédiction',
  // Arts & spectacle
  'opéra', 'symphonie', 'orchestre', 'violoncelle', 'harpe', 'accordéon', 'saxophone', 'trompette',
  'tambour', 'xylophone', 'ballet', 'marionnette', 'théâtre', 'comédie', 'tragédie', 'poème',
  'fable', 'légende', 'sculpture', 'mosaïque', 'fresque', 'aquarelle', 'pinceau', 'chevalet',
  'vitrail', 'tapisserie', 'calligraphie', 'autographe', 'jongleur', 'acrobate', 'funambule', 'clown',
  'magicien', 'ventriloque', 'mime', 'cirque', 'fanfare', 'chorégraphie', 'applaudissement', 'coulisses',
  'dessin animé', 'bande dessinée', 'caricature', 'autoportrait',
  // Gastronomie
  'ratatouille', 'cassoulet', 'bouillabaisse', 'raclette', 'fondue', 'crêpe', 'éclair', 'macaron',
  'profiterole', 'madeleine', 'quiche', 'soufflé', 'choucroute', 'truffe', 'camembert', 'roquefort',
  'brioche', 'praline', 'nougat', 'guimauve', 'caramel', 'meringue', 'sorbet', 'vinaigrette',
  'mayonnaise', 'moutarde', 'cornichon', 'artichaut', 'aubergine', 'courgette', 'potiron', 'betterave',
  'radis', 'poireau', 'asperge', 'framboise', 'myrtille', 'grenade', 'figue', 'abricot',
  'pastèque', 'ananas', 'mangue', 'noisette', 'châtaigne', 'cannelle', 'vanille', 'pistache',
  'gingembre', 'piment', 'omelette', 'lasagne', 'couscous', 'spaghetti', 'tartine', 'sandwich',
  'sucette', 'glaçon', 'limonade', 'champagne', 'cidre', 'tisane', 'yaourt', 'crème brûlée',
  'clafoutis', 'galette', 'barbe à papa', 'pique-nique',
  // Métiers & personnages
  'archéologue', 'détective', 'espion', 'explorateur', 'navigateur', 'horloger', 'forgeron', 'apiculteur',
  'vigneron', 'berger', 'bûcheron', 'sommelier', 'pâtissier', 'chirurgien', 'vétérinaire', 'architecte',
  'inventeur', 'philosophe', 'astronome', 'alpiniste', 'menuisier', 'cordonnier', 'bijoutier', 'libraire',
  'journaliste', 'photographe', 'interprète', 'avocat', 'ambassadeur', 'arbitre', 'mascotte', 'nomade',
  'ermite', 'géant', 'bouffon', 'majordome', 'jardinier', 'plombier', 'serrurier', 'dentiste',
  'pharmacien', 'coiffeur', 'boucher', 'fleuriste', 'moniteur', 'cascadeur', 'sauveteur', 'dompteur',
  // Ville & société
  'embouteillage', 'rond-point', 'péage', 'trottoir', 'lampadaire', 'parking', 'supermarché', 'brocante',
  'bibliothèque', 'pharmacie', 'mairie', 'tribunal', 'prison', 'menottes', 'alibi', 'cambrioleur',
  'empreinte', 'enquête', 'suspect', 'rançon', 'élection', 'manifestation', 'grève', 'impôt',
  'passeport', 'douane', 'ambassade', 'auberge', 'croisière', 'escale', 'bagage', 'guichet',
  'chantier', 'grue', 'bulldozer', 'échafaudage', 'usine', 'banque', 'distributeur', 'monnaie',
  'carnaval', 'déguisement', 'confettis', 'guirlande', 'réveillon', 'baptême', 'cérémonie', 'discours',
  // Transports & constructions
  'montgolfière', 'dirigeable', 'sous-marin', 'hélicoptère', 'parachute', 'gondole', 'catamaran', 'péniche',
  'voilier', 'téléphérique', 'tramway', 'locomotive', 'trottinette', 'traîneau', 'radeau', 'hologramme',
  'phare', 'moulin', 'puits', 'fontaine', 'monastère', 'citadelle', 'igloo', 'cabane',
  'chalet', 'pagode', 'gratte-ciel', 'viaduc', 'écluse', 'tunnel', 'ascenseur', 'escalator',
  // Maison & objets
  'aspirateur', 'imprimante', 'télécommande', 'réfrigérateur', 'lave-vaisselle', 'grille-pain', 'cafetière', 'bouilloire',
  'passoire', 'tablier', 'oreiller', 'couette', 'réveil', 'pyjama', 'pantoufle', 'cintre',
  'portefeuille', 'tirelire', 'lanterne', 'chandelier', 'horloge', 'cadenas', 'échelle', 'brouette',
  'arrosoir', 'épouvantail', 'girouette', 'éventail', 'ombrelle', 'monocle', 'hamac', 'toboggan',
  'trampoline', 'cerf-volant', 'boomerang', 'tire-bouchon', 'coffre-fort', 'jumelles', 'sifflet', 'toupie',
  'extincteur', 'chronomètre', 'calculatrice', 'agrafeuse', 'trombone', 'cartable', 'mappemonde', 'dictionnaire',
  'encyclopédie', 'enveloppe', 'timbre', 'allumette', 'briquet', 'perruque', 'masque', 'casquette',
  'écharpe', 'moufle', 'imperméable', 'sandale', 'cravate', 'bretelles', 'ceinture', 'bracelet',
  'collier', 'parfum', 'rouge à lèvres', 'brosse à dents',
  // Sports & jeux
  'escrime', 'billard', 'marathon', 'javelot', 'haltère', 'plongeon', 'aviron', 'kayak',
  'judo', 'karaté', 'sarbacane', 'rodéo', 'pétanque', 'domino', 'puzzle', 'podium',
  'médaille', 'trophée', 'loterie', 'casino', 'roulette', 'manège', 'patinoire', 'tremplin',
  'randonnée', 'camping', 'tente', 'bowling', 'surf', 'ski', 'luge', 'boxe', 'sauna',
  'devinette', 'charade', 'rébus', 'mots croisés', 'marelle', 'cache-cache', 'coloriage', 'bricolage',
  'tricot', 'jardinage', 'console', 'manette',
  // Idées & sensations
  'nostalgie', 'mélancolie', 'vertige', 'jalousie', 'courage', 'sagesse', 'mystère', 'énigme',
  'paradoxe', 'illusion', 'utopie', 'hasard', 'destin', 'liberté', 'silence', 'écho',
  'ombre', 'reflet', 'souvenir', 'aventure', 'solitude', 'euphorie', 'insomnie', 'cauchemar',
  'frisson', 'rumeur', 'promesse', 'secret', 'timidité', 'colère', 'fierté', 'honte',
  'chagrin', 'panique', 'surprise', 'rancune', 'gourmandise', 'paresse', 'curiosité', 'patience',
  'mensonge', 'vengeance', 'trahison', 'pardon', 'amitié', 'politesse', 'routine', 'fou rire',
]

export function pickWords(count: number, random: () => number = Math.random): string[] {
  const pool = [...WORDS]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, count)
}
