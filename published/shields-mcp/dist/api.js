const BASE = 'https://img.shields.io/badge';
export async function badge(args) {
    const label = (args.label ?? '').trim();
    const message = (args.message ?? '').trim();
    if (!label || !message)
        return 'Provide both a label and a message.';
    const color = (args.color ?? 'green').trim();
    const safe = (s) => s.replace(/[^a-zA-Z0-9-_.]+/g, '_');
    return `${BASE}/${safe(label)}-${safe(message)}-${safe(color)}.svg`;
}
// ---- muxB tools:
const SHIELDS = 'https://img.shields.io';
async function shield(metricPath) {
    const res = await fetch(`${SHIELDS}/${metricPath}.json`, {
        headers: { 'User-Agent': 'shields-mcp/1.0', Accept: 'application/json' },
        redirect: 'follow',
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Shields.io returned ${res.status} for ${metricPath}`);
    return (await res.json());
}
const SHIELD_VALUE = (d) => {
    const v = d?.value ?? d?.message;
    return v != null && String(v).trim() ? String(v).trim() : 'not reported';
};
const SHIELD_SAFE = (s) => s.replace(/[^a-zA-Z0-9-_.]+/g, '_');
const PACKAGE_METRICS = {
    npm: { path: 'npm/v', label: 'npm' },
    pypi: { path: 'pypi/v', label: 'PyPI' },
    crates: { path: 'crates/v', label: 'crates.io' },
    nuget: { path: 'nuget/v', label: 'NuGet' },
    packagist: { path: 'packagist/v', label: 'Packagist' },
    gem: { path: 'gem/v', label: 'RubyGems' },
};
const REPO_METRICS = {
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
};
