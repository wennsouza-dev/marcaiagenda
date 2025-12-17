
export interface Service {
  id: string;
  name: string;
  duration: number; // em minutos
  price: number;
  preBooking?: boolean;
  preBookingRules?: string;
}

export interface Professional {
  id: string;
  slug: string;
  name: string;
  salonName?: string;
  category: string;
  city: string;
  bio: string;
  imageUrl: string;
  rating: number;
  services: Service[];
  expireDays?: number;
  whatsapp?: string;
  address?: string;
  customLink?: string;
}

export interface Appointment {
  id: string;
  professionalId: string;
  clientName: string;
  serviceId: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export enum AppView {
  LANDING = 'landing',
  CLIENTS = 'clients',
  PROFESSIONAL_LOGIN = 'pro_login',
  PROFESSIONAL_DASHBOARD = 'pro_dashboard',
  DEVELOPER_PANEL = 'dev_panel'
}
