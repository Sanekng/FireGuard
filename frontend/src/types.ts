export interface Camera {
  _id: string;
  name: string;
  description?: string;
  lat: number;
  lng: number;
  active?: boolean;
  status?: string;    // e.g. 'normal' | 'fire'
  isAlert?: boolean;  // local UI flag for highlighting
  createdAt?: string;
}
