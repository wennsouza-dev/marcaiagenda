
import { GoogleGenAI } from "@google/genai";

/**
 * Service to interact with Gemini for smart scheduling advice.
 * Adheres strictly to the @google/genai library guidelines.
 */
export async function getSmartScheduleAdvice(prompt: string, context: any) {
  try {
    // Correctly initialize GoogleGenAI with API_KEY strictly from environment variable
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Você é o MarcAI Assistant, um assistente de agendamento inteligente.
        Contexto do profissional: ${JSON.stringify(context)}
        Solicitação do cliente: ${prompt}
        
        Responda de forma curta e prestativa em português, sugerindo horários ou confirmando a intenção do usuário baseando-se na disponibilidade padrão (Seg-Sex, 09h às 18h).
      `,
    });
    
    // Extracting generated text using the .text property (not a method) as per SDK rules
    return response.text || "Desculpe, não consegui processar seu agendamento agora.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Ocorreu um erro ao consultar o assistente de IA. Verifique se a API Key está configurada.";
  }
}