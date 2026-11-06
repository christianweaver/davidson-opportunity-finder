import { readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { GoogleGenAI } from "@google/genai";

const opportunities = JSON.parse(
  readFileSync("data/opportunities.json", "utf8"),
);

// Remove mock records and other non-real data from opportunities.json rather than doing this
const candidates = opportunities.map(
  ({ isMock, type, themes, verificationStatus, dataAsOf, pastRecipientExperiences, ...rest }) => rest,
);
const recordsById = new Map(opportunities.map((record) => [record.id, record]));

const pick = {
  type: "object",
  properties: {
    id: { type: "string" },
    reason: { type: "string" },
  },
  required: ["id", "reason"],
};

const schema = {
  type: "object",
  properties: {
    message: { type: "string" },
    direct: { type: "array", items: pick },
    loose: { type: "array", items: pick },
  },
  required: ["message", "direct", "loose"],
};

function buildPrompt(history) {
  const conversation = history
    .map((turn) => `${turn.role}: ${turn.text}`)
    .join("\n");

  return `
Opportunities:
${JSON.stringify(candidates)}

Conversation so far:
${conversation}

You help Davidson College students find opportunities, having a natural
conversation. Reply to the student's latest message, using earlier messages to
understand what they mean by things like "this topic" or "that one".

- "message": a short, friendly reply addressed to the student as "you". If they
  ask about a specific record, answer from that record. If something isn't in
  the records, say it isn't listed.
- "direct": records where helping with the request is clearly within the
  record's stated purpose.
- "loose": records that don't mention this interest, but where a real project on
  the student's topic could honestly meet the record's stated purpose.
- If the student isn't asking for new options, leave "direct" and "loose" empty.

Rules:
- Check the whole list, including research, travel, and independent project
  funds that don't name the student's topic.
- Match the kind of support the student wants. 
- Keep records even if the student may not be eligible, and state the restriction
  in your reason. Never suggest they might qualify when the record says otherwise.
- Write each reason in one or two sentences, addressed to the student as "you".
- Never say a record specifically supports an interest unless it says so. If the
  connection is your own idea, say so.
- Only use IDs from the list. List each group from most to least relevant.
`;
}

function printPicks(label, picks) {
  if (picks.length === 0) return;
  console.log(`\n${label}`);

  for (const { id, reason } of picks) {
    const record = recordsById.get(id);
    if (!record) continue;

    const deadlines = record.deadlines.map((d) => d.text).join("; ") || "Not listed";
    console.log(`  ${record.name}`);
    console.log(`    Why: ${reason}`);
    console.log(`    Amount: ${record.awardAmount.text}`);
    console.log(`    Last listed deadline: ${deadlines}`);
    console.log(`    Link: ${record.sourceUrl}`);
  }
}

const ai = new GoogleGenAI({});
const terminal = createInterface({ input: process.stdin, output: process.stdout });
const history = [];

console.log('Ask about Davidson opportunities. Type "quit" to stop.');

while (true) {
  const text = (await terminal.question("\nYou: ")).trim();
  if (text.toLowerCase() === "quit") break;
  if (!text) continue;

  history.push({ role: "Student", text });

  try {
    const interaction = await ai.interactions.create({
      model: "gemini-3.5-flash-lite",
      input: buildPrompt(history.slice(-6)),
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema,
      },
    });

    const reply = JSON.parse(interaction.output_text);

    console.log(`\nAI: ${reply.message}`);
    printPicks("DIRECT MATCHES", reply.direct);
    printPicks("LOOSE MATCHES", reply.loose);

    const shown = [...reply.direct, ...reply.loose]
      .map((p) => recordsById.get(p.id)?.name)
      .filter(Boolean);
    history.push({
      role: "Assistant",
      text: `${reply.message} Grants shown: ${shown.join(", ") || "none"}`,
    });
  } catch (error) {
    history.pop();
    console.log(`\nSomething went wrong, so please try again: ${error.message}`);
  }
}

terminal.close();