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

/**
 * Robust POST request handler for Google Apps Script.
 * 1. content-type: text/plain -> Prevents browser OPTIONS preflight (CORS check).
 * 2. redirect: follow -> Google Apps Script redirects 302 to the final content.
 */
const postData = async (url: string, payload: any): Promise<any> => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      redirect: 'follow', // Crucial for GAS Web Apps
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', 
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Attempt to parse JSON, handle potential HTML error pages from Google
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Server returned non-JSON response:", text);
      throw new Error("Invalid server response");
    }

  } catch (error) {
    console.error(`Submission to [${url}] Failed:`, error);
    return { success: false, message: "تعذر الاتصال بالخادم. تأكد من الإنترنت أو حاول لاحقاً." }; 
  }
};

// --- Client Auth Services ---

export const registerClient = async (fullName: string, email: string, phone: string, password: string): Promise<any> => {
  return postData(API_AUTH, { action: 'register', fullName, email, phone, password });
};

export const verifyClientOTP = async (email: string, otp: string, userData: any): Promise<any> => {
  // We send userData again because the backend creates the user only after OTP verification
  return postData(API_AUTH, { 
    action: 'verify_otp', 
    email, 
    otp, 
    fullName: userData.fullName, 
    phone: userData.phone, 
    password: userData.password 
  });
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
  return result && (result.status === 'success' || result.success === true);
};

export const submitFurnitureQuote = async (payload: FurnitureQuotePayload): Promise<boolean> => {
  const result = await postData(API_URL_FURNITURE, payload);
  return !!result && (result.status === 'success' || result.success === true);
};

export const submitFeasibilityStudy = async (payload: FeasibilityPayload): Promise<boolean> => {
  const result = await postData(API_URL_FEASIBILITY, payload);
  return !!result && (result.status === 'success' || result.success === true);
};

export const fetchDashboardData = async () => {
  return null;
};