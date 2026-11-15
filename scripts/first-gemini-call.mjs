import { readFileSync } from "node:fs";
import { GoogleGenAI } from "@google/genai";

const opportunities = JSON.parse(
  readFileSync("data/opportunities.json", "utf8"),
);
const grant = opportunities.find((record) => record.id === "try-it-fund");

const question = "I want to test a small business idea. Could this help me?";

const prompt = `
Answer the student's question using only the grant record below.
If the record doesn't include something, say it isn't listed.

Grant record:
${JSON.stringify(grant, null, 2)}

Student's question:
${question}
`;

const ai = new GoogleGenAI({});

const interaction = await ai.interactions.create({
  model: "gemini-3.5-flash-lite",
  input: prompt,
});

console.log(interaction.output_text);