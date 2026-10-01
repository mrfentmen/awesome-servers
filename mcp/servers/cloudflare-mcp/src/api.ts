export class CloudflareError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CloudflareError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function headers(): Record<string, string> {
  const k = process.env.CLOUDFLARE_API_TOKEN;
  if (!k) throw new CloudflareError("Set CLOUDFLARE_API_TOKEN (Cloudflare API token).");
  return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.cloudflare.com/client/v4" + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new CloudflareError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new CloudflareError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function listZones(): Promise<string> {
  return get("/zones?per_page=20");
}

export function listAccounts(): Promise<string> {
  return get("/accounts?per_page=20");
}

export function listDns(zoneId: string): Promise<string> {
  return get(`/zones/${encodeURIComponent(zoneId)}/dns_records?per_page=50`);
}



export function zoneDetails(zoneId: string): Promise<string> {
  return get(`/zones/${encodeURIComponent(zoneId)}`);
}

export function dnsRecord(zoneId: string, recordId: string): Promise<string> {
  return get(`/zones/${encodeURIComponent(zoneId)}/dns_records/${encodeURIComponent(recordId)}`);
}

export function firewallRules(zoneId: string): Promise<string> {
  return get(`/zones/${encodeURIComponent(zoneId)}/firewall/rules?per_page=20`);
}

export function pageRules(zoneId: string): Promise<string> {
  return get(`/zones/${encodeURIComponent(zoneId)}/pagerules?per_page=20`);
}

export function workers(accountId: string): Promise<string> {
  return get(`/accounts/${encodeURIComponent(accountId)}/workers/scripts?per_page=20`);
}

export function analytics(zoneId: string): Promise<string> {
  return get(`/zones/${encodeURIComponent(zoneId)}/analytics/dashboard?since=-1440`).then((t) => t.slice(0, 6000));
}

export function tunnels(accountId: string): Promise<string> {
  return get(`/accounts/${encodeURIComponent(accountId)}/cfd_tunnel?is_deleted=false&per_page=20`);
}

// ---- muxD tools:

/** Cloudflare wraps everything in { success, errors, messages, result, result_info }. */
async function cfEnvelope(path: string): Promise<{ result: any; resultInfo: any }> {
  const raw = await get(path);
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new CloudflareError(`Cloudflare returned a non-JSON body for ${path}: ${raw.slice(0, 200)}`);
  }
  if (parsed?.success === false) {
    const errs = (parsed?.errors ?? []).map((x: any) => `${x?.code ?? "?"} ${x?.message ?? ""}`.trim());
    throw new CloudflareError(`Cloudflare rejected ${path}: ${errs.join("; ") || raw.slice(0, 200)}`);
  }
  return { result: parsed?.result, resultInfo: parsed?.result_info };
}

const cfStamp = (value: unknown): string => {
  const s = String(value ?? "");
  const t = Date.parse(s);
  return Number.isFinite(t) ? new Date(t).toISOString().replace("T", " ").slice(0, 16) + "Z" : s || "?";
};

const zoneArg = (value: unknown): string => {
  const id = String(value ?? "").trim();
  if (!id) throw new CloudflareError("Provide zone_id (see list_zones).");
  return id;
};

/** Settings whose value either weakens transport security or silently changes how a zone serves traffic. */
const NOTABLE_SETTINGS = new Set([
  "always_use_https", "automatic_https_rewrites", "min_tls_version", "tls_1_3", "opportunistic_encryption", "opportunistic_onion",
  "ssl", "browser_check", "security_level", "challenge_ttl", "ipv6", "websockets", "http3", "0rtt", "brotli", "minify",
  "long_profile_caching", "replace_insecure_js", "pseudo_ipv4", "proxy_read_only", "orange_cloud", "polish", "mirage",
]);

export interface ZoneSettingsArgs {
  zone_id: string;
  only_changed?: string;
}

/** Every tunable on a zone, with the ones that matter for transport security and caching called out. */
export async function zoneSettings(args: ZoneSettingsArgs): Promise<string> {
  const zoneId = zoneArg(args.zone_id);
  const { result, resultInfo } = await cfEnvelope(`/zones/${encodeURIComponent(zoneId)}/settings?per_page=200`);
  const rows: any[] = Array.isArray(result) ? result : [];
  if (!rows.length) throw new CloudflareError(`Cloudflare returned no settings for zone ${zoneId}.`);
  const changedOnly = args.only_changed === undefined ? true : args.only_changed !== "false" && args.only_changed !== "0";

  const count = Number(resultInfo?.count);
  const total = Number.isFinite(count) && count > rows.length ? count : rows.length;
  const lines = [`Zone settings for ${zoneId} — ${rows.length} of ${total} setting(s) returned`];
  if (total > rows.length) lines.push(`Warning: the API reports ${total} settings but returned only ${rows.length}; raise the page size rather than treating this as the full set.`);

  const changed = rows.filter((r) => String(r?.value) !== String(r?.default));
  lines.push(`${changed.length} setting(s) differ from the Cloudflare default.`);
  if (changedOnly) {
    lines.push("", "Settings that differ from the default:");
    for (const r of changed.sort((a, b) => String(a?.id).localeCompare(String(b?.id)))) {
      const notable = NOTABLE_SETTINGS.has(String(r?.id)) ? " *" : "";
      lines.push(`  ${String(r?.id).padEnd(30)} ${String(r?.value).slice(0, 60)}${notable} (default ${String(r?.default).slice(0, 40)}) | editable ${r?.editable ?? "?"} | changed ${cfStamp(r?.modified_on)}`);
    }
    if (!changed.length) lines.push("  (none — the zone runs entirely on Cloudflare defaults)");
    lines.push("", "* directly affects transport security, TLS or caching");
  } else {
    lines.push("", "All settings:");
    for (const r of rows.sort((a, b) => String(a?.id).localeCompare(String(b?.id)))) {
      const notable = NOTABLE_SETTINGS.has(String(r?.id)) ? " *" : "";
      const isDefault = String(r?.value) === String(r?.default);
      lines.push(`  ${String(r?.id).padEnd(30)} ${String(r?.value).slice(0, 60)}${notable} (default ${String(r?.default).slice(0, 40)})${isDefault ? "" : " [changed]"}`);
    }
    lines.push("", "* directly affects transport security, TLS or caching");
  }
  return lines.join("\n");
}

const PHASE_MEANING: Record<string, string> = {
  "http_request_firewall_custom": "custom WAF rules",
  "http_request_firewall_managed": "managed WAF rules",
  "http_request_sbfm_definitely_automated": "Super Bot Fight Mode",
  "http_request_firewall_open": "IP / ASN blocking",
  "http_request_transform": "URL and header rewrites",
  "http_request_dynamic_redirect": "dynamic redirects",
  "http_request_late_transform": "late transforms",
  "http_request_sanitize_settings": "settings sanitiser",
  "http_response_headers_transform": "response header rewrites",
  "http_response_transform": "response body rewrites",
  "http_request_ratelimit": "rate limiting",
};

export interface ZoneRulesetsArgs {
  zone_id: string;
  phase?: string;
}

/** The ruleset phases configured on a zone, which is where WAF, redirects and transforms actually live. */
export async function zoneRulesets(args: ZoneRulesetsArgs): Promise<string> {
  const zoneId = zoneArg(args.zone_id);
  const { result } = await cfEnvelope(`/zones/${encodeURIComponent(zoneId)}/rulesets?per_page=50`);
  const rows: any[] = Array.isArray(result) ? result : [];
  if (!rows.length) {
    const phase = args.phase?.trim();
    return `No rulesets are configured on zone ${zoneId}${phase ? ` for phase ${phase}` : ""}. A zone with no rulesets has no WAF custom rules and no Cloudflare-managed redirect rules.`;
  }
  const wanted = (args.phase ?? "").trim();
  const kept = wanted ? rows.filter((r) => String(r?.phase) === wanted) : rows;
  if (!kept.length) {
    const phases = [...new Set(rows.map((r) => String(r?.phase ?? "?")))].sort();
    return `No ruleset on zone ${zoneId} uses phase ${wanted}. Phases present: ${phases.join(", ")}`;
  }

  const lines = [
    `Rulesets on zone ${zoneId}${wanted ? `, phase ${wanted}` : ""} — ${kept.length} of ${rows.length} shown`,
    "",
  ];
  for (const r of kept.sort((a, b) => String(a?.phase).localeCompare(String(b?.phase)) || String(a?.name).localeCompare(String(b?.name)))) {
    const phase = String(r?.phase ?? "?");
    lines.push(`${r?.name ?? "(unnamed)"}`, `  id ${r?.id ?? "?"} | kind ${r?.kind ?? "?"} | version ${r?.version ?? "?"} | updated ${cfStamp(r?.last_updated)}`);
    lines.push(`  phase ${phase} — ${PHASE_MEANING[phase] ?? "unrecognised phase, check the Cloudflare docs"}`);
    if (r?.description) lines.push(`  ${String(r.description).slice(0, 200)}`);
  }
  const unknown = kept.map((r) => String(r?.phase)).filter((p) => !PHASE_MEANING[p]);
  if (unknown.length) lines.push("", `Warning: unrecognised phase(s) ${[...new Set(unknown)].join(", ")} — the phase meanings above may be out of date with the Cloudflare API.`);
  return lines.join("\n");
}

export interface OriginPullArgs {
  zone_id: string;
}

/** Origin pull certificates, which decide which client certificates the edge will accept. */
export async function originPullCertificates(args: OriginPullArgs): Promise<string> {
  const zoneId = zoneArg(args.zone_id);
  const { result, resultInfo } = await cfEnvelope(`/zones/${encodeURIComponent(zoneId)}/origin_tls_client_auth/hostnames/certificates?per_page=50`);
  const rows: any[] = Array.isArray(result) ? result : [];
  const count = Number(resultInfo?.count);
  if (!rows.length) {
    return `No origin pull certificates on zone ${zoneId}. With none configured the edge does not require a client certificate on origin fetches, so any origin address that is reachable another way stays reachable.`;
  }
  const now = Date.now();
  const certTotal = Number.isFinite(count) && count > rows.length ? count : rows.length;
  const lines = [`Origin pull certificates on zone ${zoneId} — ${rows.length} of ${certTotal}`, ""];
  if (certTotal > rows.length) lines.push(`Warning: the API reports ${certTotal} certificates but returned ${rows.length}; the rest were not inspected.`, "");
  for (const c of rows) {
    const hosts = Array.isArray(c?.hostnames) && c.hostnames.length ? c.hostnames : ["(no hostname bound)"];
    const expires = Date.parse(String(c?.expires_on ?? ""));
    const daysLeft = Number.isFinite(expires) ? Math.round((expires - now) / 86400000) : null;
    const expiryNote = daysLeft === null ? "" : daysLeft < 0 ? `  EXPIRED ${Math.abs(daysLeft)} day(s) ago` : daysLeft <= 14 ? `  expires in ${daysLeft} day(s)` : `  expires in ${daysLeft} days`;
    lines.push(`${c?.status ?? "?"} — ${hosts.join(", ")}${expiryNote}`);
    lines.push(`  id ${c?.id ?? "?"} | uploaded ${cfStamp(c?.uploaded_on)} | issuer ${c?.issuer ?? "?"}`);
    if (c?.serial_number) lines.push(`  serial ${String(c.serial_number).slice(0, 80)}`);
  }
  return lines.join("\n");
}
