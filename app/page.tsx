"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ChatTurn } from "@/lib/ai";
import type { FinderReply } from "@/lib/finder";
import { toHistoryText } from "@/lib/history";
import GrantResults from "@/components/GrantResults";
import Questionnaire from "@/components/Questionnaire";
import { isProfileEmpty, profileSummary, type Profile } from "@/lib/profile";

type Message =
  | { role: "Student"; text: string }
  | { role: "Assistant"; reply: FinderReply };

const EXAMPLES = [
  "I want to fund an independent project. Where should I start?",
  "I'm interested in studying abroad next summer.",
  "I have a startup idea I want to test.",
];

const STORAGE_KEY = "opportunity-finder-chat-v1";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    transcriptEndRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "end",
    });
  }, [messages, isLoading]);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const saved_data = JSON.parse(saved) as { messages?: Message[]; profile?: Profile | null };
        const restored = saved_data.messages ?? [];
        const last = restored[restored.length - 1];
        if (last?.role === "Student") {
          restored.pop();
          setInput(last.text);
        }
        setMessages(restored);
        setProfile(saved_data.profile ?? null);
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, profile }));
    } catch {
      // Storage can be full or blocked. The chat still works without it.
    }
  }, [messages, profile, hasLoaded]);

  async function sendMessage(text: string, activeProfile: Profile | null = profile) {
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
        body: JSON.stringify({ history, profile: activeProfile }),
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

  function startNewChat() {
    setMessages([]);
    setInput("");
    setError(null);
    setProfile(null);
  }

  function handleQuestionnaire(answers: Profile) {
    const activeProfile = isProfileEmpty(answers) ? null : answers;
    setProfile(activeProfile);
    sendMessage(profileSummary(answers), activeProfile);
  }

  if (!hasLoaded) return null;
  const hasMessages = messages.length > 0;

  return (
    <main className={hasMessages ? "app app-chat" : "app app-empty"}>
      {hasMessages ? (
        <header className="topbar">
          <div className="topbar-inner">
            <p className="eyebrow">Davidson College</p>
            <h1>Davidson Opportunity Finder</h1>
            <button type="button" className="button" onClick={startNewChat}>
              Home
            </button>
          </div>
        </header>
      ) : (
        <header className="hero">
          <p className="eyebrow">Davidson College</p>
          <h1>Davidson Opportunity Finder</h1>
          <p className="lede">
            Tell us your interests and goals, and find Davidson grants and opportunities that fit.
          </p>
        </header>
      )}

      {!hasMessages && (
        <>
          <Questionnaire onSubmit={handleQuestionnaire} disabled={isLoading} />
          <h2 className="own-question-title">Already have your own question?</h2>
        </>
      )}

      {hasMessages && (
        <div className="thread">
          <div className="thread-inner">
            {messages.map((message, index) =>
              message.role === "Student" ? (
                <p key={index} className="bubble">
                  {message.text}
                </p>
              ) : (
                <div key={index} className="reply">
                  <p className="reply-text">{message.reply.message}</p>
                  <GrantResults reply={message.reply} />
                </div>
              ),
            )}

            {isLoading && (
              <p className="thinking" aria-live="polite">
                <span className="thinking-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                Searching Davidson's website...
              </p>
            )}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <form className="composer" onSubmit={handleSubmit}>
        <div className="composer-row">
          <label className="sr-only" htmlFor="prompt">
            Ask about grants and opportunities
          </label>
          <input
            id="prompt"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about grants and opportunities..."
            maxLength={2000}
          />
          <button className="button button-primary" type="submit" disabled={isLoading}>
            Send
          </button>
        </div>
      </form>

      {!hasMessages && (
        <div className="chips">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              className="chip"
              onClick={() => sendMessage(example)}
            >
              {example}
            </button>
          ))}
        </div>
      )}

      <p className="footnote">
        Grant information reflects a snapshot from early 2025 and may be out of date. Always
        confirm details on the official pages.
      </p>
    </main>
  );
}
