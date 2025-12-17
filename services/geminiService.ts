
import { GoogleGenAI } from "@google/genai";

export async function getSmartScheduleAdvice(prompt: string, context: any) {
  try {
    // Inicializa a IA apenas no momento da chamada para garantir que process.env.API_KEY esteja disponível
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Você é o MarcAI Assistant, um assistente de agendamento inteligente.
        Contexto do profissional: ${JSON.stringify(context)}
        Solicitação do cliente: ${prompt}
        
        Responda de forma curta e prestativa em português, sugerindo horários ou confirmando a intenção do usuário baseando-se na disponibilidade padrão (Seg-Sex, 09h às 18h).
      `,
    });
    return response.text || "Desculpe, não consegui processar seu agendamento agora.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Ocorreu um erro ao consultar o assistente de IA. Verifique se a API Key está configurada.";
  }
}
