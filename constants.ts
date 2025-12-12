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

// API Endpoints (Placeholders)
export const API_URL_DESIGN = "https://script.google.com/macros/s/AKfycbx_placeholder_design/exec";
export const API_URL_FURNITURE = "https://script.google.com/macros/s/AKfycbx_placeholder_furniture/exec";
export const API_URL_FEASIBILITY = "https://script.google.com/macros/s/AKfycbx_placeholder_feasibility/exec";
export const API_URL_DASHBOARD = "https://script.google.com/macros/s/AKfycbx_placeholder_dashboard/exec";

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
  },
  { 
    id: 'ORD-002', 
    type: 'Design', 
    client: 'Private Villa - Al Hamra', 
    date: '2023-10-24', 
    status: 'In Progress', 
    amount: 'N/A',
    phone: '+966 55 987 6543',
    email: 'client@gmail.com',
    location: 'Al Hamra, Riyadh',
    areaSize: '450',
    scope: '2D Layout + 3D Render',
    style: 'Neoclassic',
    colors: 'Greige Luxury',
    budget: 'Luxury / VIP',
    images: ['https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400']
  },
  { 
    id: 'ORD-003', 
    type: 'Feasibility', 
    client: 'Downtown Mall', 
    date: '2023-10-23', 
    status: 'Completed', 
    amount: '$5,000',
    phone: '+966 54 111 2222',
    email: 'investor@holding.com',
    location: 'King Road, Jeddah',
    projectType: 'Retail',
    budget: '2,000,000 SAR',
    areaSize: '1200'
  },
  { 
    id: 'ORD-004', 
    type: 'Furniture', 
    client: 'Hilton Lobby', 
    date: '2023-10-22', 
    status: 'Pending', 
    amount: '$12,000',
    phone: '+966 56 333 4444',
    email: 'manager@hilton.com',
    items: [
      { id: '1', name: 'Chandelier', quantity: 2, specs: 'Crystal, 3m drop', imageBase64: null }
    ]
  },
  { 
    id: 'ORD-005', 
    type: 'Design', 
    client: 'Penthouse A', 
    date: '2023-10-20', 
    status: 'Completed', 
    amount: 'N/A',
    phone: '+966 59 888 7777',
    location: 'Marina Tower',
    scope: 'Full Turnkey',
    style: 'Modern Minimalist',
    colors: 'Ocean Breeze'
  },
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