"use client";

import { useEffect, useState } from "react";
import {
  CLASS_YEARS,
  EMPTY_PROFILE,
  MAX_ABOUT_LENGTH,
  OPPORTUNITY_TYPES,
  TIMING_OPTIONS,
  type Profile,
} from "@/lib/profile";

type Question =
  | { kind: "single"; field: "classYear"; title: string; hint: string; options: string[] }
  | {
      kind: "multiple";
      field: "opportunityTypes" | "timing";
      title: string;
      hint: string;
      options: string[];
    }
  | { kind: "text"; field: "about"; title: string; hint: string };

const QUESTIONS: Question[] = [
  {
    kind: "single",
    field: "classYear",
    title: "What's your class year?",
    hint: "Choose one.",
    options: CLASS_YEARS,
  },
  {
    kind: "multiple",
    field: "opportunityTypes",
    title: "What kinds of opportunities are you interested in?",
    hint: "Choose all that apply.",
    options: OPPORTUNITY_TYPES,
  },
  {
    kind: "multiple",
    field: "timing",
    title: "When would you like to do it?",
    hint: "Choose all that apply.",
    options: TIMING_OPTIONS,
  },
  {
    kind: "text",
    field: "about",
    title: "Tell us anything else we should know.",
    hint: "Your major, interests, goals, or anything you're hoping to do.",
  },
];

const STORAGE_KEY = "opportunity-finder-questionnaire-v1";

type Props = {
  onSubmit: (profile: Profile) => void;
  disabled: boolean;
};

export default function Questionnaire({ onSubmit, disabled }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Profile>(EMPTY_PROFILE);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const restored = JSON.parse(saved);
        setAnswers({ ...EMPTY_PROFILE, ...restored.answers });
        setStep(Math.min(Math.max(Number(restored.step) || 0, 0), QUESTIONS.length - 1));
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ step, answers }));
    } catch {
      // Storage can be full or blocked. The questionnaire still works without it.
    }
  }, [step, answers, hasLoaded]);

  const question = QUESTIONS[step];
  const isLast = step === QUESTIONS.length - 1;

  function toggle(field: "opportunityTypes" | "timing", option: string) {
    setAnswers((current) => {
      const next = { ...current };
      next[field] = current[field].includes(option)
        ? current[field].filter((item) => item !== option)
        : [...current[field], option];
      return next;
    });
  }

  function withCurrentCleared(profile: Profile): Profile {
    const next = { ...profile };
    if (question.kind === "single") next.classYear = null;
    else if (question.kind === "multiple") next[question.field] = [];
    else next.about = "";
    return next;
  }

  function goNext(profile: Profile) {
    if (isLast) {
      setAnswers(EMPTY_PROFILE);
      setStep(0);
      onSubmit(profile);
      return;
    }
    setAnswers(profile);
    setStep(step + 1);
  }

  if (!hasLoaded) return null;

  return (
    <section className="questionnaire" aria-labelledby="questionnaire-title">
      <h2 id="questionnaire-title">Answer a few questions to tailor your recommendations</h2>

      <p className="questionnaire-progress">
        Question {step + 1} of {QUESTIONS.length}
      </p>
      <div
        className="progress-bar"
        role="progressbar"
        aria-label="Questionnaire progress"
        aria-valuemin={1}
        aria-valuemax={QUESTIONS.length}
        aria-valuenow={step + 1}
      >
        <div
          className="progress-bar-fill"
          style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }}
        />
      </div>

      <fieldset className="question" disabled={disabled}>
        <legend>{question.title}</legend>
        <p className="question-hint">{question.hint}</p>

        {question.kind === "text" ? (
          <textarea
            value={answers.about}
            onChange={(event) => setAnswers({ ...answers, about: event.target.value })}
            maxLength={MAX_ABOUT_LENGTH}
            rows={4}
            aria-label={question.title}
            placeholder="For example: I'm a economics major who's interested in history, and I'd like research experience."
          />
        ) : (
          <div className="options">
            {question.options.map((option) => {
              const selected =
                question.kind === "single"
                  ? answers.classYear === option
                  : answers[question.field].includes(option);

              return (
                <button
                  key={option}
                  type="button"
                  className="option"
                  aria-pressed={selected}
                  onClick={() =>
                    question.kind === "single"
                      ? setAnswers({ ...answers, classYear: selected ? null : option })
                      : toggle(question.field, option)
                  }
                >
                  {option}
                </button>
              );
            })}
          </div>
        )}
      </fieldset>

      <div className="questionnaire-nav">
        <button
          type="button"
          className="button"
          onClick={() => setStep(step - 1)}
          disabled={step === 0 || disabled}
        >
          Previous
        </button>
        <button
          type="button"
          className="button button-quiet"
          onClick={() => goNext(withCurrentCleared(answers))}
          disabled={disabled}
        >
          Skip
        </button>
        <button
          type="button"
          className="button button-primary"
          onClick={() => goNext(answers)}
          disabled={disabled}
        >
          {isLast ? "Find opportunities" : "Continue"}
        </button>
      </div>
    </section>
  );
}