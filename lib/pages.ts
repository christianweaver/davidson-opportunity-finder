export type LinkAccess = "readable" | "login" | "external";

export type PageLink = {
  text: string;
  url: string;
  access: LinkAccess;
};

export type Page = {
  url: string;
  title: string;
  text: string;
  links: PageLink[];
  fetchedAt: number;
};

export type ReadResult =
  | { status: "ok"; page: Page }
  | { status: "login_required"; url: string }
  | { status: "external"; url: string }
  | { status: "error"; url: string; message: string };

export const START_URL = "https://www.davidson.edu/catalyst";

const ALLOWED_HOSTS = ["www.davidson.edu", "davidson.edu", "hurthub.davidson.edu"];
const LOGIN_HOSTS = ["joinhandshake.com", "campuslabs.com", "kualibuild.com", "accounts.google.com"];
const LOGIN_PATH = /\/(login|signin|sign-in|sso|cas|saml|shibboleth)\b/i;
const CACHE_HOURS = 24;
const MAX_TEXT_CHARS = 20000;
const MAX_LINKS = 150;
const TIMEOUT_MS = 10000;

const cache = new Map<string, Page>();

function hostMatches(hostname: string, hosts: string[]): boolean {
  return hosts.some((host) => hostname === host || hostname.endsWith(`.${host}`));
}

export function classifyUrl(raw: string): LinkAccess | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  if (hostMatches(url.hostname, LOGIN_HOSTS) || LOGIN_PATH.test(url.pathname)) {
    return "login";
  }
  if (url.protocol === "https:" && ALLOWED_HOSTS.includes(url.hostname)) {
    return "readable";
  }
  if (url.hostname === "sites.google.com" && url.pathname.startsWith("/davidson.edu/")) {
    return "readable";
  }
  return "external";
}

function normalizeUrl(raw: string): string {
  const url = new URL(raw);
  url.hash = "";
  return url.toString();
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&ndash;|&mdash;/g, "-")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<\/(p|div|li|h[1-6]|tr|section|article)>|<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

function mainContent(html: string): string {
    const main = html.match(/<main\b[\s\S]*<\/main>/i)?.[0];
    if (main) return main.replace(/<nav\b[\s\S]*?<\/nav>/gi, " ");
    return html.replace(/<(header|nav|footer)\b[\s\S]*?<\/\1>/gi, " ");
}

function extractLinks(html: string, baseUrl: string): PageLink[] {
  const links = new Map<string, PageLink>();
  const pattern = /<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  for (const [, href, inner] of html.matchAll(pattern)) {
    let url: string;
    try {
      url = normalizeUrl(new URL(href, baseUrl).toString());
    } catch {
      continue;
    }

    const access = classifyUrl(url);
    const text = htmlToText(inner);
    if (access && text && !links.has(url)) {
      links.set(url, { text, url, access });
    }
    if (links.size >= MAX_LINKS) break;
  }

  return [...links.values()];
}

export async function readPage(rawUrl: string): Promise<ReadResult> {
  const access = classifyUrl(rawUrl);
  if (access === "login") return { status: "login_required", url: rawUrl };
  if (access !== "readable") return { status: "external", url: rawUrl };

  const url = normalizeUrl(rawUrl);
  const cached = cache.get(url);
  if (cached && Date.now() - cached.fetchedAt < CACHE_HOURS * 60 * 60 * 1000) {
    return { status: "ok", page: cached };
  }

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "NextStep/0.1 (student project)" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (response.status === 401 || classifyUrl(response.url || url) === "login") {
      return { status: "login_required", url };
    }
    if (!response.ok) {
      return { status: "error", url, message: `The page returned status ${response.status}.` };
    }

    const html = await response.text();
    const title = htmlToText(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
    const content = mainContent(html);

    const page: Page = {
      url,
      title,
      text: htmlToText(content).slice(0, MAX_TEXT_CHARS),
      links: extractLinks(content, url),
      fetchedAt: Date.now(),
    };

    cache.set(url, page);
    return { status: "ok", page };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { status: "error", url, message };
  }
}