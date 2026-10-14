export interface Item {
  id: string;
  name: string;
  checked: boolean;
  createdAt: number;
  addedBy?: string;
}

export interface Profile {
  uid: string;
  isGuest: boolean;
  name: string | null;
  email: string | null;
  photoURL: string | null;
}
