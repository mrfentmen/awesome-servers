const BASE = 'https://api.data.gov/ed/collegescorecard/v1/schools';
export async function search(args) {
    const q = (args.query ?? '').trim();
    if (!q)
        return 'Provide a college name.';
    const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
    const url = `${BASE}?school.name=${encodeURIComponent(q)}&page=0&per_page=${limit}&api_key=DEMO_KEY&fields=id,school.name,school.city,school.state,latest.student.size,latest.cost.attendance.academic_year,latest.aid.federal_loan_rate`;
    const res = await fetch(url, {
        headers: { 'User-Agent': 'mrfentmen-college-scorecard-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`College Scorecard returned ${res.status}`);
    const data = (await res.json());
    const results = data.results ?? [];
    if (!results.length)
        return `No colleges found for "${q}".`;
    return `Colleges matching "${q}" (${data.metadata?.total ?? results.length} total, ${results.length} shown):\n` +
        results
            .map((c, i) => {
            const g = (k) => String(c[k] ?? '');
            const parts = [
                g('school.name') || 'untitled',
                `${g('school.city')}, ${g('school.state')}`,
                g('latest.student.size') ? `${Number(g('latest.student.size')).toLocaleString()} students` : '',
                g('latest.cost.attendance.academic_year') ? `$${Number(g('latest.cost.attendance.academic_year')).toLocaleString()} cost` : '',
                g('latest.aid.federal_loan_rate') ? `${Math.round(Number(g('latest.aid.federal_loan_rate')) * 100)}% loans` : '',
            ];
            return `${i + 1}. ${parts.filter(Boolean).join(' | ')}`;
        })
            .join('\n');
}
const FIELDS = 'id,school.name,school.city,school.state,latest.student.size,latest.cost.attendance.academic_year';
async function query(params, limit) {
    const url = `${BASE}?page=0&per_page=${limit}&api_key=DEMO_KEY&fields=${FIELDS}&${new URLSearchParams(params).toString()}`;
    const res = await fetch(url, {
        headers: { 'User-Agent': 'mrfentmen-college-scorecard-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`College Scorecard returned ${res.status}`);
    const data = (await res.json());
    const results = data.results ?? [];
    if (!results.length)
        return 'No colleges found.';
    return `Colleges (${data.metadata?.total ?? results.length} total, ${results.length} shown):\n` +
        results.map((c, i) => {
            const g = (k) => String(c[k] ?? '');
            const size = g('latest.student.size');
            return `${i + 1}. ${g('school.name') || 'untitled'} | ${g('school.city')}, ${g('school.state')}${size ? ` | ${Number(size).toLocaleString()} students` : ''}`;
        }).join('\n');
}
export async function byState(args) {
    const st = (args.state ?? '').trim();
    if (!st)
        return 'Provide a 2-letter state code.';
    return query({ 'school.state': st.toUpperCase() }, Math.max(1, Math.min(args.limit ?? 10, 25)));
}
export async function byCity(args) {
    const city = (args.city ?? '').trim();
    if (!city)
        return 'Provide a city name.';
    return query({ 'school.city': city }, Math.max(1, Math.min(args.limit ?? 10, 25)));
}
export async function schoolDetails(args) {
    const id = (args.id ?? '').trim();
    if (!id)
        return 'Provide a school id.';
    const url = `${BASE}?id=${encodeURIComponent(id)}&api_key=DEMO_KEY&fields=id,school.name,school.city,school.state,school.school_url,latest.student.size,latest.cost.attendance.academic_year,latest.admissions.admission_rate.overall,latest.earnings.10_yrs_after_entry.median`;
    const res = await fetch(url, {
        headers: { 'User-Agent': 'mrfentmen-college-scorecard-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`College Scorecard returned ${res.status}`);
    const data = (await res.json());
    const c = (data.results ?? [])[0];
    if (!c)
        return `No college with id ${id}.`;
    const g = (k) => String(c[k] ?? '');
    const admRate = g('latest.admissions.admission_rate.overall');
    const earnMed = g('latest.earnings.10_yrs_after_entry.median');
    return [
        `${g('school.name') || 'untitled'} | ${g('school.city')}, ${g('school.state')}`,
        g('school.school_url'),
        `Admission rate: ${admRate ? `${Math.round(Number(admRate) * 100)}%` : 'n/a'}`,
        `Median earnings 10yrs after entry: ${earnMed ? `$${Number(earnMed).toLocaleString()}` : 'n/a'}`,
    ].filter(Boolean).join('\n');
}
export async function byOwnership(args) {
    const o = (args.ownership ?? '').trim();
    if (!o)
        return 'Provide ownership: 1 public, 2 private nonprofit, 3 private for-profit.';
    return query({ 'school.ownership': o }, Math.max(1, Math.min(args.limit ?? 10, 25)));
}
export async function topEarnings(args) {
    const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
    const st = (args.state ?? '').trim().toUpperCase();
    const params = { 'fields': `id,school.name,school.state,latest.earnings.10_yrs_after_entry.median` };
    if (st)
        params['school.state'] = st;
    const url = `${BASE}?page=0&per_page=${limit}&api_key=DEMO_KEY&sort=latest.earnings.10_yrs_after_entry.median:desc&${new URLSearchParams(params).toString()}`;
    const res = await fetch(url, {
        headers: { 'User-Agent': 'mrfentmen-college-scorecard-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`College Scorecard returned ${res.status}`);
    const data = (await res.json());
    const results = data.results ?? [];
    if (!results.length)
        return 'No colleges found.';
    return results.map((c, i) => {
        const med = String(c['latest.earnings.10_yrs_after_entry.median'] ?? '');
        return `${i + 1}. ${String(c['school.name'] ?? 'untitled')} | median 10yr earnings $${med ? Number(med).toLocaleString() : 'n/a'}`;
    }).join('\n');
}
