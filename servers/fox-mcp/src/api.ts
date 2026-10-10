const BASE = 'https://randomfox.ca/floof/';

export interface RandomArgs {
  // No arguments needed.
}

export async function random(_args: RandomArgs): Promise<string> {
  const res = await fetch(BASE, {
    headers: { 'User-Agent': 'mrfentmen-fox-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`RandomFox returned ${res.status}`);
  const d = (await res.json()) as { image?: string; link?: string };
  if (!d.image) return 'No fox photo returned.';
  return `Random fox:\n${d.image}`;
}

// ---- muxB tools:

interface GbifTaxon {
  key?: number;
  scientificName?: string;
  canonicalName?: string;
  rank?: string;
  kingdom?: string;
  phylum?: string;
  className?: string;
  order?: string;
  family?: string;
  genus?: string;
  species?: string;
  vernacularName?: string;
}

interface GbifOccurrence {
  key?: number;
  scientificName?: string;
  country?: string;
  stateProvince?: string;
  year?: number;
  month?: number;
  day?: number;
  basisOfRecord?: string;
  eventDate?: string;
  datasetTitle?: string;
}

export interface FoxSpeciesArgs {
  query?: string;
  limit?: number;
}

export interface FoxSightingsArgs {
  scientific_name?: string;
  limit?: number;
}

