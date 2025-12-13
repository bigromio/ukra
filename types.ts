export enum UserRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
  CLIENT = 'CLIENT', // Added Client Role
}

export interface User {
  username?: string; // For Admin
  email?: string; // For Client
  role: UserRole;
  name: string;
  phone?: string;
}

export interface ClientOrder {
  id: string;
  type: string;
  date: string;
  status: string;
  details: string;
  driveUrl?: string;
}

// ... existing types (FurnitureItem, etc.) remain unchanged ...
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
  budget: any; 
  areaSize: any;
  projectType: string;
  contactName: string;
  contactEmail: string;
  timestamp?: string;
}

export interface DesignImage {
  boxId: string;
  name: string;
  type: string;
  data: string;
  preview?: string;
}

export interface DesignRequestPayload {
  lang: string;
  referralSource: string;
  salesCode: string;
  fullName: string;
  phone: string;
  email: string;
  location: string;
  projectName: string;
  propertyType: string;
  area: string;
  scope: string;
  style: string;
  colors: string;
  prefColors: string;
  dislikes: string;
  budget: string;
  notes: string;
  images: DesignImage[];
}

export interface OrderData {
  id: string;
  type: 'Design' | 'Furniture' | 'Feasibility';
  status: 'Pending' | 'In Progress' | 'Completed';
  client: string;
  date: string;
  amount?: string;
  driveFolderUrl?: string;
  phone?: string;
  email?: string;
  location?: string;
  budget?: string;
  notes?: string;
  items?: FurnitureItem[];
  scope?: string;
  style?: string;
  colors?: string;
  areaSize?: string;
  projectType?: string;
  images?: string[];
  details?: string;
}

export interface DashboardStats {
  totalRequests: number;
  designCount: number;
  furnitureCount: number;
  feasibilityCount: number;
  monthlyData: { name: string; requests: number }[];
}