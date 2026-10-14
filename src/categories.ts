import type { Category, Item } from './types';

/** In the order people usually walk through a supermarket. */
export const CATEGORIES: Category[] = [
  'produce',
  'bakery',
  'meat',
  'dairy',
  'frozen',
  'pantry',
  'snacks',
  'drinks',
  'household',
  'personal',
  'other',
];

export const CATEGORY_EMOJI: Record<Category, string> = {
  produce: '🥦',
  bakery: '🍞',
  meat: '🍗',
  dairy: '🥛',
  frozen: '🧊',
  pantry: '🥫',
  snacks: '🍪',
  drinks: '🥤',
  household: '🧽',
  personal: '🧴',
  other: '📦',
};

// Words that point to a category, in English, French and Kreol Morisien.
// Written without accents; names are compared the same way.
const WORDS: Record<Exclude<Category, 'other'>, string[]> = {
  produce: [
    // English
    'apple', 'banana', 'orange', 'lemon', 'lime', 'mango', 'papaya', 'pineapple', 'litchi', 'lychee',
    'grape', 'melon', 'watermelon', 'pear', 'avocado', 'coconut', 'tomato', 'tomatoes', 'potato',
    'potatoes', 'onion', 'garlic', 'ginger', 'carrot', 'cabbage', 'lettuce', 'salad', 'cucumber',
    'chilli', 'chili', 'eggplant', 'aubergine', 'pumpkin', 'spinach', 'broccoli', 'cauliflower',
    'coriander', 'parsley', 'thyme', 'mint', 'corn', 'mushroom', 'fruit', 'vegetable', 'veg', 'herbs',
    // French
    'pomme', 'banane', 'citron', 'mangue', 'papaye', 'ananas', 'raisin', 'poire', 'avocat', 'coco',
    'tomate', 'oignon', 'ail', 'gingembre', 'carotte', 'chou', 'laitue', 'concombre', 'piment',
    'citrouille', 'potiron', 'epinard', 'brocoli', 'coriandre', 'persil', 'thym', 'menthe', 'mais',
    'champignon', 'legume',
    // Kreol
    'pom', 'bannann', 'sitron', 'mang', 'papay', 'zannanas', 'lisi', 'rezin', 'zavoka', 'tomat',
    'pomdeter', 'zonion', 'lay', 'zenzam', 'karot', 'sou', 'salad', 'konkonm', 'brinzel', 'zironmon',
    'bred', 'kotomili', 'lalo', 'pipangay', 'sousou', 'legim', 'fwi', 'mayi', 'diten',
  ],
  bakery: [
    'bread', 'baguette', 'loaf', 'bun', 'buns', 'croissant', 'cake', 'roti', 'farata', 'puri', 'naan',
    'pain', 'brioche', 'gateau', 'viennoiserie',
    'dipin', 'dalpouri', 'pouri',
  ],
  meat: [
    'chicken', 'beef', 'pork', 'lamb', 'mutton', 'goat', 'mince', 'sausage', 'ham', 'bacon', 'fish',
    'tuna', 'salmon', 'prawn', 'shrimp', 'octopus', 'squid', 'crab', 'meat', 'steak', 'venison',
    'poulet', 'boeuf', 'porc', 'agneau', 'mouton', 'cabri', 'saucisse', 'jambon', 'lardon', 'poisson',
    'thon', 'saumon', 'crevette', 'ourite', 'calamar', 'crabe', 'viande', 'cerf',
    'poul', 'dibef', 'koson', 'kabri', 'sosis', 'zambon', 'pwason', 'kamaron', 'zourit', 'ourit',
    'lavyann', 'serf',
  ],
  dairy: [
    'milk', 'cheese', 'butter', 'yoghurt', 'yogurt', 'cream', 'egg', 'eggs',
    'lait', 'fromage', 'beurre', 'yaourt', 'creme', 'oeuf', 'oeufs',
    'dile', 'fromaz', 'ber', 'dizef', 'lezef',
  ],
  frozen: [
    'frozen', 'ice', 'icecream', 'nuggets',
    'surgele', 'surgeles', 'glace', 'glacon',
    'konzele', 'lagla', 'glas',
  ],
  pantry: [
    'rice', 'pasta', 'spaghetti', 'macaroni', 'noodle', 'noodles', 'flour', 'sugar', 'salt', 'oil',
    'vinegar', 'lentil', 'lentils', 'dholl', 'dal', 'dhal', 'chickpea', 'chickpeas', 'sauce',
    'ketchup', 'mayonnaise', 'mayo', 'spice', 'spices', 'curry', 'masala', 'tea', 'coffee', 'honey',
    'jam', 'cereal', 'cereals', 'oats', 'canned', 'tinned', 'beans', 'pepper', 'stock', 'yeast',
    'weetabix', 'cornflakes', 'muesli', 'nutella',
    'riz', 'pates', 'nouilles', 'farine', 'sucre', 'sel', 'huile', 'vinaigre', 'lentille', 'haricot',
    'haricots', 'pois', 'epice', 'epices', 'cari', 'cafe', 'miel', 'confiture', 'cereale', 'conserve',
    'poivre', 'levure',
    'diri', 'farinn', 'disik', 'disel', 'delwil', 'vineg', 'lantiy', 'grin', 'kari', 'dite', 'kafe',
    'dimiel', 'konfitir', 'mine', 'pwav',
  ],
  snacks: [
    'chips', 'crisps', 'biscuit', 'biscuits', 'cookie', 'cookies', 'chocolate', 'candy', 'sweets',
    'snack', 'snacks', 'popcorn', 'nuts', 'peanut', 'peanuts', 'lays',
    'chocolat', 'bonbon', 'bonbons', 'cacahuete', 'cacahuetes',
    'gato', 'sokola', 'pistas', 'napolitin',
  ],
  drinks: [
    'water', 'juice', 'soda', 'coke', 'cola', 'beer', 'wine', 'rum', 'whisky', 'whiskey', 'drink',
    'drinks', 'lemonade', 'sprite', 'fanta', 'pepsi', 'phoenix', 'squash', 'cordial',
    'eau', 'jus', 'biere', 'vin', 'rhum', 'boisson', 'limonade', 'sirop',
    'dilo', 'zi', 'labier', 'divin', 'rom', 'labwason', 'limonad', 'sirob',
  ],
  household: [
    'detergent', 'bleach', 'tissue', 'tissues', 'sponge', 'dish', 'dishwashing', 'washing', 'cleaner',
    'foil', 'candle', 'candles', 'battery', 'batteries', 'insecticide', 'broom',
    'lessive', 'javel', 'mouchoir', 'mouchoirs', 'eponge', 'vaisselle', 'bougie', 'bougies', 'pile',
    'piles', 'balai',
    'lesiv', 'zavel', 'eponz', 'bouzi', 'pil', 'balie',
  ],
  personal: [
    'soap', 'shampoo', 'conditioner', 'toothpaste', 'toothbrush', 'deodorant', 'razor', 'lotion',
    'pads', 'diaper', 'diapers', 'nappy', 'nappies', 'sunscreen',
    'savon', 'shampoing', 'dentifrice', 'deodorant', 'rasoir', 'couche', 'couches',
    'sampwen', 'dantifris', 'kous',
  ],
};

// Phrases checked first, so "coconut milk" isn't dairy and "ice cream" isn't dairy either.
const PHRASES: [string, Category][] = [
  ['ice cream', 'frozen'],
  ['fish fingers', 'frozen'],
  ['frites surgelees', 'frozen'],
  ['coconut milk', 'pantry'],
  ['lait de coco', 'pantry'],
  ['peanut butter', 'pantry'],
  ['corned beef', 'pantry'],
  ['dholl puri', 'bakery'],
  ['toilet paper', 'household'],
  ['paper towel', 'household'],
  ['bin bag', 'household'],
  ['bin bags', 'household'],
  ['washing powder', 'household'],
  ['papier toilette', 'household'],
  ['sac poubelle', 'household'],
  ['essuie tout', 'household'],
  ['papie twalet', 'household'],
  ['pomme de terre', 'produce'],
  ['pomme d amour', 'produce'],
  ['spring onion', 'produce'],
  ['brosse a dents', 'personal'],
  ['bros dan', 'personal'],
];

// When a name matches several categories, the more specific one wins:
// "tomato sauce" is pantry, "orange juice" is drinks, "dish soap" is household.
const PRIORITY: Category[] = [
  'frozen', 'drinks', 'household', 'personal', 'snacks', 'pantry', 'bakery', 'dairy', 'meat', 'produce',
];

const LOOKUP = new Map<string, Category>();
for (const [cat, words] of Object.entries(WORDS) as [Category, string[]][]) {
  for (const w of words) if (!LOOKUP.has(w)) LOOKUP.set(w, cat);
}

function normalise(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function lookupWord(word: string): Category | undefined {
  return (
    LOOKUP.get(word) ??
    (word.endsWith('es') ? LOOKUP.get(word.slice(0, -2)) : undefined) ??
    (word.endsWith('s') || word.endsWith('x') ? LOOKUP.get(word.slice(0, -1)) : undefined)
  );
}

/** Best guess at an item's category from its name; 'other' if nothing matches. */
export function guessCategory(name: string): Category {
  const n = normalise(name);
  const padded = ` ${n} `;
  for (const [phrase, cat] of PHRASES) if (padded.includes(` ${phrase} `)) return cat;

  const found = new Set<Category>();
  for (const word of n.split(' ')) {
    const cat = lookupWord(word);
    if (cat) found.add(cat);
  }
  return PRIORITY.find((c) => found.has(c)) ?? 'other';
}

/** The category an item is shown under: the one chosen, or a guess for older items. */
export function categoryOf(item: Pick<Item, 'name' | 'category'>): Category {
  return item.category ?? guessCategory(item.name);
}
