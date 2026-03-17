import OpenAI from "openai";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const tools = JSON.parse(fs.readFileSync("./tools.json", "utf-8"));

export async function resolveIntent({ query, intent, parameters }) {
  if (intent) {
    return {
      status: "resolved",
      action: intent,
      parameters: parameters || {},
      confidence: 1.0,
      explanation: "Intent provided directly"
    };
  }

  if (!query) {
    return { status: "error", message: "Missing query" };
  }

  const systemPrompt = `
You are an intent resolver for a human-friendly API.

Rules:
1. Map natural language to one of these actions:
${JSON.stringify(tools.tools, null, 2)}

2. Extract parameters
3. Respond ONLY in JSON

Example response format:
{
  "action": "createOrder",
  "parameters": { "product": "pizza", "quantity": 2 },
  "confidence": 0.9,
  "explanation": "Detected order intent"
}
`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query }
      ],
      temperature: 0
    });

    const content = response.choices[0].message.content;

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      return { status: "error", message: "LLM did not return valid JSON" };
    }

    const allowedActions = tools.tools.map(t => t.name);
    if (!allowedActions.includes(parsed.action)) {
      return { status: "error", message: "Action not allowed" };
    }

    if (parsed.confidence < 0.6) {
      return { status: "ambiguous", candidates: [{ intent: parsed.action }], message: "Intent unclear" };
    }

    return {
      status: "resolved",
      action: parsed.action,
      parameters: parsed.parameters || {},
      confidence: parsed.confidence || 0.8,
      explanation: parsed.explanation || "Interpreted via AI"
    };
  } catch (err) {
    return { status: "error", message: err.message };
  }
}