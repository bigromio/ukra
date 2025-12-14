
export enum UserRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
  CLIENT = 'CLIENT',
}

export interface User {
  username?: string;
  email?: string;
  role: UserRole;
  name: string;
  phone?: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  url: string;
  size?: number;
  date?: string;
}

export interface OrderLog {
  orderId: string;
  timestamp: string;
  user: string;
  type: 'Note' | 'File' | 'Delete';
  content: string;
}

export interface ClientOrder {
  id: string;
  type: string;
  date: string;
  status: string;
  details: string;
  driveUrl?: string;
}

// ... existing furniture types ...
export interface FurnitureItem {
  id: string;
  name: string;
  quantity: number;
  specs: string;
  imageBase64: string | null;
}

// تحديث في ملف types.ts
export interface FurnitureQuotePayload {
  lang: string;
  type: 'Furniture Request';
  client: {
    name: string;
    phone: string;
    email: string;
    source: string;
  };
  project: {
    category: string;
    type: string;
    name: string;
    woodType: string;
    level: string;
    style: string;
    notes: string;
    packages: string[];
    details: string; // JSON string of spaces
  };
  files: { name: string; base64: string }[];
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

export interface BookingPayload {
  name: string;
  phone: string;
  email: string;
  service: string;
  date: string;
  time: string;
  reason: string;
  timestamp: string;
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