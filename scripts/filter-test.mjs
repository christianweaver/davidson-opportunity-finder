import { readFileSync } from "node:fs";
import { GoogleGenAI } from "@google/genai";

const opportunities = JSON.parse(
  readFileSync("data/opportunities.json", "utf8"),
);

const question = process.argv[2];
if (!question) {
  console.log('Add a question, like: node --env-file=.env.local scripts/filter-test.mjs "your question"');
  process.exit(1);
}

// Remove mock records and other non-real data from opportunities.json rather than doing this
const candidates = opportunities.map(
  ({ isMock, type, themes, verificationStatus, dataAsOf, pastRecipientExperiences, ...rest }) => rest,
);

const prompt = `
Opportunities:
${JSON.stringify(candidates)}

You help Davidson College students find opportunities. Using only the records
above, sort the ones that fit into these two groups:

- "direct": helping with what the student asked for is clearly within the
record's stated purpose.
- "loose": the record doesn't mention this interest, but a real project on the
student's topic could honestly meet the record's stated purpose.

Rules:
- Check the whole list, including research, travel, and independent project
funds that don't name the student's topic.
- Match the kind of support the student wants. If they want to fund a project,
an internship-only grant is at most a loose match.
- Don't invent details to make something fit. If you'd need to imagine a career,
field, or purpose the student didn't mention, leave it out.
- Personal or recreational requests don't fit career or academic funds. Returning
empty lists is a good answer when nothing genuinely fits.
- Keep records even if the student may not be eligible, and state the restriction
in your reason. Never suggest they might qualify when the record says otherwise.
- Write each reason in one or two sentences, addressed to the student as "you".
- Never say a record specifically supports an interest unless it says so. If the
connection is your own idea, say so.
- Only use IDs from the list. List each group from most to least relevant.

Student's question:
${question}
`;

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
    direct: { type: "array", items: pick },
    loose: { type: "array", items: pick },
  },
  required: ["direct", "loose"],
};

const ai = new GoogleGenAI({});

const interaction = await ai.interactions.create({
  model: process.argv[3] ?? "gemini-3.5-flash-lite",
  input: prompt,
  response_format: {
    type: "text",
    mime_type: "application/json",
    schema,
  },
});

const picks = JSON.parse(interaction.output_text);
const recordsById = new Map(opportunities.map((record) => [record.id, record]));

for (const group of ["direct", "loose"]) {
  console.log(`\n${group.toUpperCase()} MATCHES`);
  if (picks[group].length === 0) console.log("  (none)");

  for (const { id, reason } of picks[group]) {
    const record = recordsById.get(id);
    if (!record) {
      console.log(`  REJECTED, not in dataset: ${id}`);
      continue;
    }
    console.log(`  ${record.name} (${record.awardAmount.text})`);
    console.log(`    Why: ${reason}`);
    console.log(`    Link: ${record.sourceUrl}`);
  }
}