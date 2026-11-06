"use client";

import { useState, type FormEvent } from "react";
import type { ChatReply, ChatTurn } from "@/lib/ai";
import { toHistoryText } from "@/lib/history";

type Message =
  | { role: "Student"; text: string }
  | { role: "Assistant"; reply: ChatReply };

const EXAMPLES = [
  "I want to fund an independent project. Where should I start?",
  "I'm interested in studying abroad next summer.",
  "I have a startup idea I want to test.",
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const updated: Message[] = [...messages, { role: "Student", text: trimmed }];
    setMessages(updated);
    setInput("");
    setError(null);
    setIsLoading(true);

    const history = updated.map(
      (message): ChatTurn =>
        message.role === "Student"
          ? { role: "Student", text: message.text }
          : { role: "Assistant", text: toHistoryText(message.reply) },
    );

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error ?? "Something went wrong.");

      setMessages([...updated, { role: "Assistant", reply: data }]);
    } catch (err) {
      setMessages(messages);
      setInput(trimmed);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(input);
  }

  return (
    <main>
      <h1>Davidson Opportunity Finder</h1>
      <p>Tell us your interests and goals, and find Davidson grants and opportunities that fit.</p>

      {messages.length === 0 && (
        <div>
          {EXAMPLES.map((example) => (
            <button key={example} type="button" onClick={() => sendMessage(example)}>
              {example}
            </button>
          ))}
        </div>
      )}

      {messages.map((message, index) =>
        message.role === "Student" ? (
          <p key={index}>
            <strong>You:</strong> {message.text}
          </p>
        ) : (
          <div key={index}>
            <p>{message.reply.message}</p>
            <ul>
              {message.reply.matches.map((match, matchIndex) => (
                <li key={`${match.opportunity.id}-${matchIndex}`}>
                  <strong>{match.opportunity.name}</strong> ({match.strength}): {match.reason}
                </li>
              ))}
            </ul>
          </div>
        ),
      )}

      {isLoading && <p>Thinking...</p>}
      {error && <p role="alert">{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about grants and opportunities..."
          maxLength={2000}
        />
        <button type="submit" disabled={isLoading}>
          Send
        </button>
      </form>
    </main>
  );
}