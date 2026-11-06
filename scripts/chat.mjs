import { createInterface } from "node:readline/promises";
import { askOpportunityFinder, toHistoryText } from "../lib/ai.ts";

function printMatch({ opportunity, reason, strength }) {
  const deadlines =
    opportunity.deadlines
      .map((d) => (d.label ? `${d.label}: ${d.text}` : d.text))
      .join("; ") || "Not listed";
  const amount =
    opportunity.awardAmount.text === "No information"
      ? "Not listed"
      : opportunity.awardAmount.text;

  console.log(`\n  [${strength}] ${opportunity.name}`);
  console.log(`    Why: ${reason}`);
  console.log(`    Amount: ${amount}`);
  console.log(`    Last listed deadline: ${deadlines}`);
  console.log(`    Link: ${opportunity.sourceUrl ?? "Not listed"}`);
}

const terminal = createInterface({ input: process.stdin, output: process.stdout });
const history = [];

console.log('Ask about Davidson opportunities. Type "quit" to stop.');

while (true) {
  const text = (await terminal.question("\nYou: ")).trim();
  if (text.toLowerCase() === "quit") break;
  if (!text) continue;

  history.push({ role: "Student", text });

  try {
    const reply = await askOpportunityFinder(history);

    console.log(`\nAI: ${reply.message}`);
    reply.matches.forEach(printMatch);

    history.push({ role: "Assistant", text: toHistoryText(reply) });
  } catch (error) {
    history.pop();
    console.log(`\nSomething went wrong, so please try again: ${error.message}`);
  }
}

terminal.close();