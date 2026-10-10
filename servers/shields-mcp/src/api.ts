const BASE = 'https://img.shields.io/badge';

export interface BadgeArgs {
  label: string;
  message: string;
  color?: string;
}

export async function badge(args: BadgeArgs): Promise<string> {
  const label = (args.label ?? '').trim();
  const message = (args.message ?? '').trim();
  if (!label || !message) return 'Provide both a label and a message.';
  const color = (args.color ?? 'green').trim();
  const safe = (s: string): string => s.replace(/[^a-zA-Z0-9-_.]+/g, '_');
  return `${BASE}/${safe(label)}-${safe(message)}-${safe(color)}.svg`;
}

// ---- muxB tools:

const SHIELDS = 'https://img.shields.io'

interface ShieldJson {
  label?: string
  message?: string
  value?: string
  color?: string
  link?: string[]
  name?: string
}

async function shield(metricPath: string): Promise<ShieldJson> {
  const res = await fetch(`${SHIELDS}/${metricPath}.json`, {
    headers: { 'User-Agent': 'shields-mcp/1.0', Accept: 'application/json' },
    redirect: 'follow',
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`Shields.io returned ${res.status} for ${metricPath}`)
  return (await res.json()) as ShieldJson
}

const SHIELD_VALUE = (d: ShieldJson): string => {
  const v = d?.value ?? d?.message
  return v != null && String(v).trim() ? String(v).trim() : 'not reported'
}

const SHIELD_SAFE = (s: string): string => s.replace(/[^a-zA-Z0-9-_.]+/g, '_')

export interface PackageVersionArgs {
  ecosystem: string
  packageName: string
}

const PACKAGE_METRICS: Record<string, { path: string; label: string }> = {
  npm: { path: 'npm/v', label: 'npm' },
  pypi: { path: 'pypi/v', label: 'PyPI' },
  crates: { path: 'crates/v', label: 'crates.io' },
  nuget: { path: 'nuget/v', label: 'NuGet' },
  packagist: { path: 'packagist/v', label: 'Packagist' },
  gem: { path: 'gem/v', label: 'RubyGems' },
}

export interface RepoBadgeArgs {
  owner: string
  repo: string
  metric: string
}

const REPO_METRICS: Record<string, string> = {
  stars: 'stars',
  forks: 'forks',
  issues: 'issues',
  'issues-closed': 'issues-closed',
  contributors: 'contributors',
  'last-commit': 'last-commit',
  'release-date': 'release-date',
  'repo-size': 'repo-size',
  'commit-activity-y': 'commit-activity/y',
  'commit-activity-m': 'commit-activity/m',
}

