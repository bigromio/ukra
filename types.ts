export enum UserRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

export interface User {
  username: string;
  role: UserRole;
  name: string;
}

export interface FurnitureItem {
  id: string;
  name: string;
  quantity: number;
  specs: string;
  imageBase64: string | null;
}

export interface FurnitureQuotePayload {
  type: 'furniture';
  items: FurnitureItem[];
  contactName: string;
  contactEmail: string;
  timestamp: string;
}

export interface FeasibilityPayload {
  type: 'feasibility';
  location: string;
  budget: number;
  areaSize: number;
  projectType: 'Retail' | 'Hotel' | 'Other';
  contactName: string;
  contactEmail: string;
  timestamp: string;
}

export interface OrderData {
  id: string;
  type: 'Design' | 'Furniture' | 'Feasibility';
  status: 'Pending' | 'In Progress' | 'Completed';
  client: string;
  date: string;
  amount?: string;
}

export interface DashboardStats {
  totalRequests: number;
  designCount: number;
  furnitureCount: number;
  feasibilityCount: number;
  monthlyData: { name: string; requests: number }[];
}