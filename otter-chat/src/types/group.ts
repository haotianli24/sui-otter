export interface Group {
  id: string;
  name: string;
  description: string;
  type: 'free' | 'paid';
  price?: number; // SUI amount for paid communities
  maxMembers: number;
  currentMembers: number;
  creator: string;
  createdAt: string;
}
