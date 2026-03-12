import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
console.log("ai keys:", Object.keys(ai));
console.log("ai.models:", ai.models ? Object.keys(ai.models) : "undefined");
if (ai.models && typeof ai.models.generateContent === 'function') {
    console.log("generateContent is a function");
} else {
    console.log("generateContent is NOT a function");
}
