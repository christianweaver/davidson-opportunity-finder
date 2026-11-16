import type { ChatTurn } from "@/lib/ai";
import { findOpportunities } from "@/lib/finder";
import { parseProfile } from "@/lib/profile";

export const maxDuration = 60;

const MAX_MESSAGE_LENGTH = 2000;
const MAX_ASSISTANT_LENGTH = 10000;

function isValidHistory(history: unknown): history is ChatTurn[] {
  if (!Array.isArray(history) || history.length === 0) return false;

  const validTurns = history.every(
    (turn) =>
      (turn?.role === "Student" || turn?.role === "Assistant") &&
      typeof turn?.text === "string" &&
      turn.text.trim() !== "" &&
      turn.text.length <= (turn.role === "Student" ? MAX_MESSAGE_LENGTH : MAX_ASSISTANT_LENGTH),
  );

  return validTurns && history[history.length - 1].role === "Student";
}

export async function POST(request: Request) {
  let history: unknown;
  let profile: unknown;

  try {
    ({ history, profile } = await request.json());
  } catch {
    return Response.json({ error: "Request must be valid JSON." }, { status: 400 });
  }

  if (!isValidHistory(history)) {
    return Response.json({ error: "Please send a valid message." }, { status: 400 });
  }

  try {
    const reply = await findOpportunities(history, parseProfile(profile));
    return Response.json(reply);
  } catch (error) {
    console.error("Chat request failed:", error);
    return Response.json(
      { error: "Something went wrong. Please try again in a minute." },
      { status: 500 },
    );
  }
}