import { GAS_API_URL } from '../constants';
import { FurnitureQuotePayload, FeasibilityPayload } from '../types';

// Convert File to Base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

type SubmissionPayload = FurnitureQuotePayload | FeasibilityPayload | any;

export const submitToGAS = async (payload: SubmissionPayload): Promise<boolean> => {
  try {
    // In production with GAS, strict CORS often fails. 
    // Using 'no-cors' is common for fire-and-forget, but for data we use standard POST
    // Assuming the GAS script is deployed as Web App with "Anyone" access.
    
    // Simulating API call latency
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Uncomment below for real fetch
    /*
    await fetch(GAS_API_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
      mode: 'no-cors', // Important for GAS Web Apps usually
      headers: {
        'Content-Type': 'application/json',
      },
    });
    */
    
    console.log("Mock Submission Successful:", payload);
    return true;
  } catch (error) {
    console.error("Submission Failed:", error);
    return false;
  }
};

export const fetchDashboardData = async () => {
  // Mock fetch
  await new Promise(resolve => setTimeout(resolve, 1000));
  return null; // Returning null forces the dashboard to use Mock Data defined in constants
};