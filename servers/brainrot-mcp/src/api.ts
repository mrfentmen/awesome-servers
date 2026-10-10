// ---- muxE tools:
// The five existing tools answer what a term means, what matches a string, what
// is in a block of text, one random term and the vibe tally. The two new tools
// work on the same local lexicon in two directions none of those take: when the
// vocabulary arrived, and which terms actually reference each other.
import { LEXICON } from "./lexicon.js";
import type { SlangEntry } from "./lexicon.js";

const YEAR = /\b((?:19|20)\d{2})\b/;
const DECADE = /\b((?:19|20)\d{2})s\b/;

function originYears(entry: SlangEntry): { years: number[]; decades: number[] } {
  const text = `${entry.origin} ${entry.meaning}`;
  return {
    years: [...text.matchAll(new RegExp(YEAR, "g"))].map((m) => Number(m[1])),
    decades: [...text.matchAll(new RegExp(DECADE, "g"))].map((m) => Number(m[1])),
  };
}

export async function originTimeline(_args: Record<string, never> = {}): Promise<string> {
  if (!LEXICON.length) return "The lexicon is empty.";
  const dated: Array<{ entry: SlangEntry; year: number }> = [];
  const decadeOnly: Array<{ entry: SlangEntry; decade: number }> = [];
  const undated: string[] = [];
  for (const entry of LEXICON) {
    const { years, decades } = originYears(entry);
    if (years.length) {
      const earliest = Math.min(...years);
      dated.push({ entry, year: earliest });
    } else if (decades.length) {
      decadeOnly.push({ entry, decade: Math.min(...decades) });
    } else {
      undated.push(entry.term);
    }
  }
  if (!dated.length) return "No entry in the lexicon states a year in its origin or meaning.";
  dated.sort((a, b) => a.year - b.year || a.entry.term.localeCompare(b.entry.term));
  decadeOnly.sort((a, b) => a.decade - b.decade || a.entry.term.localeCompare(b.entry.term));
  const tally = new Map<number, number>();
  for (const row of dated) tally.set(row.year, (tally.get(row.year) ?? 0) + 1);
  const lines = [
    `When this vocabulary arrived, read out of the ${LEXICON.length} lexicon entries:`,
    `  entries naming a specific year: ${dated.length}`,
    `  entries naming only a decade: ${decadeOnly.length}`,
    `  entries naming no date at all: ${undated.length}`,
  ];
  const first = dated[0];
  const last = dated[dated.length - 1];
  lines.push(`  earliest dated term: ${first.entry.term} (${first.year})`, `  most recent dated term: ${last.entry.term} (${last.year})`);
  lines.push("  dated terms by year, earliest first:");
  for (const [year, n] of [...tally.entries()].sort((a, b) => a[0] - b[0])) {
    const names = dated.filter((r) => r.year === year).map((r) => r.entry.term);
    lines.push(`    ${year}: ${n} term(s) - ${names.join(", ")}`);
  }
  if (decadeOnly.length) {
    lines.push("  terms that only give a decade:");
    const decades = [...new Set(decadeOnly.map((r) => r.decade))].sort((a, b) => a - b);
    for (const decade of decades) {
      lines.push(`    ${decade}s: ${decadeOnly.filter((r) => r.decade === decade).map((r) => r.entry.term).join(", ")}`);
    }
  }
  if (undated.length) lines.push(`  terms with no date in their origin or meaning: ${undated.join(", ")}`);
  lines.push("  a term is dated by the earliest year its origin or meaning states, so an entry can carry several.");
  return lines.join("\n");
}

const normalise = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** every other lexicon term that appears in this entry's own prose */
function mentionsIn(entry: SlangEntry): string[] {
  const haystack = normalise(`${entry.meaning} ${entry.origin} ${entry.example}`);
  const out: string[] = [];
  for (const other of LEXICON) {
    if (other.term === entry.term) continue;
    const needle = normalise(other.term);
    if (!needle) continue;
    const pattern = new RegExp(`(^| )${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($| )`);
    if (pattern.test(haystack)) out.push(other.term);
  }
  return out;
}

export interface RelatedTermsArgs {
  term: string;
}

export async function relatedTerms(args: RelatedTermsArgs): Promise<string> {
  const wanted = (args?.term ?? "").trim().toLowerCase();
  if (!wanted) return "Provide a term to map, for example skibidi.";
  const entry =
    LEXICON.find((e) => e.term.toLowerCase() === wanted) ??
    LEXICON.find((e) => e.term.toLowerCase().replace(/\s+/g, "") === wanted.replace(/\s+/g, ""));
  if (!entry) {
    const near = LEXICON.filter((e) => e.term.toLowerCase().includes(wanted)).map((e) => e.term);
    return near.length
      ? `The lexicon has no term called "${args?.term}". Close by: ${near.slice(0, 10).join(", ")}.`
      : `The lexicon has no term called "${args?.term}".`;
  }
  const outgoing = mentionsIn(entry);
  const incoming = LEXICON.filter((e) => e.term !== entry.term && mentionsIn(e).includes(entry.term));
  const vibeWords = entry.vibe.split("/").map((v) => v.trim()).filter(Boolean);
  const sameVibe = LEXICON.filter((e) => e.term !== entry.term && vibeWords.some((v) => e.vibe.toLowerCase().includes(v.toLowerCase())));
  const lines = [
    `Terms connected to ${entry.term}:`,
    `  its own entry mentions: ${outgoing.length}${outgoing.length ? ` (${outgoing.join(", ")})` : " (it names no other lexicon term)"}`,
    `  entries that mention it: ${incoming.length}${incoming.length ? ` (${incoming.map((e) => e.term).join(", ")})` : " (none)"}`,
    `  sharing a vibe word: ${sameVibe.length}${sameVibe.length ? ` (${sameVibe.slice(0, 15).map((e) => e.term).join(", ")}${sameVibe.length > 15 ? `, and ${sameVibe.length - 15} more` : ""})` : " (none)"}`,
    `  its vibe field: ${entry.vibe}`,
  ];
  for (const term of outgoing.slice(0, 12)) {
    const mutual = mentionsIn(LEXICON.find((e) => e.term === term) as SlangEntry).includes(entry.term);
    lines.push(`  ${entry.term} -> ${term}: ${mutual ? "mentioned both ways" : "one way only, that entry does not mention it back"}`);
  }
  lines.push("  a link is counted when the other term's text appears in this entry's meaning, origin or example, and the count is exact rather than a fuzzy match.");
  return lines.join("\n");
}

// ---- gap3d tools:

// The lexicon ships in this package and this server makes no network calls, so
// this tool reads the same local LEXICON the other tools do. What it adds is a
// different question again: search_terms is a substring filter and
// related_terms is an exact-mention graph, so neither answers "which entries
// are worded most like this one".

/** Content words of an entry, stop words dropped, lowercased and stemmed. */
function simTokens(entry: SlangEntry): Map<string, number> {
  const stop = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'but', 'by', 'for', 'from',
    'has', 'have', 'in', 'into', 'is', 'it', 'its', 'means', 'of', 'on', 'or', 'so',
    'that', 'the', 'then', 'this', 'to', 'was', 'were', 'which', 'with', 'you',
  ])
  const out = new Map<string, number>()
  const text = `${entry.term} ${entry.meaning} ${entry.origin} ${entry.example}`.toLowerCase()
  for (const word of text.replace(/[^a-z0-9'\s-]/g, ' ').split(/\s+/)) {
    const clean = word.replace(/^[-']+|[-']+$/g, '')
    if (clean.length < 3 || stop.has(clean)) continue
    // A crude suffix fold so "raiding" and "raid" count as the same word. It is
    // a similarity aid, not morphology, and the report says so.
    const stem = clean.length > 5 ? clean.replace(/(?:ing|ers?|ies|ed|es|s)$/, '') : clean
    const key = stem.length >= 3 ? stem : clean
    out.set(key, (out.get(key) ?? 0) + 1)
  }
  return out
}

/** Cosine similarity over the term-frequency maps, 0 when they share nothing. */
function termSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  if (!a.size || !b.size) return 0
  let dot = 0
  let na = 0
  let nb = 0
  for (const n of a.values()) na += n * n
  for (const n of b.values()) nb += n * n
  for (const [key, count] of a) {
    const other = b.get(key)
    if (other) dot += count * other
  }
  if (na === 0 || nb === 0) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

export interface SimilarTermsArgs {
  term: string
  limit?: number
}

export async function similarTerms(args: SimilarTermsArgs): Promise<string> {
  const wanted = (args?.term ?? '').trim().toLowerCase()
  if (!wanted) return 'Provide a term to compare, for example skibidi.'
  const limit = Math.max(1, Math.min(Math.floor(Number(args?.limit ?? 8) || 8), 25))
  const entry =
    LEXICON.find((e) => e.term.toLowerCase() === wanted) ??
    LEXICON.find((e) => e.term.toLowerCase().replace(/\s+/g, '') === wanted.replace(/\s+/g, ''))
  if (!entry) {
    const near = LEXICON.filter((e) => e.term.toLowerCase().includes(wanted)).map((e) => e.term)
    return near.length
      ? `The lexicon has no term called "${args?.term}". Close by: ${near.slice(0, 10).join(', ')}.`
      : `The lexicon has no term called "${args?.term}".`
  }
  const mine = simTokens(entry)
  const scored = LEXICON
    .filter((e) => e.term !== entry.term)
    .map((e) => {
      const theirs = simTokens(e)
      const shared: string[] = []
      for (const key of mine.keys()) if (theirs.has(key)) shared.push(key)
      return { entry: e, score: termSimilarity(mine, theirs), shared }
    })
    .filter((row) => row.shared.length > 0)
    .sort((a, b) => b.score - a.score || a.entry.term.localeCompare(b.entry.term))
  const shown = scored.slice(0, limit)
  const lines = [
    `Lexicon entries worded most like ${entry.term} (${LEXICON.length} entries compared):`,
    `  terms sharing at least one content word with it: ${scored.length}`,
  ]
  for (const row of shown) {
    lines.push(
      `  ${row.entry.term} — similarity ${row.score.toFixed(3)}, ${row.shared.length} shared word(s): ${row.shared.slice(0, 10).join(', ')}`,
    )
    lines.push(`     ${row.entry.meaning.slice(0, 120)}`)
  }
  if (!shown.length) lines.push('  no other entry shares a content word with it.')
  if (scored.length > shown.length) lines.push(`  ...and ${scored.length - shown.length} more with a lower score.`)
  lines.push('  similarity is cosine over content-word frequency in the term, meaning, origin and example, with a crude suffix fold; it measures shared wording, not meaning.')
  return lines.join('\n')
}
