import { GoogleGenAI, Type } from "@google/genai";

export { Type };

// Standard API key fallbacks
const apiKey = process.env.NOVA_API_KEY || 
               process.env.GEMINI_API_KEY || 
               process.env["Ai studio Free Tier"] || 
               process.env["Ai Studio Free Tier"] || 
               process.env.GOOGLE_API_KEY;

if (!apiKey) {
  console.warn("[AI_LIB] No AI key found in environment variable.");
}

export { GoogleGenAI };
export const API_KEY = apiKey;

export const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export const MODELS = {
  FLASH: "gemini-3-flash-preview",
  PRO: "gemini-3.1-pro-preview",
  IMAGE: "gemini-2.5-flash-image",
  VIDEO: "veo-3.1-lite-generate-preview",
};
