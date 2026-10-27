const UA = 'mrfentmen-cbr-mcp/1.0';
export async function rates(_args) {
    const res = await fetch('https://www.cbr-xml-daily.ru/daily_json.js', {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`CBR returned ${res.status}`);
    const d = (await res.json());
    const v = d.Valute ?? {};
    const rows = Object.values(v).map((c) => `${c.CharCode ?? '?'}: ${c.Value ?? '?'} RUB per ${c.Nominal ?? 1} (${c.Name ?? '?'})`);
    return `CBR daily rates for ${d.Date ?? 'today'}:\n${rows.join('\n')}`;
}
// ---- muxA tools:
// The existing tool reads the community JSON mirror. These tools add the
// official Bank of Russia XML scripts, which cover ranges the mirror cannot:
// one currency over an arbitrary date range, and cross rates for any date.
const CBR_SCRIPTS = "https://www.cbr.ru/scripts";
const CBR_MIRROR = "https://www.cbr-xml-daily.ru";
// The official scripts answer windows-1251 and carry Cyrillic currency names.
// Node has full ICU, but the decode is guarded so a build without it still
// reads every field, which are all ASCII apart from the names.
function cbrDecode(buffer) {
    try {
        return new TextDecoder("windows-1251").decode(buffer);
    }
    catch {
        return new TextDecoder("utf-8").decode(buffer);
    }
}
async function cbrText(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/xml, text/xml, */*" },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`CBR returned ${res.status}`);
    return cbrDecode(await res.arrayBuffer());
}
// Every official script answers HTTP 200 even for a rejected date, so the body
// is the only place the failure shows up.
function cbrCheck(xml) {
    if (xml.includes("Error in parameters")) {
        throw new Error("CBR rejected the date, use a real calendar date in the past");
    }
    return xml;
}
function cbrNumber(raw) {
    if (!raw)
        return NaN;
    return Number(raw.trim().replace(",", "."));
}
function cbrParseDay(xml) {
    cbrCheck(xml);
    const date = /<ValCurs Date="([^"]*)"/.exec(xml)?.[1] ?? "";
    const valutes = [];
    const pattern = /<Valute ID="([^"]*)"><NumCode>([^<]*)<\/NumCode><CharCode>([^<]*)<\/CharCode><Nominal>([^<]*)<\/Nominal><Name>([^<]*)<\/Name><Value>([^<]*)<\/Value><VunitRate>([^<]*)<\/VunitRate><\/Valute>/g;
    for (const match of xml.matchAll(pattern)) {
        const value = cbrNumber(match[6]);
        const nominal = cbrNumber(match[4]);
        const unit = cbrNumber(match[7]);
        valutes.push({
            ID: match[1],
            CharCode: match[3].trim().toUpperCase(),
            Nominal: Number.isFinite(nominal) && nominal > 0 ? nominal : 1,
            Name: match[5].trim(),
            Value: Number.isFinite(value) ? value : NaN,
            // VunitRate is the rate for exactly one unit, so it is what cross rates
            // need; if it is missing the per-nominal value is divided instead.
            VunitRate: Number.isFinite(unit) ? unit : Number.isFinite(value) && nominal > 0 ? value / nominal : NaN,
        });
    }
    return { date, valutes };
}
function cbrParseRecords(xml) {
    cbrCheck(xml);
    const records = [];
    const pattern = /<Record Date="([^"]*)" Id="[^"]*"><Nominal>([^<]*)<\/Nominal><Value>([^<]*)<\/Value><VunitRate>([^<]*)<\/VunitRate><\/Record>/g;
    for (const match of xml.matchAll(pattern)) {
        const value = cbrNumber(match[3]);
        const nominal = cbrNumber(match[2]);
        const unit = cbrNumber(match[4]);
        if (!Number.isFinite(value))
            continue;
        records.push({
            date: match[1],
            nominal: Number.isFinite(nominal) && nominal > 0 ? nominal : 1,
            value,
            unit: Number.isFinite(unit) ? unit : value / (nominal > 0 ? nominal : 1),
        });
    }
    return records;
}
// CBR wants DD.MM.YYYY. Callers pass YYYY-MM-DD because that is what people
// write, and the day is checked so an impossible date is refused here rather
// than coming back as a bare error string from the server.
function cbrIsoDate(iso, label) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
    if (!match)
        throw new Error(`${label} must be a date like 2026-09-25`);
    const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
    const probe = new Date(Date.UTC(year, month - 1, day));
    if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) {
        throw new Error(`${label} is not a real calendar date: ${iso}`);
    }
    return { iso: `${match[1]}-${match[2]}-${match[3]}`, param: `${match[3]}.${match[2]}.${match[1]}` };
}
function cbrMoment(dateParam) {
    const [day, month, year] = dateParam.split(".");
    return `${year}-${month}-${day}`;
}
// CBR answers DD.MM.YYYY while callers work in YYYY-MM-DD, so published dates
// are shown in the same shape the caller typed in.
function cbrIsoFrom(cbrDate) {
    const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(cbrDate.trim());
    return match ? `${match[3]}-${match[2]}-${match[1]}` : cbrDate;
}
async function cbrDailyOn(dateParam) {
    const url = dateParam
        ? `${CBR_SCRIPTS}/XML_daily.asp?date_req=${dateParam}`
        : `${CBR_SCRIPTS}/XML_daily.asp`;
    const day = cbrParseDay(await cbrText(url));
    if (!day.valutes.length) {
        throw new Error(dateParam
            ? `CBR published no rates for ${cbrMoment(dateParam)}; weekends, holidays and future dates have no published set`
            : "CBR returned an empty rate list");
    }
    return day;
}
async function cbrFindValute(code) {
    const wanted = code.trim().toUpperCase();
    const day = await cbrDailyOn();
    const valute = day.valutes.find((entry) => entry.CharCode === wanted);
    if (!valute) {
        const sample = day.valutes
            .map((entry) => entry.CharCode)
            .sort()
            .slice(0, 12)
            .join(", ");
        throw new Error(`CBR does not publish a rate for "${wanted}". It lists ${day.valutes.length} currencies, including ${sample}`);
    }
    return { valute, day };
}
function cbrFixed(value, digits = 4) {
    return Number.isFinite(value) ? value.toFixed(digits) : "not published";
}
export async function rateConvert(args) {
    const amount = args.amount ?? 1;
    if (!Number.isFinite(amount))
        throw new Error("amount must be a number");
    const from = (args.from ?? "USD").trim().toUpperCase();
    const to = (args.to ?? "RUB").trim().toUpperCase();
    if (!from || !to)
        throw new Error("Provide a from and a to currency code, RUB is allowed");
    const requested = args.date?.trim() ? cbrIsoDate(args.date.trim(), "date") : null;
    const day = await cbrDailyOn(requested?.param);
    const lookup = new Map();
    for (const entry of day.valutes)
        lookup.set(entry.CharCode, entry);
    // RUB is the base of this table, so it is never one of the listed currencies.
    const perUnit = (code) => {
        if (code === "RUB")
            return 1;
        const entry = lookup.get(code);
        if (!entry || !Number.isFinite(entry.VunitRate))
            return null;
        return entry.VunitRate;
    };
    const fromRate = perUnit(from);
    const toRate = perUnit(to);
    if (fromRate === null)
        throw new Error(`CBR does not publish a rate for "${from}". Use a three letter code like USD, EUR or RUB`);
    if (toRate === null)
        throw new Error(`CBR does not publish a rate for "${to}". Use a three letter code like USD, EUR or RUB`);
    if (toRate === 0)
        throw new Error(`CBR published a zero rate for "${to}", so no conversion is possible`);
    const result = (amount * fromRate) / toRate;
    const lines = [
        `${amount} ${from} = ${result.toFixed(2)} ${to}`,
        "",
        `  Rates used, published for ${cbrIsoFrom(day.date)}:`,
        `    1 ${from} = ${cbrFixed(fromRate)} RUB`,
        `    1 ${to} = ${cbrFixed(toRate)} RUB`,
    ];
    const fromEntry = lookup.get(from);
    const toEntry = lookup.get(to);
    if (fromEntry)
        lines.push(`    ${from} is ${fromEntry.Name}, quoted per ${fromEntry.Nominal} ${from} on the CBR list`);
    if (toEntry)
        lines.push(`    ${to} is ${toEntry.Name}, quoted per ${toEntry.Nominal} ${to} on the CBR list`);
    if (requested && day.date !== cbrMoment(requested.param)) {
        lines.push("", `  Note: you asked for ${requested.iso} and CBR answered with its set for ${cbrIsoFrom(day.date)}, because no rate is published for the date you asked for.`);
    }
    lines.push("", "  Cross rates come from the CBR per unit rates, so no rounding is inherited from a two step conversion through RUB.");
    return lines.join("\n");
}
