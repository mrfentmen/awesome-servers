const UA = 'mrfentmen-ipapi-mcp/1.0';
export async function lookup(args) {
    const ip = (args?.ip ?? '').trim();
    const url = ip ? `https://ipapi.co/${encodeURIComponent(ip)}/json/` : 'https://ipapi.co/json/';
    const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`ipapi.co returned ${res.status}`);
    const d = (await res.json());
    if (d.error)
        throw new Error(`ipapi.co error: ${String(d.reason ?? d.message ?? 'unknown')}`);
    const get = (k) => String(d[k] ?? '?');
    return [
        `ipapi.co geolocation${ip ? ` for ${ip}` : ''}:`,
        `IP: ${get('ip')} | Country: ${get('country_name')} (${get('country_code')})`,
        `Region: ${get('region')} | City: ${get('city')}`,
        `Latitude: ${get('latitude')} | Longitude: ${get('longitude')}`,
        `ISP: ${get('org')} | Timezone: ${get('timezone')}`,
    ].filter(Boolean).join('\n');
}
// ---- muxB tools:
const IP_API_FIELDS = [
    "status", "message", "continent", "country", "countryCode", "regionName", "city", "district",
    "zip", "lat", "lon", "timezone", "offset", "currency", "isp", "org", "as", "asname", "reverse",
    "mobile", "proxy", "hosting", "query",
].join(",");
const RDAP_ROOT = "https://rdap.org";
function vcard(entity, key) {
    const rows = entity?.vcardArray?.[1];
    if (!Array.isArray(rows))
        return "";
    for (const row of rows) {
        if (Array.isArray(row) && row[0] === key)
            return String(row[3] ?? "");
    }
    return "";
}
