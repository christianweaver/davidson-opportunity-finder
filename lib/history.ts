import type { ChatReply } from "./ai";

export function toHistoryText(reply: ChatReply): string {
  const names = reply.matches.map((match) => match.opportunity.name);
  return `${reply.message} Grants shown: ${names.join(", ") || "none"}`;
}