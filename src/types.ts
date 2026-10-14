export interface Item {
  id: string;
  name: string;
  checked: boolean;
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
