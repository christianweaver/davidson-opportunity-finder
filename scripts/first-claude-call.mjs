import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const response = await client.messages.create({
  model: "claude-haiku-5-5",
  max_tokens: 300,
  messages: [{ role: "user", content: "In one sentence, what is a research grant?" }],
});

console.log(response.content.find((block) => block.type === "text")?.text);
console.log(response.usage);