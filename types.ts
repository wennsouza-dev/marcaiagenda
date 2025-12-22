
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
  gallery?: string[];
  resetWord?: string;
  expireDays?: number;
  whatsapp?: string;
  address?: string;
  customLink?: string;
  password?: string;
  business_hours?: any; // Configurações de expediente, almoço e datas especiais
}

export interface Appointment {
  id: string;
  professionalId: string;
  clientName: string;
  clientPhone?: string;
  serviceId?: string;
  serviceName?: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'concluded';
  isPreBooking?: boolean;
}

export enum AppView {
  LANDING = 'landing',
  CLIENTS = 'clients',
  PROFESSIONAL_PROFILE = 'pro_profile',
  PROFESSIONAL_LOGIN = 'pro_login',
  PROFESSIONAL_DASHBOARD = 'pro_dashboard',
  DEVELOPER_PANEL = 'dev_panel',
  REVIEW = 'review'
}
