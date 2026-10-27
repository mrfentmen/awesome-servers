const BASE = "https://ghoapi.azureedge.net/api";
const UA = "mrfentmen-who-mcp/1.0 (https://github.com/mrfentmen)";
export class WhoError extends Error {
}
async function get(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new WhoError(`WHO GHO returned HTTP ${res.status}`);
    return (await res.json());
}
export async function indicator(args) {
    const code = (args.code ?? "").trim();
    if (!code)
        throw new WhoError("Provide a WHO indicator code like WHOSIS_000001");
    const limit = Math.min(args.limit ?? 10, 25);
    const d = await get(`${BASE}/${encodeURIComponent(code)}?$top=${limit}`);
    const rows = (d?.value ?? []);
    if (!rows.length)
        return `No data for indicator ${code}`;
    const lines = rows.map((r) => {
        const place = r?.SpatialDim ?? "global";
        const time = r?.TimeDim ?? "";
        const val = r?.NumericValue != null ? Number(r.NumericValue).toLocaleString() : (r?.Value ?? "n/a");
        return `${place} ${time}: ${val}`;
    });
    return `WHO indicator ${code}:\n` + lines.join("\n");
}
export async function search(args) {
    const q = (args.query ?? "").trim();
    if (!q)
        throw new WhoError("Provide a search query");
    const limit = Math.min(args.limit ?? 10, 25);
    const d = await get(`${BASE}/Indicator?$filter=contains(IndicatorName,'${q.replace(/'/g, "''")}')&$top=${limit}&$select=IndicatorCode,IndicatorName`);
    const rows = (d?.value ?? []);
    if (!rows.length)
        return `No WHO indicators match \"${q}\"`;
    return `WHO indicators matching \"${q}\":\n` + rows.map((r, i) => `${i + 1}. ${r?.IndicatorCode ?? "n/a"} | ${r?.IndicatorName ?? "n/a"}`).join("\n");
}
// ---- muxE tools:
// indicator prints SpatialDim, TimeDim and the value, one row per line, and
// search prints an indicator code and name. The GHO OData service carries a
// great deal more, and all of it was verified live: an IndicatorDimension set
// that says which dimensions an indicator can be sliced by, a DIMENSION set that
// names those dimensions, and, on every data row, the WHO region a place sits
// in, up to three sub-dimension codes, the low and high interval around a
// figure, the data source and the date the row was loaded. None of that is
// readable through the existing tools, and without it a caller cannot even tell
// what a SpatialDim value is encoded in.
const GHO = 'https://ghoapi.azureedge.net/api';
const num = (v) => {
    const n = typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : NaN;
    return Number.isFinite(n) ? n : null;
};
// GHO writes the string "None" rather than null for an absent field, which is
// a trap for any code that only tests for null.
const val = (v) => {
    if (typeof v !== 'string')
        return typeof v === 'number' ? String(v) : null;
    const t = v.trim();
    if (!t || t === 'None' || t === 'null')
        return null;
    return t;
};
const short = (v, max = 70) => {
    const s = val(v);
    if (!s)
        return 'not reported';
    return s.length > max ? `${s.slice(0, max)}...` : s;
};
function indicatorCode(raw) {
    const code = String(raw ?? '').trim();
    if (!code)
        throw new WhoError("Provide a WHO indicator code like WHS4_100");
    if (!/^[A-Za-z0-9_]{3,60}$/.test(code)) {
        throw new WhoError(`"${raw}" is not shaped like a WHO indicator code. They are letters, digits and underscores, for example WHS4_100.`);
    }
    return code.toUpperCase();
}
async function odata(path) {
    const res = await fetch(`${GHO}${path}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new WhoError(`WHO GHO returned HTTP ${res.status}`);
    return (await res.json());
}
const esc = (s) => s.replace(/'/g, "''");
export async function indicator_dimensions(args) {
    const code = indicatorCode(args?.code);
    const rows = await odata(`/IndicatorDimension?$filter=IndicatorCode eq '${esc(code)}'&$select=IndicatorCode,Dimension,DimensionName&$top=60`);
    const dims = Array.isArray(rows.value) ? rows.value : [];
    const nameRows = await odata(`/DIMENSION?$top=400`);
    const catalogue = new Map();
    for (const r of nameRows.value ?? []) {
        const k = val(r.Code);
        if (k)
            catalogue.set(k, val(r.Title) ?? k);
    }
    const head = `Dimensions the indicator ${code} can be sliced by, from the IndicatorDimension set:`;
    if (!dims.length) {
        return [
            head,
            `  No dimensions are registered for ${code}.`,
            '  The GHO service registers dimensions per indicator, so an empty result means this indicator is published without a dimension record, which is not the same as it having none.',
            '  The dimension catalogue itself holds ' + catalogue.size + ' named dimensions.',
        ].join('\n');
    }
    const unique = new Map();
    for (const d of dims) {
        const k = val(d.Dimension);
        if (k)
            unique.set(k, val(d.DimensionName) ?? catalogue.get(k) ?? k);
    }
    const lines = [head, `  ${unique.size} distinct dimension${unique.size === 1 ? '' : 's'} registered:`];
    for (const [k, name] of [...unique.entries()].sort((a, b) => a[1].localeCompare(b[1]))) {
        const registered = name !== k;
        lines.push(`    ${name}${registered ? '' : ' (no friendly name given)'}  [${k}]`);
        if (!registered && catalogue.has(k))
            lines.push(`      the catalogue calls this ${catalogue.get(k)}`);
    }
    lines.push('');
    // The two dimensions that decide how a row should be read are called out,
    // because getting them wrong silently misreads every figure in the series.
    const hasCountry = unique.has('COUNTRY');
    const hasYear = unique.has('YEAR');
    if (hasCountry) {
        lines.push('  COUNTRY is registered, so SpatialDim holds a place code, usually ISO 3166 alpha-3, and ParentLocation on each row carries the WHO region it sits in. It is three letters, not two.');
    }
    else {
        lines.push('  COUNTRY is not registered, so SpatialDim on this indicator is not a country code and must not be read as one.');
    }
    if (hasYear)
        lines.push('  YEAR is registered, so TimeDim is a calendar year as a string.');
    const sub = [...unique.keys()].filter((k) => !['COUNTRY', 'YEAR', 'REGION', 'PUBLISHSTATE', 'WORLDBANKINCOMEGROUP'].includes(k));
    if (sub.length) {
        lines.push(`  other dimensions, which appear on the rows as Dim1 to Dim3: ${sub.join(', ')}.`);
        lines.push('  Which column a dimension lands in is not documented by the service, so the value has to be read against the dimension it names.');
    }
    if (!hasCountry && !hasYear)
        lines.push('  Neither COUNTRY nor YEAR is registered, so the row shape for this indicator is not the usual one.');
    lines.push('');
    lines.push(`  The dimension catalogue holds ${catalogue.size} named dimensions overall.`);
    lines.push("  The existing tools read none of this, so a caller has no way to tell what a SpatialDim value is encoded in.");
    return lines.join('\n');
}
// GHO publishes 266 rows, one per country, each carrying the WHO region the
// country sits in. That is the table that turns a SpatialDim code into a name,
// which indicator_places reports but cannot resolve.
