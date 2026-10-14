export type Unit = 'pcs' | 'pack' | 'g' | 'kg' | 'ml' | 'L';

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
  createdAt: number;
  /** Position in the list. Older items without it fall back to createdAt. */
  order?: number;
  addedBy?: string;
}

export interface Profile {
  uid: string;
  isGuest: boolean;
  name: string | null;
  email: string | null;
  photoURL: string | null;
}
