export class LinearError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "LinearError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function key(): string {
  const k = process.env.LINEAR_API_KEY;
  if (!k) throw new LinearError("Set LINEAR_API_KEY (Linear personal key).");
  return k;
}

async function gql(query: string, variables: Record<string, unknown> = {}): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: { ...UA, Accept: "application/json", "Content-Type": "application/json", Authorization: key() },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new LinearError(`Network error: ${(e as Error).message}`);
  }
  const text = await res.text();
  if (!res.ok) throw new LinearError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  return text.slice(0, 12000);
}

export function me(): Promise<string> {
  return gql("query { viewer { id name email } }");
}

export function listTeams(): Promise<string> {
  return gql("query { teams { nodes { id name key } } }");
}

export function searchIssues(term: string, limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 50);
  return gql(
    "query($t: String!, $n: Int!) { searchIssues(term: $t, first: $n) { nodes { id identifier title state { name } } } }",
    { t: term, n }
  );
}

export function getIssue(issueId: string): Promise<string> {
  return gql("query($id: String!) { issue(id: $id) { id identifier title description state { name } } }", { id: issueId });
}

export function teamIssues(teamId: string, limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 50);
  return gql(
    "query($t: String!, $n: Int!) { team(id: $t) { issues(first: $n) { nodes { id identifier title state { name } } } } }",
    { t: teamId, n }
  );
}

export function listProjects(): Promise<string> {
  return gql("query { projects(first: 20) { nodes { id name state } } }");
}

export function myIssues(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 50);
  return gql(
    "query($n: Int!) { viewer { assignedIssues(first: $n) { nodes { id identifier title state { name } } } } }",
    { n }
  );
}

export function listLabels(teamId: string): Promise<string> {
  return gql("query($t: String!) { team(id: $t) { labels(first: 50) { nodes { id name color } } } }", { t: teamId });
}

export function createIssue(teamId: string, title: string, description?: string): Promise<string> {
  return gql(
    "mutation($t: String!, $ti: String!, $d: String) { issueCreate(input: { teamId: $t, title: $ti, description: $d }) { success issue { id identifier } } }",
    { t: teamId, ti: title, d: description ?? "" }
  );
}

export function updateIssueTitle(issueId: string, title: string): Promise<string> {
  return gql(
    "mutation($id: String!, $ti: String!) { issueUpdate(id: $id, input: { title: $ti }) { success issue { id identifier title } } }",
    { id: issueId, ti: title }
  );
}

// ---- muxG tools:

interface NpmDownloads {
  downloads?: number;
  start?: string;
  end?: string;
  package?: string;
}

interface NpmVersionEntry {
  version?: string;
  deprecated?: string;
  license?: string;
  deprecatedVersion?: string;
}

interface NpmRegistry {
  "dist-tags"?: Record<string, string>;
  time?: Record<string, string>;
  versions?: Record<string, NpmVersionEntry>;
  description?: string;
  homepage?: string;
  maintainers?: Array<{ name?: string }>;
}

interface ScorecardCheck {
  name?: string;
  score?: number;
  reason?: string;
  details?: string;
}

interface Scorecard {
  score?: number;
  date?: string;
  repo?: { name?: string; commit?: string };
  checks?: ScorecardCheck[];
}

// The scorecard path includes the forge host, so github.com/owner/repo is the
// default and a full repository URL is accepted as written.

