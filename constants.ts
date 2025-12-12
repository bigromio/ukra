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

// Google Apps Script URL (Placeholder)
export const GAS_API_URL = "https://script.google.com/macros/s/AKfycbx_placeholder_id/exec";

// Mock Data for Dashboard when API fails
export const MOCK_ORDERS: OrderData[] = [
  { id: 'ORD-001', type: 'Furniture', client: 'Ritz Carlton', date: '2023-10-25', status: 'Pending', amount: '$45,000' },
  { id: 'ORD-002', type: 'Design', client: 'Private Villa', date: '2023-10-24', status: 'In Progress', amount: 'N/A' },
  { id: 'ORD-003', type: 'Feasibility', client: 'Downtown Mall', date: '2023-10-23', status: 'Completed', amount: '$5,000' },
  { id: 'ORD-004', type: 'Furniture', client: 'Hilton Lobby', date: '2023-10-22', status: 'Pending', amount: '$12,000' },
  { id: 'ORD-005', type: 'Design', client: 'Penthouse A', date: '2023-10-20', status: 'Completed', amount: 'N/A' },
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