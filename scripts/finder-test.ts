import { findOpportunities } from "../lib/finder";

async function main() {
  const question = process.argv[2] ?? "I'm looking for a summer internship in marketing.";

  const started = Date.now();
  const reply = await findOpportunities([{ role: "Student", text: question }]);
  const seconds = ((Date.now() - started) / 1000).toFixed(1);

  console.log(`\nAI: ${reply.message}\n`);
  for (const notice of reply.notices) console.log(`Notice: ${notice}\n`);

  for (const card of reply.cards) {
    console.log(`[${card.score}] (${card.source}) ${card.name}`);
    console.log(`  Why: ${card.reason}`);
    console.log(`  Deadlines: ${card.deadlines ?? "Not listed"}`);
    console.log(`  Source: ${card.sourceUrl ?? "Not listed"}\n`);
  }

  console.log(`Time: ${seconds}s`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});