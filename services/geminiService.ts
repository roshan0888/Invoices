import { GoogleGenAI, Type } from "@google/genai";
import { SmartFillResponse } from "../types";

const parseInvoiceItems = async (description: string): Promise<SmartFillResponse | null> => {
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem('user_gemini_api_key') : null;
  const apiKey = storedKey || "AIzaSyDBH3M0o5T7nBi3gdcGLSqYaRKkydmbI-0";

  // Check for valid key
  if (!apiKey || apiKey.trim() === '') {
    console.error("Gemini Parse Error: API Key is missing or empty.");
    alert("System Error: API Key is missing. Please configure a custom key in Smart Assist settings.");
    return null;
  }

  // Remove potential extra quotes from JSON.stringify if present (double safety)
  const cleanKey = apiKey.replace(/['"]+/g, '');

  try {
    const ai = new GoogleGenAI({ apiKey: cleanKey });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash", 
      contents: `Extract invoice details or actions from this text. 
      
      Capabilities:
      1. Extract Client/Customer details (Name, Address, GSTIN, Phone).
      2. Extract Line items (Description, Quantity, Price).
      3. Identify actions to clear data based on user intent:
         - "Clear client", "Remove customer", "Reset client" -> actions.clearClient = true
         - "Clear items", "Remove products", "Reset items" -> actions.clearItems = true
         - "Remove payment", "Not paid", "Clear payment details", "Mark as unpaid" -> actions.markAsUnpaid = true
         - "Mark as paid", "Paid" -> actions.markAsPaid = true
      
      If a price or quantity is implied, use reasonable defaults.
      
      Text: "${description}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            actions: {
              type: Type.OBJECT,
              properties: {
                clearClient: { type: Type.BOOLEAN, description: "Set to true if user wants to clear/remove client details" },
                clearItems: { type: Type.BOOLEAN, description: "Set to true if user wants to remove all line items" },
                markAsUnpaid: { type: Type.BOOLEAN, description: "Set to true if user wants to remove payment status or mark as unpaid" },
                markAsPaid: { type: Type.BOOLEAN, description: "Set to true if user wants to mark invoice as paid" }
              }
            },
            clientDetails: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Client or Customer Name" },
                address: { type: Type.STRING, description: "Client Address" },
                gstin: { type: Type.STRING, description: "Client GSTIN" },
                phone: { type: Type.STRING, description: "Client Phone Number" }
              }
            },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING, description: "Description of the product or service" },
                  quantity: { type: Type.NUMBER, description: "Quantity sold" },
                  price: { type: Type.NUMBER, description: "The price or amount mentioned for the item" }
                },
                required: ["description", "quantity", "price"]
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    
    return JSON.parse(text) as SmartFillResponse;
  } catch (error) {
    console.error("Gemini Parse Error:", error);
    alert("AI service connection failed. If you are experiencing network restrictions or rate limits, you can easily paste your own free Gemini API key in the 'AI Service Settings' below the Smart Assist text box to resolve this.");
    return null;
  }
};

const testConnection = async (apiKey: string): Promise<{ success: boolean; errorDetails?: string }> => {
  if (!apiKey || apiKey.trim() === '') {
    return { success: false, errorDetails: "API Key is empty. Please enter a valid Gemini API key." };
  }
  
  const cleanKey = apiKey.replace(/['"]+/g, '');

  try {
    const ai = new GoogleGenAI({ apiKey: cleanKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash", 
      contents: "Respond with exactly the word: 'OK'",
    });

    if (response && response.text) {
      return { success: true };
    }
    return { success: false, errorDetails: "Empty response received from the model." };
  } catch (error: any) {
    console.error("Gemini Diagnostic Connection Failure:", error);
    let details = "Unknown connection error.";
    if (error instanceof Error) {
      details = error.message;
    } else if (typeof error === 'object' && error !== null) {
      details = JSON.stringify(error);
    } else if (typeof error === 'string') {
      details = error;
    }
    
    // Add extra network debugging hints based on the error content
    if (details.toLowerCase().includes("blocked") || details.toLowerCase().includes("location") || details.toLowerCase().includes("region") || details.toLowerCase().includes("not available")) {
      details = `Geographical Restriction: The Gemini API service might not be available in your country/region. ${details}`;
    } else if (details.toLowerCase().includes("api key not valid") || details.toLowerCase().includes("invalid key") || details.toLowerCase().includes("api_key_invalid")) {
      details = `Invalid Credentials: The API key provided is invalid. Please double check the key characters. ${details}`;
    } else if (details.toLowerCase().includes("quota") || details.toLowerCase().includes("rate limit") || details.toLowerCase().includes("limit exceeded") || details.toLowerCase().includes("429")) {
      details = `Rate Limit/Quota Block: You have exceeded the free trial limits or rate restrictions. ${details}`;
    } else if (details.toLowerCase().includes("fetch failed") || details.toLowerCase().includes("networkerror") || details.toLowerCase().includes("failed to fetch")) {
      details = `CORS/Network Restriction: Local browser connection was blocked by CORS policy, a proxy, or an ad-blocker. Try running inside a different region or using a VPN. ${details}`;
    }
    return { success: false, errorDetails: details };
  }
};

export const geminiService = {
  parseInvoiceItems,
  testConnection
};