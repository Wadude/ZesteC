export type Unit = 'pcs' | 'pack' | 'g' | 'kg' | 'ml' | 'L';

export type Category =
  | 'produce'
  | 'bakery'
  | 'meat'
  | 'dairy'
  | 'frozen'
  | 'pantry'
  | 'snacks'
  | 'drinks'
  | 'household'
  | 'personal'
  | 'other';

export interface Item {
  id: string;
  name: string;
  checked: boolean;
  /** How many / how much. Missing means "not specified". */
  quantity?: number;
  unit?: Unit;
  /** Price in MUR: per kg for g/kg, per L for ml/L, otherwise each... */
  price?: number;
  /** ...unless this is true: then the price is for the whole line. */
  priceIsTotal?: boolean;
  /** Set automatically from the name when added; can be changed in the edit panel. */
  category?: Category;
  createdAt: number;
  /** Position in the list. Older items without it fall back to createdAt. */
  order?: number;
  addedBy?: string;
}

export interface List {
  id: string;
  name: string;
  ownerId: string;
  memberIds: string[];
  /** Code for the current invite link, if one has been made. */
  inviteCode?: string;
  /** Spending limit per month, in MUR. */
  monthlyBudget?: number;
}

/** One item as it was when a shop was saved. */
export interface TripItem {
  name: string;
  quantity?: number;
  unit?: Unit;
  total?: number;
}

/** One visit to the shops. */
export interface Trip {
  id: string;
  /** Amount paid, in MUR. */
  total: number;
  /** When it happened (milliseconds since 1970). */
  date: number;
  store?: string;
  itemCount: number;
  items: TripItem[];
  enteredBy: string;
}

export interface Profile {
  uid: string;
  isGuest: boolean;
  name: string | null;
  email: string | null;
  photoURL: string | null;
}
