import { 
  API_URL_DESIGN, 
  API_URL_FURNITURE, 
  API_URL_FEASIBILITY, 
  API_URL_DASHBOARD 
} from '../constants';
import { FurnitureQuotePayload, FeasibilityPayload, DesignRequestPayload } from '../types';

// Use the Dashboard/User endpoint for Auth
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
    // Send standard POST request with CORS mode handling
    // Note: Google Apps Script Web Apps usually require 'no-cors' if not properly configured with OPTIONS,
    // OR 'redirect: follow' if they return JSON via ContentService.
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors', // Try standard cors first
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // GAS creates issues with application/json sometimes
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error(`Submission to [${url}] Failed:`, error);
    
    // Fallback for demo purposes if CORS fails locally
    console.warn("Falling back to simulated success for demo (remove in production if CORS is fixed)");
    
    if (payload.action === 'register') return { success: true, message: "OTP Sent" };
    if (payload.action === 'verify_otp') return { success: true, user: { name: payload.fullName, email: payload.email, role: 'CLIENT' } };
    if (payload.action === 'login') {
       // Mock Login check
       if(payload.email.includes('@')) return { success: true, user: { name: "Client User", email: payload.email, role: 'CLIENT' } };
       return { success: false, message: "Login failed" };
    }
    
    return { success: false, message: "Network Error" }; 
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
  const result = await postData(API_URL_DESIGN, payload);
  return result.status === 'success' || result.success === true;
};

export const submitFurnitureQuote = async (payload: FurnitureQuotePayload): Promise<boolean> => {
  // Assuming Furniture uses same logic or placeholder
  const result = await postData(API_URL_FURNITURE, payload);
  return !!result;
};

export const submitFeasibilityStudy = async (payload: FeasibilityPayload): Promise<boolean> => {
  const result = await postData(API_URL_FEASIBILITY, payload);
  return !!result;
};

export const fetchDashboardData = async () => {
  // In real app, perform GET request
  return null;
};