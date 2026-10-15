import type { Messages } from './i18n';
import type { Item, Unit } from './types';

export const UNITS: Unit[] = ['pcs', 'pack', 'g', 'kg', 'ml', 'L'];

/** What the price refers to: weight and volume are priced per kg / per L. */
export function priceBasis(unit: Unit): 'kg' | 'L' | 'each' {
  if (unit === 'g' || unit === 'kg') return 'kg';
  if (unit === 'ml' || unit === 'L') return 'L';
  return 'each';
}

/** Label for the "per ..." side of the Per / Total switch. */
export function perLabel(unit: Unit, t: Messages): string {
  const basis = priceBasis(unit);
  if (basis === 'kg') return t.perKg;
  if (basis === 'L') return t.perL;
  return unit === 'pack' ? t.perPack : t.perEach;
}

/** Name shown on the unit buttons. */
export function unitLabel(unit: Unit, t: Messages): string {
  return unit === 'pcs' || unit === 'pack' ? t.unitChip[unit] : unit;
}

/** Sensible +/- step for each unit. */
export function stepFor(unit: Unit): number {
  if (unit === 'g' || unit === 'ml') return 100;
  if (unit === 'kg' || unit === 'L') return 0.5;
  return 1;
}

/** Converts a quantity when switching between g and kg, or ml and L. */
export function convertQuantity(q: number, from: Unit, to: Unit): number {
  if (from === 'g' && to === 'kg') return q / 1000;
  if (from === 'kg' && to === 'g') return q * 1000;
  if (from === 'ml' && to === 'L') return q / 1000;
  if (from === 'L' && to === 'ml') return q * 1000;
  return q;
}

/** Price for the whole line, or null if the item has no price. */
export function lineTotal(
  item: Pick<Item, 'quantity' | 'unit' | 'price' | 'priceIsTotal'>,
): number | null {
  if (item.price == null) return null;
  if (item.priceIsTotal) return item.price;
  const unit = item.unit ?? 'pcs';
  const q = item.quantity ?? 1;
  if (unit === 'g' || unit === 'ml') return (q / 1000) * item.price;
  return q * item.price;
}

export function listTotal(items: Item[]): number | null {
  let total = 0;
  let any = false;
  for (const i of items) {
    const t = lineTotal(i);
    if (t != null) {
      total += t;
      any = true;
    }
  }
  return any ? total : null;
}

const round = (n: number) => Math.round(n * 1000) / 1000;

// --- Money -------------------------------------------------------------------

export interface Currency {
  code: string;
  symbol: string;
  /** Some currencies have no cents in everyday use. */
  decimals: 0 | 2;
}

/** Rs first: Zeste is made for Mauritius. Changing currency doesn't convert amounts. */
export const CURRENCIES: Currency[] = [
  { code: 'MUR', symbol: 'Rs', decimals: 2 },
  { code: 'EUR', symbol: '€', decimals: 2 },
  { code: 'USD', symbol: '$', decimals: 2 },
  { code: 'GBP', symbol: '£', decimals: 2 },
  { code: 'ZAR', symbol: 'R', decimals: 2 },
  { code: 'INR', symbol: '₹', decimals: 2 },
  { code: 'MGA', symbol: 'Ar', decimals: 0 },
  { code: 'SCR', symbol: 'SR', decimals: 2 },
  { code: 'AUD', symbol: 'A$', decimals: 2 },
  { code: 'CAD', symbol: 'C$', decimals: 2 },
];

// The chosen currency. Set by the language/settings provider (useI18n), which also
// re-renders the app when it changes.
let currency: Currency = CURRENCIES[0];

export function setCurrency(code: string) {
  currency = CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

export function currencySymbol(): string {
  return currency.symbol;
}

/** "Rs 1,240", "€12.50", "Ar 5,000": in the chosen currency. */
export function formatMoney(n: number): string {
  const factor = currency.decimals === 2 ? 100 : 1;
  const rounded = Math.round(n * factor) / factor;
  const hasCents = rounded % 1 !== 0;
  const number = rounded.toLocaleString('en', {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: currency.decimals,
  });
  // Letter symbols get a space ("Rs 12"); sign symbols don't ("€12").
  const space = /^[A-Za-z]+$/.test(currency.symbol) ? ' ' : '';
  return `${currency.symbol}${space}${number}`;
}

/** "500 g", "1.5 L", "2 pcs", "1 pack" (in the current language). */
export function formatQuantity(q: number, unit: Unit, t: Messages): string {
  const n = round(q).toLocaleString('en', { maximumFractionDigits: 3 });
  if (unit === 'pcs') return `${n} ${t.pieces(q === 1)}`;
  if (unit === 'pack') return `${n} ${t.packs(q === 1)}`;
  return `${n} ${unit}`;
}

/** Small grey line under the item name, e.g. "500 g · Rs 60/kg". */
export function itemDetails(item: Item, t: Messages): string | null {
  const unit = item.unit ?? 'pcs';
  const parts: string[] = [];
  if (item.quantity != null) parts.push(formatQuantity(item.quantity, unit, t));
  // A total price is already shown on the right, so only describe per-unit prices.
  if (item.price != null && !item.priceIsTotal) {
    const basis = priceBasis(unit);
    const price = formatMoney(item.price);
    parts.push(
      basis !== 'each'
        ? `${price}/${basis}`
        : unit === 'pack'
          ? t.pricePerPack(price)
          : t.priceEach(price),
    );
  }
  return parts.length ? parts.join(' · ') : null;
}

// --- Understanding "Rice 5kg", "2 eggs", "Coke 1.5L" typed in the add bar ---

const UNIT_WORDS: Record<string, Unit> = {
  // English, French and Kreol words
  pc: 'pcs', pcs: 'pcs', piece: 'pcs', pieces: 'pcs', pce: 'pcs', pièce: 'pcs', pièces: 'pcs', pies: 'pcs',
  pack: 'pack', packs: 'pack', pkt: 'pack', packet: 'pack', packets: 'pack', paquet: 'pack', paquets: 'pack', pake: 'pack',
  g: 'g', gm: 'g', gms: 'g', gr: 'g', gram: 'g', grams: 'g', gramme: 'g', grammes: 'g',
  kg: 'kg', kgs: 'kg', kilo: 'kg', kilos: 'kg',
  ml: 'ml',
  l: 'L', lt: 'L', ltr: 'L', litre: 'L', litres: 'L', liter: 'L', liters: 'L',
};
const UNIT_RE = Object.keys(UNIT_WORDS)
  .sort((a, b) => b.length - a.length)
  .join('|');
const NUM = '(\\d+(?:[.,]\\d+)?)';

const toNumber = (s: string) => Number(s.replace(',', '.'));

export interface Parsed {
  name: string;
  quantity?: number;
  unit?: Unit;
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function parseItemText(text: string): Parsed {
  const parsed = parse(text.trim().replace(/\s+/g, ' '));
  return { ...parsed, name: capitalise(parsed.name) };
}

function parse(t: string): Parsed {
  let m: RegExpMatchArray | null;

  // "Rice 5kg", "Coke 1.5 L"
  if ((m = t.match(new RegExp(`^(.+?) ?${NUM} ?(${UNIT_RE})$`, 'i'))) && m[1].trim()) {
    return { name: m[1].trim(), quantity: toNumber(m[2]), unit: UNIT_WORDS[m[3].toLowerCase()] };
  }
  // "Milk x2", "Milk 2x"
  if ((m = t.match(/^(.+?) (?:x ?(\d+)|(\d+) ?x)$/i))) {
    return { name: m[1], quantity: Number(m[2] ?? m[3]), unit: 'pcs' };
  }
  // "2kg rice", "500 g tomatoes"
  if ((m = t.match(new RegExp(`^${NUM} ?(${UNIT_RE}) (.+)$`, 'i')))) {
    return { name: m[3], quantity: toNumber(m[1]), unit: UNIT_WORDS[m[2].toLowerCase()] };
  }
  // "2 eggs", "2x eggs", "x2 eggs"
  if ((m = t.match(/^(?:x ?)?(\d{1,2}) ?x? (.+)$/i))) {
    return { name: m[2], quantity: Number(m[1]), unit: 'pcs' };
  }
  return { name: t };
}
