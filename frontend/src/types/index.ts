export interface Event {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  capacity: number;
  enrolled: number;
  minAge: number;
  maxAge: number;
  gender: 'all' | 'male' | 'female';
  price: number;
  status: 'draft' | 'published' | 'full' | 'archived';
  location: string;
}

export interface Camper {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  age: number;
  gender: 'male' | 'female';
  school: string;
  grade: string;
  city: string;
  state: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  allergies: string[];
  registrations: string[];
}

export interface DashboardStats {
  totalCampers: number;
  totalEvents: number;
  totalRevenue: number;
  capacityUtilization: number;
  upcomingEvents: number;
  pendingForms: number;
}
