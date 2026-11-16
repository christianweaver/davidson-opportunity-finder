export type Profile = {
    classYear: string | null;
    opportunityTypes: string[];
    timing: string[];
    about: string;
  };
  
  export const CLASS_YEARS = ["First-year", "Sophomore", "Junior", "Senior"];
  
  export const OPPORTUNITY_TYPES = [
    "Grants or funding",
    "Internships",
    "Research",
    "Study abroad or travel",
    "Fellowships",
    "Not sure yet",
  ];
  
  export const TIMING_OPTIONS = [
    "Summer",
    "During the semester",
    "Winter break",
    "Spring break",
    "Flexible",
  ];
  
  export const MAX_ABOUT_LENGTH = 1000;
  
  export const EMPTY_PROFILE: Profile = {
    classYear: null,
    opportunityTypes: [],
    timing: [],
    about: "",
  };
  
  export function isProfileEmpty(profile: Profile): boolean {
    return (
      !profile.classYear &&
      profile.opportunityTypes.length === 0 &&
      profile.timing.length === 0 &&
      profile.about.trim() === ""
    );
  }
  
  function joinWithOr(items: string[]): string {
    return new Intl.ListFormat("en", { style: "long", type: "disjunction" }).format(items);
  }
  
  export function profileSummary(profile: Profile): string {
    if (isProfileEmpty(profile)) return "Show me some available opportunities.";
  
    const sentences: string[] = [];
  
    if (profile.classYear) {
      sentences.push(`I'm a ${profile.classYear.toLowerCase()}.`);
    }
  
    const types = profile.opportunityTypes.filter((type) => type !== "Not sure yet");
    if (types.length > 0) {
      sentences.push(`I'm looking for ${joinWithOr(types.map((type) => type.toLowerCase()))}.`);
    } else if (profile.opportunityTypes.includes("Not sure yet")) {
      sentences.push("I'm not sure what kind of opportunity I want yet.");
    }
  
    if (profile.timing.length > 0) {
      sentences.push(
        `Timing that works for me: ${joinWithOr(profile.timing.map((time) => time.toLowerCase()))}.`,
      );
    }
  
    if (profile.about.trim()) {
      sentences.push(`More about me: ${profile.about.trim()}`);
    }
  
    return sentences.join(" ");
  }
  
  export function profileForPrompt(profile: Profile): string {
    const list = (items: string[]) => (items.length > 0 ? items.join(", ") : "Not given");
  
    return `
  Student profile from the questionnaire. Use it for every reply, even if the
  conversation doesn't mention it:
  - Class year: ${profile.classYear ?? "Not given"}
  - Looking for: ${list(profile.opportunityTypes)}
  - Timing: ${list(profile.timing)}
  - About them: ${profile.about.trim() || "Not given"}
  `;
  }
  
  export function parseProfile(value: unknown): Profile | null {
    if (!value || typeof value !== "object") return null;
    const raw = value as Record<string, unknown>;
  
    const pick = (items: unknown, allowed: string[]) =>
      Array.isArray(items) ? allowed.filter((option) => items.includes(option)) : [];
  
    const profile: Profile = {
      classYear:
        typeof raw.classYear === "string" && CLASS_YEARS.includes(raw.classYear)
          ? raw.classYear
          : null,
      opportunityTypes: pick(raw.opportunityTypes, OPPORTUNITY_TYPES),
      timing: pick(raw.timing, TIMING_OPTIONS),
      about: typeof raw.about === "string" ? raw.about.trim().slice(0, MAX_ABOUT_LENGTH) : "",
    };
  
    return isProfileEmpty(profile) ? null : profile;
  }