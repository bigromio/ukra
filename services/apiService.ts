import { 
  API_URL_DESIGN, 
  API_URL_FURNITURE, 
  API_URL_FEASIBILITY, 
  API_URL_DASHBOARD 
} from '../constants';
import { FurnitureQuotePayload, FeasibilityPayload, DesignRequestPayload } from '../types';

// We reuse one of the URLs for Auth since it all goes to the same GAS script deployment usually
// In a real scenario, you might have a dedicated AUTH URL.
const API_AUTH = API_URL_DASHBOARD; 

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const postData = async (url: string, payload: any): Promise<any> => {
  try {
    // Simulating API call latency
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // FOR DEMO: If action is auth related, return mock success
    if (payload.action === 'register') return { success: true, message: "OTP Sent" };
    if (payload.action === 'verify_otp') return { success: true, user: { name: payload.fullName, email: payload.email, role: 'CLIENT' } };
    if (payload.action === 'login') return { success: true, user: { name: "Client User", email: payload.email, role: 'CLIENT' } };
    if (payload.action === 'get_my_orders') return { 
      success: true, 
      orders: [
        { id: 'REQ-101', type: 'Design', date: '2023-11-01', status: 'In Progress', details: 'Villa Design' },
        { id: 'REQ-102', type: 'Furniture', date: '2023-10-15', status: 'Completed', details: 'Hotel Lobby' }
      ] 
    };

    /* REAL FETCH IMPLEMENTATION:
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return await response.json();
    */
    
    console.log(`Mock Submission to [${url}] Successful:`, payload);
    return true; // For forms
  } catch (error) {
    console.error(`Submission to [${url}] Failed:`, error);
    return false;
  }
};

// --- Client Auth Services ---

export const registerClient = async (fullName: string, email: string, phone: string, password: string): Promise<any> => {
  return postData(API_AUTH, { action: 'register', fullName, email, phone, password });
};

export const verifyClientOTP = async (email: string, otp: string, userData: any): Promise<any> => {
  return postData(API_AUTH, { action: 'verify_otp', email, otp, ...userData });
};

export const loginClient = async (email: string, password: string): Promise<any> => {
  return postData(API_AUTH, { action: 'login', email, password });
};

export const fetchClientOrders = async (email: string): Promise<any> => {
  return postData(API_AUTH, { action: 'get_my_orders', email });
};

// --- Existing Form Services ---

export const submitDesignRequest = async (payload: DesignRequestPayload): Promise<boolean> => {
  return postData(API_URL_DESIGN, payload);
};

export const submitFurnitureQuote = async (payload: FurnitureQuotePayload): Promise<boolean> => {
  return postData(API_URL_FURNITURE, payload);
};

export const submitFeasibilityStudy = async (payload: FeasibilityPayload): Promise<boolean> => {
  return postData(API_URL_FEASIBILITY, payload);
};

export const fetchDashboardData = async () => {
  console.log(`Fetching dashboard data from: ${API_URL_DASHBOARD}`);
  await new Promise(resolve => setTimeout(resolve, 1000));
  return null;
};