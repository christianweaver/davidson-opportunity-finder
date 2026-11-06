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
  score: number;
};

export type ChatReply = {
  message: string;
  matches: GrantMatch[];
};

type RawPick = {
  id: string;
  reason: string;
  score: number;
};

const MODEL = "gemini-3.5-flash-lite";
const MAX_HISTORY_TURNS = 6;
const MIN_SCORE = 20;

const opportunities: Opportunity[] = JSON.parse(
  readFileSync(join(process.cwd(), "data/opportunities.json"), "utf8"),
);

const candidates = opportunities.map(
  ({ isMock, type, themes, verificationStatus, dataAsOf, pastRecipientExperiences, ...rest }) => rest,
);

const recordsById = new Map(opportunities.map((record) => [record.id, record]));

const schema = {
  type: "object",
  properties: {
    message: { type: "string" },
    matches: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            reason: { type: "string" },
            score: {type: "integer" },
          },
          required: ["id", "reason", "score"],
        },
    },
  },
  required: ["message", "matches"],
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
  Don't list or describe the records in "matches", since they appear as cards 
  below. If they ask about a specific record, answer from that record. If 
  something isn't in the records, say it isn't listed.
- "matches": every record that fits, each with a reason and a score.
- If the student isn't asking for new options, leave "matches" empty.

Write the reason first, then score how well each record fits, from 0 to 100:
- 80-100: helping with this request is clearly within the record's stated purpose.
- 50-79: fits part of what they asked, or fits with some reasonable framing.
- 20-49: the record doesn't mention this interest, but a real project on the
  student's topic could honestly meet its stated purpose.
- Below 20: leave it out.
Use the whole range, and give records that fit differently different scores.
Score how well a record fits their interests, not whether they're eligible.

How to guide the student:
- If their message is too vague to match anything, ask a clarifying question first.
- When you recommend options, sometimes encourage applying to more than one, since 
    no single grant is guaranteed.

Rules for choosing records:
- Check the whole list, including research, travel, and independent project
  funds that don't name the student's topic.
- When the student refines their request, check the whole list again, including
  records you didn't show before.
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
- Only use IDs from the list. 
`;
}

function clampPoints(value: unknown, max: number): number {
    if (typeof value !== "number" || Number.isNaN(value)) return 0;
    return Math.max(0, Math.min(max, Math.round(value)));
  }

function toMatches(picks: RawPick[]): GrantMatch[] {
  const seen = new Set<string>();
  const matches: GrantMatch[] = [];

  for (const pick of picks) {
    const opportunity = recordsById.get(pick.id);
    if (!opportunity || seen.has(pick.id)) continue;

    const score = clampPoints(pick.score, 100);
    if (score < MIN_SCORE) continue;

    seen.add(pick.id);
    matches.push({ opportunity, reason: pick.reason, score });
  }

  return matches.sort((a, b) => b.score - a.score);
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
    matches: toMatches(reply.matches ?? []),
  };
}