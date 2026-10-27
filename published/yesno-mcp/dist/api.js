const BASE = 'https://yesno.wtf/api';
export async function answer(_args = {}) {
    const res = await fetch(BASE, {
        headers: { 'User-Agent': 'mrfentmen-yesno-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(15000),
    });
    if (!res.ok)
        throw new Error(`yesno.wtf returned ${res.status}`);
    const data = (await res.json());
    if (!data.answer)
        throw new Error('yesno.wtf returned an empty answer');
    return `${data.answer} ${data.image ?? ''}`.trim();
}
// ---- gap4c4 tools:
export async function wikipediaPageExists(args) {
    const title = args.title.trim().slice(0, 200);
    if (!title)
        throw new Error('Provide a page title.');
    const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1&titles=${encodeURIComponent(title)}`, {
        headers: { Accept: 'application/json', 'User-Agent': 'mrfentmen-yesno-mcp/1.0' }, signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Wikipedia returned ${res.status}`);
    const d = await res.json();
    if (d.error)
        throw new Error(d.error.info ?? 'Wikipedia query failed');
    const pages = Object.values(d.query?.pages ?? {});
    if (!pages.length)
        throw new Error('Wikipedia did not report a page result.');
    return pages.slice(0, 5).map(p => p.pageid != null && p.missing === undefined && p.invalid === undefined
        ? `Yes - ${p.title ?? title} exists: https://en.wikipedia.org/?curid=${p.pageid}`
        : `No - Wikipedia reports no valid page for ${p.title ?? title}.`).join('\n');
}

export async function siteUp(args = {}) {
    let raw = String(args?.url ?? '').trim();
    if (!raw)
        throw new Error('Give a URL or hostname, like example.com.');
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw))
        raw = 'https://' + raw;
    let url;
    try {
        url = new URL(raw);
    }
    catch {
        throw new Error(`"${args?.url}" is not a URL or hostname`);
    }
    if (!/^https?:$/.test(url.protocol))
        throw new Error('Only http and https URLs can be checked.');
    const started = Date.now();
    try {
        const res = await fetch(url, {
            redirect: 'follow',
            headers: { 'User-Agent': 'mrfentmen-yesno-mcp/1.0' },
            signal: AbortSignal.timeout(20000),
        });
        const ms = Date.now() - started;
        return [
            `Yes — ${url.href} answered ${res.status} ${res.statusText} in ${ms} ms`,
            `Final URL: ${res.url || url.href}`,
        ].join('\n');
    }
    catch (e) {
        const ms = Date.now() - started;
        const reason = e?.name === 'TimeoutError' ? 'timed out after 20 s' : (e?.message ?? String(e));
        return `No — ${url.href} did not answer (${reason}) after ${ms} ms`;
    }
}

export async function domainTaken(args = {}) {
    const domain = String(args?.domain ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domain))
        throw new Error('Give a bare domain, like example.com.');
    const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
        headers: { 'User-Agent': 'mrfentmen-yesno-mcp/1.0', Accept: 'application/rdap+json, application/json' },
        redirect: 'follow',
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 404)
        return `No — ${domain} has no RDAP registration record, so it looks unregistered. Check with a registrar before relying on it.`;
    if (!res.ok)
        throw new Error(`RDAP returned ${res.status} for ${domain}`);
    if (!(res.headers.get('content-type') ?? '').includes('json'))
        throw new Error('The RDAP service answered with a page instead of a record; try again shortly.');
    const d = (await res.json());
    const events = (d.events ?? []).map((e) => `${e.eventAction}: ${String(e.eventDate ?? '').slice(0, 10)}`);
    const registrar = (d.entities ?? [])
        .filter((e) => (e.roles ?? []).includes('registrar'))
        .map((e) => (e.vcardArray?.[1] ?? []).find((row) => row[0] === 'fn')?.[3] ?? e.handle)
        .filter(Boolean);
    return [
        `Yes — ${domain} is registered (${d.handle ?? 'no handle'})`,
        registrar.length ? `Registrar: ${registrar.join(', ')}` : 'Registrar: not stated',
        events.length ? `Events: ${events.slice(0, 6).join(' · ')}` : '',
        `Status: ${(d.status ?? []).join(', ') || 'not stated'}`,
        `Nameservers: ${(d.nameservers ?? []).map((n) => n.ldhName).filter(Boolean).join(', ') || 'none listed'}`,
    ].filter(Boolean).join('\n');
}

export async function personAlive(args = {}) {
    const name = String(args?.name ?? '').trim();
    if (name.length < 2)
        throw new Error('Give a person name, like Ada Lovelace.');
    const ua = { 'User-Agent': 'mrfentmen-yesno-mcp/1.0', Accept: 'application/json' };
    const search = await fetch(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(name)}&language=en&format=json&limit=1&type=item`, { headers: ua, signal: AbortSignal.timeout(20000) });
    if (!search.ok)
        throw new Error(`Wikidata search returned ${search.status}`);
    const found = (await search.json()).search?.[0];
    if (!found)
        throw new Error(`Wikidata has no person called "${name}"`);
    const ent = await fetch(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${found.id}&props=claims|labels&languages=en&format=json`, { headers: ua, signal: AbortSignal.timeout(20000) });
    if (!ent.ok)
        throw new Error(`Wikidata entity lookup returned ${ent.status}`);
    const entity = (await ent.json()).entities?.[found.id] ?? {};
    const claimTime = (prop) => {
        const snak = entity.claims?.[prop]?.[0]?.mainsnak?.datavalue?.value?.time;
        if (!snak)
            return null;
        const m = /^[+-](\d{4,})-/.exec(snak);
        return m ? m[1] : snak;
    };
    const birth = claimTime('P569');
    const death = claimTime('P570');
    const label = entity.labels?.en?.value ?? found.label ?? name;
    return [
        death
            ? `No — ${label} (${found.id}) died in ${death}.`
            : `Yes — Wikidata records no death date for ${label} (${found.id}).`,
        birth ? `Born: ${birth}` : 'Born: not recorded',
        death ? `Died: ${death}` : 'Died: not recorded',
        `https://www.wikidata.org/wiki/${found.id}`,
    ].join('\n');
}

export async function domainMail(args = {}) {
    const domain = String(args?.domain ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domain))
        throw new Error('Give a bare domain, like example.com.');
    const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`, {
        headers: { 'User-Agent': 'mrfentmen-yesno-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`DNS-over-HTTPS returned ${res.status}`);
    const d = (await res.json());
    if (d.Status !== 0)
        throw new Error(`DNS lookup failed for ${domain} (status ${d.Status})`);
    const answers = (d.Answer ?? []).filter((a) => a.type === 15);
    if (!answers.length)
        return `No — ${domain} publishes no MX record, so it cannot receive mail at that domain.`;
    const nullMx = answers.some((a) => String(a.data).trim() === '0 .');
    if (nullMx)
        return `No — ${domain} publishes a null MX record, which explicitly says it accepts no mail.`;
    return [
        `Yes — ${domain} publishes ${answers.length} MX record(s):`,
        ...answers.map((a) => `- ${a.data}`),
        'This only checks DNS; it does not test delivery.',
    ].join('\n');
}
