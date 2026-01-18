
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini API client
// The API key is obtained exclusively from the environment variable process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a professional design concept brief based on project parameters.
 * Uses Gemini 1.5 Flash for fast, creative text generation.
 */
export const generateDesignConcept = async (
  projectType: string,
  style: string[],
  colors: string,
  budget: string
): Promise<string> => {
  try {
    const styleStr = style.length > 0 ? style.join(', ') : 'Modern';
    
    const prompt = `
      Act as a senior interior designer for UKRA Luxury Interiors.
      Write a concise, sophisticated, and professional design concept brief (approx 60-80 words) for a client's project with these specs:
      
      - Project Type: ${projectType}
      - Preferred Styles: ${styleStr}
      - Color Palette: ${colors || 'Neutral'}
      - Budget Level: ${budget}
      
      Focus on the atmosphere, material suggestions, and lighting mood. 
      Do not use markdown formatting (bold/italic). Write in a natural, inviting tone suitable for a project proposal.
      Output language: Detect the language of the input styles (Arabic or English) and respond in the same language. If mixed, default to English.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Could not generate concept. Please try again.";
  } catch (error) {
    console.error("Gemini AI Generation Error:", error);
    // Graceful fallback prevents app crash
    return ""; 
  }
};
