const BASE = 'https://api.db-ip.com/v2/free';
const UA = 'mrfentmen-db-ip-mcp/1.0';
export async function lookup(args) {
    const ip = (args.ip ?? '').trim();
    if (!ip)
        return 'Provide an IP address.';
    const res = await fetch(`${BASE}/${encodeURIComponent(ip)}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`DB-IP returned ${res.status}`);
    const d = (await res.json());
    const get = (k) => String(d[k] ?? '?');
    return [
        `DB-IP for ${ip}:`,
        `Country: ${get('countryName')} (${get('countryCode')})`,
        `Continent: ${get('continentCode')}`,
        d.stateProv ? `State: ${get('stateProv')}` : null,
        d.city ? `City: ${get('city')}` : null,
        d.latitude != null ? `Latitude: ${get('latitude')} | Longitude: ${get('longitude')}` : null,
        d.timeZone ? `Timezone: ${get('timeZone')}` : null,
    ].filter(Boolean).join('\n');
}
// ---- muxE tools:
// The one existing tool asks the DB-IP free tier for one address, and that tier
// answers seven fields: continent, country, state, city and the two codes, with
// no coordinates and no timezone, so the tool's latitude, longitude and timezone
// lines can never print. The new tools ask the two questions that data cannot
// answer at all: who is legally registered to hold the address, and where does
// my own traffic actually leave from.
const EGRESS_GEO = "https://ipwho.is/";
const SELF_GEO = "https://api.db-ip.com/v2/free/self";
const DBIP_UA = "mrfentmen-db-ip-mcp/1.0";
async function dbIpJson(url) {
    const res = await fetch(url, {
        headers: { 'User-Agent': DBIP_UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 404)
        throw new Error('DB-IP does not know that address.');
    if (res.status === 429)
        throw new Error('DB-IP rate limit hit, wait a moment and retry.');
    if (!res.ok)
        throw new Error(`DB-IP returned ${res.status}`);
    const raw = await res.text();
    if (!raw.trim())
        return {};
    try {
        return JSON.parse(raw);
    }
    catch {
        throw new Error('DB-IP returned a body that is not JSON.');
    }
}
const field = (value) => value === undefined || value === null || value === '' ? 'not reported' : String(value);
export async function egressProfile(_args = {}) {
    const self = await dbIpJson(SELF_GEO);
    const address = field(self.ipAddress);
    if (!address || address === 'not reported')
        throw new Error('DB-IP did not report a public address for this connection.');
    const geo = await dbIpJson(`${EGRESS_GEO}${encodeURIComponent(address)}`);
    if (geo.success === false) {
        throw new Error(`The geolocation provider refused ${address}: ${field(geo.message)}`);
    }
    const conn = geo.connection ?? {};
    const tz = geo.timezone ?? {};
    const lines = [
        `Where this connection leaves from, as ${address}:`,
        `  address family: ${field(geo.type)}`,
        `  DB-IP free tier: ${field(self.countryName)} (${field(self.countryCode)}), ${field(self.stateProv)}, ${field(self.city)}, continent ${field(self.continentCode)}`,
        `  geolocation provider: ${field(geo.city)}, ${field(geo.region)}, ${field(geo.country)} (${field(geo.country_code)})`,
        `  coordinates: ${field(geo.latitude)}, ${field(geo.longitude)}, postal code ${field(geo.postal)}`,
        `  country calling code: ${field(geo.calling_code)}, capital ${field(geo.capital)}, in the EU: ${geo.is_eu === true ? 'yes' : 'no'}`,
        `  autonomous system: AS${field(conn.asn)}, organisation ${field(conn.org)}, isp ${field(conn.isp)}`,
        `  announced domain: ${field(conn.domain)}`,
        `  time zone: ${field(tz.id)} (${field(tz.abbr)}), UTC offset ${field(tz.utc_offset)}, daylight saving ${tz.is_dst === true ? 'in effect' : 'not in effect'}`,
    ];
    if (geo.flag?.emoji)
        lines.push(`  flag: ${geo.flag.emoji}`);
    const conflicts = [];
    const dbCity = field(self.city);
    const dbCountry = field(self.countryCode);
    if (dbCountry && geo.country_code && dbCountry !== geo.country_code) {
        conflicts.push(`country, DB-IP says ${dbCountry} and the provider says ${geo.country_code}`);
    }
    if (dbCity && geo.city && dbCity.toLowerCase() !== geo.city.toLowerCase()) {
        conflicts.push(`city, DB-IP says ${dbCity} and the provider says ${geo.city}`);
    }
    if (conflicts.length) {
        lines.push(`  the two providers disagree on ${conflicts.length} field(s):`);
        for (const c of conflicts)
            lines.push(`    ${c}`);
        lines.push('  IP geolocation is approximate and a disagreement is normal rather than an error.');
    }
    else {
        lines.push('  both providers agree on the country and city.');
    }
    lines.push('  the DB-IP free tier returns no coordinates and no time zone at all, which is why the provider above supplies them.');
    return lines.join('\n');
}
