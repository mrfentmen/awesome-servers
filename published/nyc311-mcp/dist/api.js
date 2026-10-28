const BASE = "https://data.cityofnewyork.us/resource/erm2-nwe9.json";
const HEADERS = { "User-Agent": "mrfentmen-nyc311-mcp/1.0" };
export class Nyc311Error extends Error {
}
function quote(value) {
    return `'${value.replaceAll("'", "''")}'`;
}
function validateDates(start, end) {
    const parse = (value) => {
        const date = new Date(`${value}T00:00:00Z`);
        if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value)
            throw new Nyc311Error(`Invalid date: ${value}`);
        return date;
    };
    if (start && end && parse(start) >= parse(end))
        throw new Nyc311Error("start must be earlier than end");
    if (start)
        parse(start);
    if (end)
        parse(end);
}
function filters(complaintType, borough, agency, start, end) {
    validateDates(start, end);
    const result = [];
    if (complaintType)
        result.push(`complaint_type = ${quote(complaintType)}`);
    if (borough)
        result.push(`borough = ${quote(borough.toUpperCase())}`);
    if (agency)
        result.push(`agency = ${quote(agency.toUpperCase())}`);
    if (start)
        result.push(`created_date >= ${quote(start)}`);
    if (end)
        result.push(`created_date < ${quote(end)}`);
    return result;
}
async function query(params) {
    const url = new URL(BASE);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(30000) });
    if (!response.ok)
        throw new Nyc311Error(`NYC 311 error ${response.status}`);
    return response.json();
}
export function searchRequests(complaintType, borough, agency, start, end, limit = 20) {
    const where = filters(complaintType, borough, agency, start, end);
    return query({
        $select: "created_date,closed_date,agency,complaint_type,descriptor,borough,status",
        $order: "created_date DESC",
        $limit: String(limit),
        ...(where.length ? { $where: where.join(" AND ") } : {}),
    });
}
export function countRequests(complaintType, borough, agency, start, end, limit = 100) {
    const where = filters(complaintType, borough, agency, start, end);
    return query({
        $select: "complaint_type,count(*) as total",
        $group: "complaint_type",
        $order: "total DESC",
        $limit: String(limit),
        ...(where.length ? { $where: where.join(" AND ") } : {}),
    });
}
export function format(value) { return JSON.stringify(value, null, 2).slice(0, 16000); }
export async function requestDetail(a) {
    const key = String(a.uniqueKey ?? "").trim();
    if (!/^\d{5,12}$/.test(key))
        throw new Nyc311Error("uniqueKey must be a numeric 311 request key");
    return format(await query({
        $select: "unique_key,created_date,closed_date,agency,complaint_type,descriptor,status,resolution_description,borough,community_board",
        $where: `unique_key = ${quote(key)}`,
        $limit: "1",
    }));
}
export async function agencyBreakdown(a) {
    const start = a.start ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const where = filters(undefined, undefined, undefined, start, a.end);
    return format(await query({
        $select: "agency,count(*) as total",
        $group: "agency",
        $order: "total DESC",
        $limit: String(a.limit ?? 20),
        ...(where.length ? { $where: where.join(" AND ") } : {}),
    }));
}
export async function dailyTrend(a) {
    const days = a.days ?? 14;
    if (!Number.isInteger(days) || days < 1 || days > 90)
        throw new Nyc311Error("days must be between 1 and 90");
    const start = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
    const where = filters(a.complaintType, a.borough, undefined, start, undefined);
    return format(await query({
        $select: "date_trunc_ymd(created_date) as day,count(*) as total",
        $group: "day",
        $order: "day DESC",
        $limit: "90",
        ...(where.length ? { $where: where.join(" AND ") } : {}),
    }));
}
