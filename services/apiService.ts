import { 
  API_URL_DESIGN, 
  API_URL_FURNITURE, 
  API_URL_FEASIBILITY, 
  API_URL_DASHBOARD,
  API_URL_BOOKING
} from '../constants';
import { FurnitureQuotePayload, FeasibilityPayload, DesignRequestPayload, BookingPayload } from '../types';

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
      const json = JSON.parse(text);
      // Helper for debugging: Log if operation was NOT successful
      if (!json.success && payload.action && payload.action.includes('delete')) {
         console.error("Delete operation failed on server:", json.message);
      }
      return json;
    } catch (e) {
      console.error("Server returned non-JSON response:", text);
      // If the response is the specific JSON error string mentioned in the prompt, parse it manually
      if (text.includes('Unknown Action')) {
          try {
             return JSON.parse(text);
          } catch (err) {
             throw new Error("Invalid server response. Check console.");
          }
      }
      throw new Error("Invalid server response. Check console.");
    }

  } catch (error) {
    console.error(`Submission to [${url}] Failed:`, error);
    // Return a structured error so the UI handles it
    return { success: false, message: "Network Error: " + error }; 
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
  console.log("Attempting to delete account for:", email);
  return postData(API_AUTH, { action: 'delete_account', email });
};

// --- Admin User Management (New) ---

export const fetchAllUsers = async (): Promise<any> => {
  return postData(API_AUTH, { action: 'get_all_users' });
};

export const adminUpdateUserRole = async (targetEmail: string, newRole: string): Promise<any> => {
  return postData(API_AUTH, { action: 'admin_update_user', targetEmail, newRole });
};

export const adminDeleteUser = async (targetEmail: string): Promise<any> => {
  console.log("Admin Delete Payload:", { action: 'admin_delete_user', targetEmail });
  return postData(API_AUTH, { action: 'admin_delete_user', targetEmail });
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
  console.log("Delete File Payload:", { action: 'delete_file', fileId, orderId, userName });
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
  // Added action 'submit_design' to ensure the script knows what to do
  const result = await postData(API_URL_DESIGN, { ...payload, action: 'submit_design' });
  return result && (result.status === 'success' || result.success === true);
};

export const submitFurnitureQuote = async (payload: FurnitureQuotePayload): Promise<boolean> => {
  const result = await postData(API_URL_FURNITURE, { ...payload, action: 'submit_furniture' });
  return !!result && (result.status === 'success' || result.success === true);
};

export const submitFeasibilityStudy = async (payload: FeasibilityPayload): Promise<boolean> => {
  const result = await postData(API_URL_FEASIBILITY, { ...payload, action: 'submit_feasibility' });
  return !!result && (result.status === 'success' || result.success === true);
};

// New: Submit Booking
export const submitBooking = async (payload: BookingPayload): Promise<any> => {
  // We expect the script to return { success: true } or { success: false, message: 'Slot unavailable' }
  const result = await postData(API_URL_BOOKING, { ...payload, action: 'book_appointment' });
  return result;
};

export const fetchDashboardData = async () => {
  return null;
};