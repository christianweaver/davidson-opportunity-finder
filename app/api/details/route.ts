import { getOpportunityDetails } from "@/lib/details";
import { classifyUrl } from "@/lib/pages";
import { parseProfile } from "@/lib/profile";

export const maxDuration = 30;

export async function POST(request: Request) {
  let body: { name?: unknown; sourceUrl?: unknown; profile?: unknown };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request must be valid JSON." }, { status: 400 });
  }

  const { name, sourceUrl, profile } = body;
  if (
    typeof name !== "string" ||
    !name.trim() ||
    name.length > 300 ||
    typeof sourceUrl !== "string" ||
    classifyUrl(sourceUrl) !== "readable"
  ) {
    return Response.json({ error: "Please send a valid opportunity." }, { status: 400 });
  }

  try {
    const details = await getOpportunityDetails(name, sourceUrl, parseProfile(profile));
    return Response.json(details);
  } catch (error) {
    console.error("Details request failed:", error);
    return Response.json(
      { error: "Couldn't load the details. Try the official page instead." },
      { status: 500 },
    );
  }
}