import { 
  API_URL_DESIGN, 
  API_URL_FURNITURE, 
  API_URL_FEASIBILITY, 
  API_URL_DASHBOARD 
} from '../constants';
import { FurnitureQuotePayload, FeasibilityPayload, DesignRequestPayload } from '../types';

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
    const response = await fetch(url, {
      method: 'POST',
      redirect: 'follow', 
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', 
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Server returned non-JSON response:", text);
      throw new Error("Invalid server response");
    }

  } catch (error) {
    console.error(`Submission to [${url}] Failed:`, error);
    return { success: false, message: "تعذر الاتصال بالخادم." }; 
  }
};

// --- Auth & Users ---

export const registerClient = async (fullName: string, email: string, phone: string, password: string): Promise<any> => {
  return postData(API_AUTH, { action: 'register', fullName, email, phone, password });
};

export const verifyClientOTP = async (email: string, otp: string, userData: any): Promise<any> => {
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

export const fetchUserRole = async (email: string): Promise<any> => {
  return postData(API_AUTH, { action: 'get_user_role', email });
};

export const updateClientProfile = async (oldEmail: string, updateData: any): Promise<any> => {
  return postData(API_AUTH, { action: 'update_profile', oldEmail, ...updateData });
};

export const deleteClientAccount = async (email: string): Promise<any> => {
  return postData(API_AUTH, { action: 'delete_account', email });
};

// --- Order Files & Notes Management ---

// Fetches both files and logs (notes)
export const fetchOrderDetails = async (folderUrl: string, orderId: string): Promise<any> => {
  return postData(API_AUTH, { action: 'get_order_details', folderUrl, orderId });
};

export const uploadOrderFile = async (
  folderUrl: string, 
  file: File, 
  orderId: string, 
  clientEmail?: string, // To notify client
  uploaderName?: string
): Promise<any> => {
  const base64Full = await fileToBase64(file);
  const base64 = base64Full.split(',')[1];
  
  return postData(API_AUTH, { 
    action: 'upload_file', 
    folderUrl, 
    base64, 
    fileName: file.name, 
    mimeType: file.type,
    orderId,
    clientEmail,
    uploaderName
  });
};

export const addOrderNote = async (
  orderId: string,
  content: string,
  authorName: string,
  clientEmail?: string
): Promise<any> => {
  return postData(API_AUTH, {
    action: 'add_note',
    orderId,
    content,
    authorName,
    clientEmail
  });
};

export const deleteOrderFile = async (fileId: string, orderId: string, userName: string): Promise<any> => {
  return postData(API_AUTH, { action: 'delete_file', fileId, orderId, userName });
};

// --- Data Fetching ---

export const fetchClientOrders = async (email: string): Promise<any> => {
  return postData(API_AUTH, { action: 'get_my_orders', email });
};

export const fetchAllOrders = async (): Promise<any> => {
  return postData(API_AUTH, { action: 'get_my_orders', email: null });
};

// --- Form Submission ---

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