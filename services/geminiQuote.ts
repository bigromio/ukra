
import { GoogleGenAI } from "@google/genai";
import { FURNITURE_CATALOG, CatalogItem } from '../data/furnitureCatalog';

// IMPORTANT: In a real production app, this call should ideally happen on the backend (Cloud Function/GAS) 
// to protect the API Key. For this architecture, we assume the key is environment variable or passed securely.
// Using a placeholder key for demonstration if process.env is not set.
const API_KEY = process.env.REACT_APP_GEMINI_API_KEY || ""; 

export interface QuoteItem extends CatalogItem {
  quantity: number;
  totalPrice: number;
}

export const generateSmartQuote = async (
  projectDetails: string,
  level: string // 'Economic' | 'Medium' | 'VIP'
): Promise<QuoteItem[]> => {
  
  // If no API key is configured, fallback to a basic heuristic logic
  if (!API_KEY || API_KEY === "") {
    console.warn("Gemini API Key missing. Using fallback logic.");
    return fallbackLogic(projectDetails, level);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    // Prepare Catalog Context (Simplified to save tokens)
    const catalogContext = FURNITURE_CATALOG.map(i => `${i.id}: ${i.name} (${i.category}) - ${i.price} SAR`).join('\n');

    const prompt = `
      You are an expert Quantity Surveyor for a Hotel Furniture Company.
      
      Catalog Available:
      ${catalogContext}

      Project Details:
      ${projectDetails}
      
      Desired Level: ${level}

      Task:
      Based on the project details, select appropriate items from the catalog and estimate quantities.
      For example, if the user says "10 Hotel Rooms", you should add Beds, Nightstands, Wardrobes, Minibars, etc. for EACH room.
      If the level is VIP, choose higher priced items or add more accessories.
      
      Return ONLY a JSON array of objects with this structure:
      [
        { "id": "catalog_id", "quantity": number }
      ]
      Do not add markdown formatting.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || "[]";
    const suggestedItems = JSON.parse(text);

    // Map back to full catalog items
    const fullItems: QuoteItem[] = suggestedItems.map((s: any) => {
      const original = FURNITURE_CATALOG.find(c => c.id === s.id);
      if (!original) return null;
      return {
        ...original,
        quantity: s.quantity,
        totalPrice: original.price * s.quantity
      };
    }).filter((i: any) => i !== null);

    return fullItems;

  } catch (error) {
    console.error("AI Generation Failed:", error);
    return fallbackLogic(projectDetails, level);
  }
};

// Fallback logic if AI fails or no key
const fallbackLogic = (details: string, level: string): QuoteItem[] => {
  const items: QuoteItem[] = [];
  
  // Simple regex to find "rooms" count
  const roomMatch = details.match(/(\d+)\s*(?:room|غرفة|غرف)/i);
  const roomCount = roomMatch ? parseInt(roomMatch[1]) : 1;

  // Add Basic Room Setup
  const basics = ['f-headboard', 'f-bedbase-double', 'l-mattress-vip', 'f-nightstand', 'f-wardrobe'];
  
  basics.forEach(id => {
    const item = FURNITURE_CATALOG.find(i => i.id === id);
    if (item) {
      items.push({
        ...item,
        quantity: roomCount * (id === 'f-nightstand' ? 2 : 1), // 2 nightstands per room
        totalPrice: item.price * roomCount
      });
    }
  });

  return items;
};
