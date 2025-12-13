import { User, UserRole, OrderData } from './types';

// Mock Users
export const MOCK_USERS: Record<string, User & { pin: string }> = {
  'admin': { username: 'admin', pin: '1234', role: UserRole.OWNER, name: 'Eleanor (Owner)' },
  'manager': { username: 'manager', pin: '1234', role: UserRole.MANAGER, name: 'James (Manager)' },
  'staff': { username: 'staff', pin: '1234', role: UserRole.EMPLOYEE, name: 'Sarah (Staff)' },
};

// Geofencing Target (24.46, 39.61)
export const GEOFENCE_TARGET = {
  lat: 24.46,
  lng: 39.61,
  radiusMeters: 500
};

// API Endpoints - Updated to the NEW Script URL
const UNIFIED_API_URL = "https://script.google.com/macros/s/AKfycbyaOd_30KSbMf6q0ClLoTsIhjbIFihAA7ySb4vfJSANJ6zhx05dyFGwDbx2aBr_t6by7A/exec";

export const API_URL_DASHBOARD = UNIFIED_API_URL;
export const API_URL_DESIGN = UNIFIED_API_URL;
export const API_URL_FURNITURE = UNIFIED_API_URL;
export const API_URL_FEASIBILITY = UNIFIED_API_URL;

// Mock Data for Dashboard when API fails
export const MOCK_ORDERS: OrderData[] = [
  { 
    id: 'ORD-001', 
    type: 'Furniture', 
    client: 'Ritz Carlton', 
    date: '2023-10-25', 
    status: 'Pending', 
    amount: '$45,000',
    phone: '+966 50 123 4567',
    email: 'purchasing@ritz.com',
    driveFolderUrl: 'https://drive.google.com',
    items: [
      { id: '1', name: 'Velvet Armchair', quantity: 50, specs: 'Royal Blue, Gold legs', imageBase64: null },
      { id: '2', name: 'Marble Coffee Table', quantity: 25, specs: 'Carrara white, 120cm', imageBase64: null }
    ]
  }
];

export const MOCK_STATS = {
  totalRequests: 142,
  designCount: 45,
  furnitureCount: 80,
  feasibilityCount: 17,
  monthlyData: [
    { name: 'Jan', requests: 12 },
    { name: 'Feb', requests: 19 },
    { name: 'Mar', requests: 15 },
    { name: 'Apr', requests: 22 },
    { name: 'May', requests: 30 },
    { name: 'Jun', requests: 44 },
  ]
};