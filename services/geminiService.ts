import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Attachment, Message } from "../types";

// Initialize API Client
// The API key must be obtained exclusively from the environment variable process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Define LiveSession type helper since it is not exported directly
export type LiveSession = Awaited<ReturnType<typeof ai.live.connect>>;

// --- Chat Functionality ---

export const sendMessageToGemini = async (
  history: Message[],
  newMessage: string,
  attachments: Attachment[] = []
): Promise<string> => {
  try {
    // Prepare contents. If there are images/files, we use a specific model, otherwise text model.
    const modelName = attachments.length > 0 ? 'gemini-2.5-flash-image' : 'gemini-2.5-flash';
    
    const parts: any[] = [];

    // Add attachments
    attachments.forEach(att => {
      parts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.data
        }
      });
    });

    // Add text prompt
    parts.push({ text: newMessage });

    // Add a system-like context by prepending to prompt (simulated system instruction for standard models)
    // Note: 2.5-flash supports systemInstruction in config, but we'll keep it simple here.
    const systemPrompt = "You are a helpful, collaborative team member in a work chat. Analyze any attached files (images, PDFs, data) and answer the user's questions concisely.";
    
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: {
        systemInstruction: systemPrompt
      }
    });

    return response.text || "I processed the information but couldn't generate a text response.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Sorry, I encountered an error processing your request.";
  }
};


// --- Live API Functionality ---

export interface LiveConnectionCallbacks {
  onOpen: () => void;
  onMessage: (message: LiveServerMessage) => void;
  onError: (error: ErrorEvent) => void;
  onClose: (event: CloseEvent) => void;
}

export const connectToLiveSession = async (callbacks: LiveConnectionCallbacks): Promise<LiveSession> => {
  const session = await ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks: {
      onopen: callbacks.onOpen,
      onmessage: callbacks.onMessage,
      onerror: callbacks.onError,
      onclose: callbacks.onClose,
    },
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: "You are a video conference participant. You can see what the user shows you via their camera and hear them. Be helpful, professional, and brief.",
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } }, // Professional sounding voice
      },
    },
  });
  return session;
};