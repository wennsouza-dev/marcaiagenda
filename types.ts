
export interface Service {
  id: string;
  name: string;
  duration: number; // in minutes
  price: number;
}

export interface Professional {
  id: string;
  slug: string;
  name: string;
  category: string;
  bio: string;
  imageUrl: string;
  rating: number;
  services: Service[];
}

export interface Appointment {
  id: string;
  professionalId: string;
  clientId: string;
  serviceId: string;
  date: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export enum AppTab {
  MARKETPLACE = 'marketplace',
  DASHBOARD = 'dashboard',
  ARCHITECT = 'architect'
}
