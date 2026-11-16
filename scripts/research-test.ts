import { researchOpportunities } from "../lib/research";

async function main() {
  const question =
    process.argv[2] ?? "I want to fund a summer research project on the history of fashion.";

  const started = Date.now();
  const reply = await researchOpportunities([{ role: "Student", text: question }]);
  const seconds = ((Date.now() - started) / 1000).toFixed(1);

  console.log(`\nAI: ${reply.message}\n`);

  for (const opportunity of reply.opportunities) {
    console.log(`[${opportunity.score}] ${opportunity.name}`);
    console.log(`  Why: ${opportunity.reason}`);
    console.log(`  Source: ${opportunity.sourceUrl}\n`);
  }

  for (const notice of reply.loginNotices) {
    console.log(`Needs login: ${notice.name} (${notice.url}): ${notice.note}`);
  }
  if (reply.handshakeSearches.length > 0) {
    console.log(`Handshake searches: ${reply.handshakeSearches.join(", ")}`);
  }

  console.log(`\nPages read (${reply.pagesRead.length}):`);
  for (const url of reply.pagesRead) console.log(`  ${url}`);

  const { inputTokens, outputTokens, estimatedCost } = reply.usage;
  console.log(
    `\nTime: ${seconds}s | Tokens: ${inputTokens} in, ${outputTokens} out | Estimated cost: $${estimatedCost.toFixed(4)}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});