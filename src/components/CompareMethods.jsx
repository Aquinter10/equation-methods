import { GoogleGenAI } from "@google/genai";

// src/services/gemini.js
let ai = new GoogleGenAI({ apiKey : "apikeyheretoomuch" });

export async function generateText(prompt) {
  const response = await ai.models.generateContent({
    model : "gemini-2.0-flash",
    contents: [
      {
        role: "user",
        text: prompt,
      },
    ],
  });
  return response.text;   
}
