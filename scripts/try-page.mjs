import { readPage, START_URL } from "../lib/pages.ts";

const url = process.argv[2] ?? START_URL;
const result = await readPage(url);

if (result.status !== "ok") {
  console.log(result);
  process.exit(0);
}

const { page } = result;
console.log(`Title: ${page.title}`);
console.log(`Text length: ${page.text.length} characters`);
console.log(`\nFirst 500 characters:\n${page.text.slice(0, 500)}`);

for (const access of ["readable", "login", "external"]) {
  const links = page.links.filter((link) => link.access === access);
  console.log(`\n${access.toUpperCase()} LINKS (${links.length}):`);
  for (const link of links.slice(0, 20)) {
    console.log(`  ${link.text} -> ${link.url}`);
  }
}