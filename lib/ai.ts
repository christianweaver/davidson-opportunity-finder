import { readFileSync } from "node:fs";
import { join } from "node:path";
import { GoogleGenAI } from "@google/genai";
import type { Opportunity } from "./types";

export type ChatTurn = {
  role: "Student" | "Assistant";
  text: string;
};

export type GrantMatch = {
  opportunity: Opportunity;
  reason: string;
  strength: "direct" | "loose";
};

export type ChatReply = {
  message: string;
  matches: GrantMatch[];
};

type RawPick = {
  id: string;
  reason: string;
};

const MODEL = "gemini-3.5-flash-lite";
const MAX_HISTORY_TURNS = 6;

const opportunities: Opportunity[] = JSON.parse(
  readFileSync(join(process.cwd(), "data/opportunities.json"), "utf8"),
);

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

const ai = new GoogleGenAI({});

function buildPrompt(history: ChatTurn[]): string {
  const conversation = history
    .map((turn) => `${turn.role}: ${turn.text}`)
    .join("\n");

  return `
Opportunities:
${JSON.stringify(candidates)}

Conversation so far:
${conversation}

You are a supportive guide helping Davidson College students explore
opportunities. You complement conversations with faculty and staff rather than
replacing them, and you help students prepare to ask better questions.

Reply to the student's latest message, using earlier messages to understand
what they mean by things like "this topic" or "that one".

Fill in these fields:
- "message": a short, conversational reply addressed to the student as "you".
  Don't list or describe the grants shown in "direct" or "loose", since
  they appear as cards below. If they ask about a specific record, answer from
  that record. If something isn't in the records, say it isn't listed.
- "direct": records where helping with the request is clearly within the
  record's stated purpose.
- "loose": records that don't mention this interest, but where a real project on
  the student's topic could honestly meet the record's stated purpose.
- If the student isn't asking for new options, leave "direct" and "loose" empty.

Rules for choosing records:
- Check the whole list, including research, travel, and independent project
  funds that don't name the student's topic.
- When the student refines their request, check the whole list again, including
  records you didn't show before.
- Match the kind of support the student wants. If they want to fund a project,
  an internship-only grant is at most a loose match.
- If a record only fits under a condition the student hasn't stated, such as a
  specific country or region, it's a loose match. State the condition.
- Don't invent details to make something fit. If you'd need to imagine a career,
  field, or purpose the student didn't mention, leave it out.
- Personal or recreational requests don't fit career or academic funds. Returning
  empty lists is a good answer when nothing genuinely fits.
- Keep records even if the student may not be eligible, and state the restriction
  in your reason. Never suggest they might qualify when the record says otherwise.
- Write each reason in one or two sentences, addressed to the student as "you".
- Don't mention deadlines or amounts in a reason, since they appear separately.
- Never say a record specifically supports an interest unless it says so. If the
  connection is your own idea, say so.
- When you mention a deadline, always call it the "last listed deadline" and
  point the student to the official link for current dates.
- Only use IDs from the list. List each group from most to least relevant.
`;
}

function toMatches(picks: RawPick[], strength: GrantMatch["strength"]): GrantMatch[] {
  const matches: GrantMatch[] = [];

  for (const { id, reason } of picks) {
    const opportunity = recordsById.get(id);
    if (opportunity) matches.push({ opportunity, reason, strength });
  }

  return matches;
}

export async function askOpportunityFinder(history: ChatTurn[]): Promise<ChatReply> {
  const interaction = await ai.interactions.create({
    model: MODEL,
    input: buildPrompt(history.slice(-MAX_HISTORY_TURNS)),
    response_format: {
      type: "text",
      mime_type: "application/json",
      schema,
    },
  });

  const reply = JSON.parse(interaction.output_text ?? "");

  return {
    message: reply.message,
    matches: [...toMatches(reply.direct, "direct"), ...toMatches(reply.loose, "loose")],
  };
}