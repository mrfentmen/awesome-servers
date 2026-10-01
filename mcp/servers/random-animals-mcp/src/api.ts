const BASE = 'https://some-random-api.com/animal';

const TYPES = ['dog', 'cat', 'fox', 'bird', 'panda', 'koala', 'duck'];

export interface AnimalArgs {
  type?: string;
}

export async function animal(args: AnimalArgs): Promise<string> {
  const type = (args.type ?? 'dog').trim().toLowerCase();
  if (!TYPES.includes(type)) return `Pick one of: ${TYPES.join(', ')}.`;
  const res = await fetch(`${BASE}/${type}`, {
    headers: { 'User-Agent': 'mrfentmen-random-animals-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Some Random API returned ${res.status}`);
  const d = (await res.json()) as { image?: string; fact?: string };
  if (!d.image) return `No ${type} photo returned.`;
  return `Random ${type}: ${d.image}${d.fact ? `\nFact: ${d.fact}` : ''}`;
}

// ---- muxB tools:

type InatTaxon = {
  id?: number;
  name?: string;
  preferred_common_name?: string;
  rank?: string;
  observations_count?: number;
  wikipedia_url?: string;
  wikipedia_summary?: string;
  is_active?: boolean;
  extinct?: boolean;
  conservation_status?: { status_name?: string; authority?: string } | null;
  default_photo?: { medium_url?: string; license_code?: string; attribution?: string };
  ancestors?: { name?: string; rank?: string }[];
  endemic?: boolean;
  introduced?: boolean;
  native?: boolean;
};

type InatObs = {
  id?: number;
  observed_on?: string | null;
  observed_on_string?: string | null;
  place_guess?: string | null;
  quality_grade?: string;
  captive?: boolean;
  identifications_count?: number;
  user?: { login?: string };
  taxon?: { name?: string; preferred_common_name?: string };
  photos?: { url?: string; license_code?: string | null }[];
};

