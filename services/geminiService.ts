import { GoogleGenAI, Type } from "@google/genai";
import { GeminiAdvice } from '../types';

const API_KEY = process.env.API_KEY || '';

// Mock response if no key provided to prevent crash in preview
const MOCK_ADVICE: GeminiAdvice = {
  summary: "Ruta calculada con precaución.",
  tips: [
    "Mantén tus pertenencias guardadas.",
    "Camina por zonas iluminadas.",
    "Evita usar el celular visiblemente en esquinas solas."
  ]
};

export const getSafetyAdvice = async (
  origin: string, 
  destination: string, 
  safetyScore: number
): Promise<GeminiAdvice> => {
  if (!API_KEY) {
    console.warn("Gemini API Key missing, returning mock advice.");
    return MOCK_ADVICE;
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const prompt = `
    Actúa como un experto en seguridad urbana para estudiantes en Popayán, Colombia.
    Un estudiante va a caminar desde ${origin} hasta ${destination}.
    El nivel de riesgo calculado de la ruta es ${safetyScore.toFixed(1)} (1 es muy seguro, 10 es muy peligroso).
    
    Provee un resumen corto y 3 consejos puntuales de seguridad.
    Responde estrictamente en formato JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            tips: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text) as GeminiAdvice;
    }
    return MOCK_ADVICE;
  } catch (error) {
    console.error("Error getting advice from Gemini:", error);
    return MOCK_ADVICE;
  }
};