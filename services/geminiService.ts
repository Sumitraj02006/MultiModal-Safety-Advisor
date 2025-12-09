import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { AnalysisResult, GroundingChunk } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to convert file/blob to base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeSafety = async (
  promptText: string,
  imageBase64?: string,
  location?: { lat: number; lng: number }
): Promise<AnalysisResult> => {
  
  const modelId = 'gemini-2.5-flash';
  
  const parts: any[] = [];
  
  // Construct the prompt
  let fullPrompt = `You are Safety Scout, an expert security and safety analyst. 
  Analyze the provided context (location description, coordinates, or image) for safety concerns.
  
  Output Requirements:
  1. A Safety Score (0-100), where 100 is perfectly safe and 0 is extremely dangerous.
  2. A concise Summary of the safety situation.
  3. A list of potential Risks (bullet points).
  4. A list of Safe Havens or positive safety features (bullet points).
  
  Format the text output in Markdown.
  Use the Google Search tool to find recent crime reports, news, or safety reviews for this specific area if a location name or coordinates are provided.
  If an image is provided, analyze the visual cues (lighting, crowd, environment condition).
  `;

  if (location) {
    fullPrompt += `\nCoordinate Context: ${location.lat}, ${location.lng}`;
  }
  
  fullPrompt += `\nUser Query/Context: ${promptText}`;

  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg', // Assuming jpeg for simplicity, but could be png
        data: imageBase64
      }
    });
  }
  
  parts.push({ text: fullPrompt });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config: {
        tools: [{ googleSearch: {} }],
        // Note: responseMimeType: 'application/json' is NOT compatible with googleSearch tools in current SDK versions usually.
        // We will parse the text manually or rely on structured text parsing.
      }
    });

    const text = response.text || "No analysis available.";
    
    // Extract sources from grounding metadata
    const sources: Array<{ title: string; uri: string }> = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] | undefined;
    
    if (chunks) {
      chunks.forEach(chunk => {
        if (chunk.web) {
          sources.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
      });
    }

    // Heuristic parsing for the structured data (since we can't force JSON with search tool easily)
    // We try to find a number for score, and split the rest.
    const scoreMatch = text.match(/Safety Score:?\s*\*?(\d+)\*?/i);
    const safetyScore = scoreMatch ? parseInt(scoreMatch[1], 10) : 50; // Default to neutral if parsing fails

    return {
      safetyScore,
      summary: text, // We return the full markdown text for rendering
      risks: [], // Handled in markdown rendering
      safeHavens: [], // Handled in markdown rendering
      sources
    };

  } catch (error) {
    console.error("Safety Analysis Error:", error);
    throw new Error("Failed to analyze safety. Please try again.");
  }
};

export const createEmergencyChat = (): Chat => {
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: "You are Safety Scout, a calm and helpful emergency advisor. Provide clear, concise, and actionable advice for safety and emergency situations. Prioritize user safety. If a situation seems life-threatening, immediately advise calling local emergency services (like 911). Do not provide legal or medical advice, but offer first-aid guidelines if asked.",
    }
  });
};
