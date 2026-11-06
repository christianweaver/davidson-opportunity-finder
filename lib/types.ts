export type ClassYear = "first-year" | "sophomore" | "junior" | "senior";

export type Deadline = {
  label: string | null; // for example "Priority" or "Summer break"
  date: string | null; // YYYY-MM-DD when the source gives a full date
  text: string; // the wording from the source, such as "Rolling"
};

export type Opportunity = {
  id: string;
  isMock: boolean;
  name: string;
  type: "grant" | "scholarship" | "fellowship" | "internship" | "program";
  description: string;
  office: string | null;
  tags: string[]; // the categories from your source files
  themes: string[]; // broader search terms, used for looser matches
  eligibility: {
    classYears: ClassYear[] | null; // null means no class-year rule is listed
    notes: string | null;
  };
  awardAmount: {
    min: number | null;
    max: number | null;
    text: string; // the amount as a person should read it
    notes: string | null;
  };
  deadlines: Deadline[]; // an empty list means no deadline is listed
  applicationSteps: string[];
  contact: string | null;
  sourceUrl: string | null;
  verificationStatus: "mock" | "verified" | "unverified";
  dataAsOf: string | null; // when this information was last known to be current
  notes: string | null;
  pastRecipientExperiences: string[];
};