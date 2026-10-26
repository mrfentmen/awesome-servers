const BASE = 'https://www.disify.com/api';
const UA = 'mrfentmen-disify-mcp/1.0';
async function lookup(path) {
    const res = await fetch(`${BASE}/${path}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Disify returned ${res.status}`);
    return (await res.json());
}
const yesNo = (value) => value === true ? 'yes' : value === false ? 'no' : 'unknown';
export async function check(args) {
    const email = (args.email ?? '').trim().toLowerCase();
    if (!email || !email.includes('@'))
        return 'Provide a valid email address.';
    const d = await lookup(`email/${encodeURIComponent(email)}`);
    const s = (k) => (d[k] != null ? String(d[k]) : '');
    return [
        `Email: ${email}`,
        `Format valid: ${s('format')}`,
        `Disposable: ${s('disposable')}`,
        `DNS records: ${s('dns')}`,
        d.disposable === true ? 'Warning: this is a disposable email address.' : '',
    ].filter(Boolean).join('\n');
}
export async function checkDomain(args) {
    const domain = (args.domain ?? '').trim().toLowerCase();
    if (!domain || !domain.includes('.'))
        return 'Provide a domain like example.com.';
    const d = await lookup(`domain/${encodeURIComponent(domain)}`);
    return [
        `Domain: ${domain}`,
        `Disposable: ${yesNo(d.disposable)}`,
        `Free provider: ${yesNo(d.free)}`,
        `Has DNS records: ${yesNo(d.dns)}`,
        `Whitelisted: ${yesNo(d.whitelist)}`,
        `TLD: ${d.domain_info?.tld ?? 'unknown'}`,
        d.mx_info?.length ? `MX hosts: ${d.mx_info.length}` : '',
        d.disposable === true ? 'Warning: this is a disposable email domain.' : '',
    ].filter(Boolean).join('\n');
}
export async function checkBulk(args) {
    const emails = (args.emails ?? [])
        .map((value) => String(value).trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 10);
    if (!emails.length)
        return 'Provide up to 10 email addresses to check.';
    const rows = [];
    let disposable = 0;
    for (const email of emails) {
        if (!email.includes('@')) {
            rows.push(`${email} - invalid, no @ symbol`);
            continue;
        }
        const d = await lookup(`email/${encodeURIComponent(email)}`);
        if (d.disposable === true)
            disposable += 1;
        rows.push(`${email} - format: ${yesNo(d.format)} | disposable: ${yesNo(d.disposable)} | dns: ${yesNo(d.dns)} | role: ${yesNo(d.role)}`);
    }
    return `Checked ${emails.length} address(es), ${disposable} disposable:\n` + rows.join('\n');
}
export async function mxRecords(args) {
    const domain = (args.domain ?? '').trim().toLowerCase();
    if (!domain || !domain.includes('.'))
        return 'Provide a domain like example.com.';
    const d = await lookup(`domain/${encodeURIComponent(domain)}`);
    const hosts = d.mx_info ?? [];
    if (!hosts.length)
        return `Disify returned no MX hosts for ${domain}.`;
    return `MX hosts for ${domain} (${hosts.length}):\n` +
        hosts.map((host, i) => `${i + 1}. ${host}`).join('\n');
}
// DNS is resolved through Cloudflare's public DNS-over-HTTPS endpoint, which needs
// no account, so the server can answer DNS questions without any credential.
const DOH = 'https://cloudflare-dns.com/dns-query';
const RECORD_TYPES = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA', 'CAA', 'PTR', 'SRV'];
/** RFC 1035 record numbers that the DoH JSON response reports. */
const TYPE_NAMES = {
    1: 'A', 2: 'NS', 5: 'CNAME', 6: 'SOA', 12: 'PTR', 15: 'MX', 16: 'TXT',
    28: 'AAAA', 33: 'SRV', 257: 'CAA',
};
const RCODE = {
    0: 'NOERROR',
    1: 'FORMERR',
    2: 'SERVFAIL',
    3: 'NXDOMAIN',
    5: 'REFUSED',
};
async function dnsQuery(domain, type) {
    const url = `${DOH}?name=${encodeURIComponent(domain)}&type=${encodeURIComponent(type)}`;
    const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'application/dns-json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`DNS-over-HTTPS returned ${res.status}`);
    return (await res.json());
}
const answerLines = (d) => (d.Answer ?? []).map((row) => {
    const kind = TYPE_NAMES[row.type ?? 0] ?? `TYPE${row.type ?? '?'}`;
    const ttl = row.TTL != null ? ` (TTL ${row.TTL})` : '';
    return `${kind}: ${String(row.data ?? '').trim()}${ttl}`;
});
export async function dnsLookup(args) {
    const domain = (args.domain ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!domain || !domain.includes('.'))
        return 'Provide a domain like example.com.';
    const requested = (args.type ?? 'A').trim().toUpperCase();
    if (!RECORD_TYPES.includes(requested)) {
        return `Unsupported record type "${requested}". Use one of: ${RECORD_TYPES.join(', ')}.`;
    }
    const data = await dnsQuery(domain, requested);
    const code = data.Status ?? 0;
    const lines = answerLines(data);
    if (!lines.length) {
        return `${domain} has no ${requested} records (DNS status ${RCODE[code] ?? code}).`;
    }
    return `${requested} records for ${domain} (DNS status ${RCODE[code] ?? code}, ${lines.length} answer(s)):\n` +
        lines.map((line, i) => `${i + 1}. ${line}`).join('\n');
}
/** One call that combines the Disify domain verdict with live DNS resolution. */
export async function domainSummary(args) {
    const domain = (args.domain ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!domain || !domain.includes('.'))
        return 'Provide a domain like example.com.';
    const d = await lookup(`domain/${encodeURIComponent(domain)}`);
    const wanted = ['A', 'NS', 'MX'];
    const results = await Promise.allSettled(wanted.map((type) => dnsQuery(domain, type)));
    const dns = [];
    results.forEach((result, i) => {
        const type = wanted[i];
        if (result.status === 'fulfilled') {
            const lines = answerLines(result.value);
            // Each answer line already carries its record type, so do not repeat it.
            dns.push(lines.length ? lines.join(' | ') : `${type}: none (DNS status ${RCODE[result.value.Status ?? 0] ?? result.value.Status})`);
        }
        else {
            dns.push(`${type}: lookup failed (${result.reason instanceof Error ? result.reason.message : String(result.reason)})`);
        }
    });
    const verdict = d.disposable === true
        ? 'DISPOSABLE — do not accept for signup'
        : d.dns === false
            ? 'No DNS records, so mail will not deliver'
            : 'Not disposable';
    return [
        `Domain summary for ${domain}`,
        `Verdict: ${verdict}`,
        `Disposable: ${yesNo(d.disposable)} | Free provider: ${yesNo(d.free)} | Whitelisted: ${yesNo(d.whitelist)} | Has DNS: ${yesNo(d.dns)}`,
        `TLD: ${d.domain_info?.tld ?? 'unknown'}${d.domain_info?.is_subdomain ? ` | subdomain of ${d.domain_info.parent_domain ?? '?'}` : ''}`,
        `Role address domain hints: ${d.role == null ? 'unknown' : yesNo(d.role)}`,
        '',
        `Live DNS (Cloudflare):`,
        ...dns.map((line) => `  ${line}`),
        d.mx_info?.length ? `  Disify MX hosts: ${d.mx_info.join(', ')}` : '',
        '',
        'Sources: disify.com for the disposable verdict, Cloudflare DNS-over-HTTPS for the records.',
    ]
        .filter((line) => line !== '' || true)
        .join('\n');
}
const cleanDomain = (value) => String(value ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
async function dnsQuerySecure(domain, type) {
    const url = `${DOH}?name=${encodeURIComponent(domain)}&type=${encodeURIComponent(type)}&do=true`;
    const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'application/dns-json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`DNS-over-HTTPS returned ${res.status}`);
    return (await res.json());
}
/** RFC 8624 signing algorithms, by their assigned number. */
const DNSSEC_ALGORITHMS = {
    5: 'RSASHA1',
    7: 'RSASHA1-NSEC3',
    8: 'RSASHA256',
    10: 'RSASHA512',
    13: 'ECDSAP256SHA256',
    14: 'ECDSAP384SHA384',
    15: 'ED25519',
    16: 'ED448',
};
/** DNSSEC posture for a zone: the resolver's validated (AD) flag, DNSKEY and DS. */
export async function dnssecCheck(args) {
    const domain = cleanDomain(args?.domain);
    if (!domain || !domain.includes('.'))
        return 'Provide a domain like example.com.';
    const [keyResult, dsResult] = await Promise.allSettled([
        dnsQuerySecure(domain, 'DNSKEY'),
        dnsQuerySecure(domain, 'DS'),
    ]);
    if (keyResult.status === 'rejected' && dsResult.status === 'rejected') {
        const reason = keyResult.reason instanceof Error ? keyResult.reason.message : String(keyResult.reason);
        throw new Error(`Could not read DNSSEC records for ${domain}: ${reason}`);
    }
    const keyRows = keyResult.status === 'fulfilled' ? keyResult.value.Answer ?? [] : [];
    const dsRows = dsResult.status === 'fulfilled' ? dsResult.value.Answer ?? [] : [];
    const dnskey = keyRows.filter((row) => row.type === 48);
    const rrsig = keyRows.filter((row) => row.type === 46);
    const ds = dsRows.filter((row) => row.type === 43);
    const ad = keyResult.status === 'fulfilled' && keyResult.value.AD === true;
    const status = keyResult.status === 'fulfilled' ? RCODE[keyResult.value.Status ?? 0] ?? String(keyResult.value.Status) : 'lookup failed';
    const algorithms = [
        ...new Set(dnskey
            .map((row) => {
            const match = /^\d+\s+\d+\s+(\d+)/.exec(String(row.data ?? ''));
            if (!match)
                return null;
            const number = Number(match[1]);
            return DNSSEC_ALGORITHMS[number] ?? `algorithm ${number}`;
        })
            .filter((value) => value != null)),
    ];
    const flags = dnskey.map((row) => {
        const match = /^(\d+)/.exec(String(row.data ?? ''));
        const value = match ? Number(match[1]) : 0;
        return value === 257 ? 'KSK' : value === 256 ? 'ZSK' : `flags ${value}`;
    });
    const verdict = ad
        ? 'Signed and validated — the resolver confirmed the DNSSEC signatures.'
        : dnskey.length
            ? 'Signed but NOT validated — the zone publishes DNSKEY records, yet the resolver did not set the AD flag. Check the parent DS record.'
            : 'Not signed — no DNSKEY at the zone apex, so DNS answers cannot be authenticated.';
    const lines = [
        `DNSSEC for ${domain} (zone apex):`,
        `Verdict: ${verdict}`,
        `Validated (AD flag): ${ad ? 'yes' : 'no'} | DNS status: ${status}`,
        `DNSKEY records: ${dnskey.length}${flags.length ? ` (${flags.join(', ')})` : ''}`,
        `Algorithms: ${algorithms.join(', ') || 'none published'}`,
        `Parent DS records: ${ds.length ? ds.map((row) => String(row.data ?? '').split(' ').slice(0, 3).join(' ')).join(' | ') : 'none visible from this resolver'}`,
        `RRSIG signatures in the answer: ${rrsig.length}`,
        '',
        ad
            ? 'Queries for this zone can be authenticated, which is what mail receivers and browsers prefer.'
            : 'Unsigned or unvalidated zones still resolve normally; the answers just cannot be proven authentic.',
    ];
    return lines.join('\n');
}
const txtValues = (rows) => rows
    .filter((row) => row.type === 16)
    .map((row) => String(row.data ?? '').replace(/^"|"$/g, '').replace(/\\"/g, '"'));
/** Selectors worth trying when a domain does not document its DKIM setup. */
const DKIM_SELECTORS = ['default', 'google', 'selector1', 'selector2', 'k1', 's1', 's2', 'mail', 'dkim', 'smtp'];
/** SPF, DMARC, DKIM and MX for a domain: whether its mail can be authenticated. */
export async function emailAuth(args) {
    const domain = cleanDomain(args?.domain);
    if (!domain || !domain.includes('.'))
        return 'Provide a domain like example.com.';
    const lookups = await Promise.allSettled([
        dnsQuery(domain, 'TXT'),
        dnsQuery(`_dmarc.${domain}`, 'TXT'),
        dnsQuery(domain, 'MX'),
        ...DKIM_SELECTORS.map((selector) => dnsQuery(`${selector}._domainkey.${domain}`, 'TXT')),
    ]);
    const settled = (result, fallback) => result.status === 'fulfilled' ? result.value : fallback;
    const rootTxt = txtValues(settled(lookups[0], { Answer: [] }).Answer ?? []);
    const dmarcTxt = txtValues(settled(lookups[1], { Answer: [] }).Answer ?? []);
    const mxRows = settled(lookups[2], { Answer: [] }).Answer ?? [];
    const spf = rootTxt.find((value) => value.toLowerCase().startsWith('v=spf1'));
    const dmarc = dmarcTxt.find((value) => value.toLowerCase().startsWith('v=dmarc1'));
    const dkim = [];
    DKIM_SELECTORS.forEach((selector, index) => {
        const result = lookups[3 + index];
        if (!result || result.status !== 'fulfilled')
            return;
        const value = txtValues(result.value.Answer ?? []).find((entry) => entry.toLowerCase().includes('v=dkim1') || entry.toLowerCase().includes('p='));
        if (value)
            dkim.push({ selector, value });
    });
    const allQualifier = spf ? /([-~?+])all\b/.exec(spf)?.[1] : undefined;
    const spfPolicy = allQualifier === '-'
        ? 'strict: only the listed senders may send'
        : allQualifier === '~'
            ? 'soft fail: other senders are marked but still delivered'
            : allQualifier === '?'
                ? 'neutral: SPF claims nothing about other senders'
                : allQualifier === '+'
                    ? 'permissive: every sender passes (+all)'
                    : 'no all-qualifier, so unauthorised senders are not rejected';
    const dmarcPolicy = dmarc ? /(?:^|;)\s*p\s*=\s*([a-z]+)/i.exec(dmarc)?.[1]?.toLowerCase() : undefined;
    const rua = dmarc ? /(?:^|;)\s*rua\s*=\s*([^;]+)/i.exec(dmarc)?.[1]?.trim() : undefined;
    const mxHosts = mxRows.filter((row) => row.type === 15).map((row) => String(row.data ?? ''));
    const verdict = spf && dmarc
        ? `SPF and DMARC are published${dmarcPolicy ? ` (p=${dmarcPolicy})` : ''}; spoofed mail can be filtered.`
        : !spf && !dmarc
            ? 'No SPF and no DMARC record, so anyone can spoof this domain in mail.'
            : spf
                ? 'SPF is published but DMARC is missing, so receivers have no instruction for failing mail.'
                : 'DMARC is published but SPF is missing, which weakens the policy it asks receivers to enforce.';
    return [
        `Mail authentication for ${domain}:`,
        `Verdict: ${verdict}`,
        `SPF: ${spf ? spf : 'not published'}${spf ? `\n  Policy: ${spfPolicy}` : ''}`,
        `DMARC: ${dmarc ? dmarc : 'not published'}` +
            (dmarc ? `\n  Enforcement: ${dmarcPolicy ?? 'none stated'}${rua ? ` | reports to ${rua}` : ''}` : ''),
        `DKIM: ${dkim.length ? dkim.map((entry) => entry.selector).join(', ') : `no key found at the ${DKIM_SELECTORS.length} common selectors`}` +
            (dkim.length ? `\n  First key: ${dkim[0].value.slice(0, 120)}${dkim[0].value.length > 120 ? '…' : ''}` : ''),
        `MX hosts: ${mxHosts.length ? mxHosts.join(' | ') : 'none — the domain cannot receive mail'}`,
        '',
        `Checked through Cloudflare DNS-over-HTTPS. DKIM selectors tried: ${DKIM_SELECTORS.join(', ')}.`,
    ].join('\n');
}
/** Keyboard-neighbour and homoglyph swaps used to spot lookalike domains. */
const HOMOGLYPHS = {
    a: ['4'],
    b: ['6'],
    e: ['3'],
    g: ['9'],
    i: ['1'],
    l: ['1'],
    m: ['rn'],
    n: ['m'],
    o: ['0'],
    s: ['5'],
    t: ['7'],
    u: ['v'],
    v: ['u'],
};
const LOOKALIKE_TLDS = ['com', 'net', 'org', 'co', 'io'];
/** Mix of typos, homoglyphs and common TLD swaps for one domain. */
function lookalikeCandidates(domain) {
    const [bare, ...rest] = domain.split('.');
    const tld = rest.join('.') || 'com';
    const chars = bare.split('');
    const names = new Set();
    for (let i = 0; i < chars.length; i += 1) {
        if (i + 1 < chars.length && chars[i] !== chars[i + 1]) {
            const swapped = [...chars];
            const left = swapped[i];
            swapped[i] = swapped[i + 1];
            swapped[i + 1] = left;
            names.add(swapped.join(''));
        }
        names.add(chars.slice(0, i + 1).join('') + chars[i] + chars.slice(i + 1).join(''));
        if (chars.length > 3) {
            names.add(chars.slice(0, i).join('') + chars.slice(i + 1).join(''));
        }
        for (const swap of HOMOGLYPHS[chars[i]] ?? []) {
            names.add(chars.slice(0, i).join('') + swap + chars.slice(i + 1).join(''));
        }
    }
    const candidates = [...names]
        .filter((name) => name && name !== bare)
        .slice(0, 18)
        .map((name) => `${name}.${tld}`);
    for (const alternative of LOOKALIKE_TLDS) {
        if (alternative !== tld)
            candidates.push(`${bare}.${alternative}`);
    }
    return [...new Set(candidates)];
}
/** Resolves typo and homoglyph variants of a domain to find live lookalikes. */
export async function lookalikeDomains(args) {
    const domain = cleanDomain(args?.domain);
    if (!domain || !domain.includes('.'))
        return 'Provide a domain like example.com.';
    const limit = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 25);
    const candidates = lookalikeCandidates(domain);
    const live = [];
    // Small batches keep the whole check inside one tool-call budget.
    for (let i = 0; i < candidates.length; i += 6) {
        const batch = candidates.slice(i, i + 6);
        const settled = await Promise.allSettled(batch.map((host) => dnsQuery(host, 'A')));
        settled.forEach((result, index) => {
            if (result.status !== 'fulfilled')
                return;
            const addresses = (result.value.Answer ?? [])
                .filter((row) => row.type === 1)
                .map((row) => String(row.data ?? ''));
            if (addresses.length)
                live.push({ host: batch[index], addresses });
        });
    }
    const header = `Lookalike check for ${domain}: ${candidates.length} variant(s) checked, ${live.length} live.`;
    if (!live.length) {
        return `${header}\nNone of the tested typos, homoglyphs or alternative TLDs currently resolve.\n` +
            'This is a spot check of a fixed variant list, not an exhaustive brand watch.';
    }
    return `${header}\nLive lookalike domains (${Math.min(limit, live.length)} of ${live.length} shown):\n` +
        live.slice(0, limit).map((entry, i) => `${i + 1}. ${entry.host} -> ${entry.addresses.join(', ')}\n   resolves, so the name is registered and answering`).join('\n') +
        `\n\nWorth checking which of these you own or monitor. Some may be parked or defensive registrations.`;
}
// ---- muxD tools:
/* ------------------------------------------------------------------ *
 * 1. Registration data over RDAP, which is a different data source
 *    from the Disify checks and DNS lookups this file already does.
 * ------------------------------------------------------------------ */
const RDAP_BOOTSTRAP = 'https://rdap.org/domain/';
/** Pull a human name out of an RDAP vCard, which is how the registrar is labelled. */
function rdapName(entity) {
    const card = entity?.vcardArray;
    if (Array.isArray(card) && Array.isArray(card[1])) {
        for (const entry of card[1]) {
            if (entry[0] === 'fn' && entry[3])
                return String(entry[3]);
        }
    }
    return '';
}
/* ------------------------------------------------------------------ *
 * 2. Typosquatting and homoglyph detection on a concrete address.
 * ------------------------------------------------------------------ */
// Characters people and scripts confuse constantly, mapped to what the
// reader probably meant.
const CONFUSABLES = {
    '0': 'o', '1': 'l', '3': 'e', '5': 's', '7': 't', '8': 'b', '4': 'a', '6': 'g',
    'vv': 'w', 'rn': 'm', 'cl': 'd', 'ii': 'n', 'l': 'i',
};
// Free mail providers whose addresses are worth impersonating, so a one-character
// deviation from one of these is worth reporting.
const TARGET_BRANDS = [
    'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'hotmail.com', 'outlook.com',
    'live.com', 'msn.com', 'aol.com', 'icloud.com', 'me.com', 'mac.com', 'protonmail.com', 'proton.me',
    'gmx.com', 'gmx.de', 'mail.com', 'yandex.ru', 'zoho.com', 'fastmail.com', 'hey.com', 'tutanota.com',
];
const LEET_UNMAP = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b', '@': 'a', '$': 's', '!': 'i', '|': 'i' };
/** How many single-character edits apart two strings are, with early exit. */
function editDistance(a, b, cap = 3) {
    if (Math.abs(a.length - b.length) > cap)
        return cap + 1;
    const prev = new Array(b.length + 1);
    for (let j = 0; j <= b.length; j += 1)
        prev[j] = j;
    for (let i = 1; i <= a.length; i += 1) {
        let last = prev[0];
        prev[0] = i;
        for (let j = 1; j <= b.length; j += 1) {
            const tmp = prev[j];
            prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, last + (a[i - 1] === b[j - 1] ? 0 : 1));
            last = tmp;
        }
    }
    return prev[b.length];
}
const MX_PROVIDERS = [
    { match: /(^|\.)google(mail)?\.com$|(^|\.)aspmx\./, name: 'Google Workspace / Gmail', note: 'Google applies its own spam filtering and requires SPF and DKIM to align for bulk senders. Expect excellent inbox placement if configured correctly.' },
    { match: /protection\.outlook\.com$|(^|\.)mail\.protection\.outlook\.com$|(^|\.)outlook\.com$/, name: 'Microsoft 365', note: 'Microsoft enforces its own high-volume sender requirements on the tenant sending domain. A domain that has never sent will be quarantined or rejected regardless of your SPF record.' },
    { match: /(^|\.)yahoo\.com$|yimg\.com$|(^|\.)yahoodns\.net$/, name: 'Yahoo', note: 'Yahoo runs one of the stricter complaint thresholds, and a domain with a poor complaint rate can be blocked outright with no appeal.' },
    { match: /(^|\.)icloud\.com$|(^|\.)apple\.com$/, name: 'iCloud Mail', note: 'Apple relays through its own infrastructure; several SPF records can cause permission errors, so keep the include list to one entry.' },
    { match: /protonmail\.ch$|(^|\.)proton\.mail$|(^|\.)protonmail\.com$/, name: 'Proton Mail', note: 'Proton refuses mail from any server it cannot authenticate, so DKIM and a matching DMARC policy are effectively mandatory.' },
    { match: /fastmail\.com$|messagingengine\.com$/, name: 'Fastmail', note: 'Requires SPF and DKIM; messages that fail authentication are rejected rather than junked.' },
    { match: /amazonses\.com$|email\.amazonaws\.com$/, name: 'Amazon SES', note: 'SES authenticates with its own MAIL FROM domain, so the SPF record must include ses.amazonses.com and the bounce domain must match. Bulk complaints against a SES account affect the account, not just the domain.' },
    { match: /sendgrid\.net$|(^|\.)sendgrid\.com$/, name: 'Twilio SendGrid', note: 'SendGrid requires a dedicated subdomain with SPF and DKIM on it. Using the same subdomain for the corporate mail and for campaigns is a common cause of authentication conflicts.' },
    { match: /mailgun\.org$|(^|\.)mailgun\.org$/, name: 'Mailgun', note: 'Same pattern as SES: a separate sending subdomain with its own SPF and DKIM records.' },
    { match: /(^|\.)zoho\.com$|(^|\.)zohomail\.com$/, name: 'Zoho Mail', note: 'Zoho is strict about a single SPF record. Merge all sending services into one SPF TXT record, since a second record causes a permanent error.' },
    { match: /tutanota\.com$|(^|\.)tuta\.io$/, name: 'Tuta', note: 'Requires authentication and does not accept unauthenticated mail.' },
    { match: /mimecast|proofpoint|barracuda|microsoft\.com$|(^|\.)barracudanetworks\./, name: 'Enterprise gateway or filter', note: 'An inbound gateway in front of a mailbox. Delivery problems here are usually the gateway, not the mailbox provider.' },
];
/** Which mail provider actually receives mail for a domain, and what that provider demands before it will accept anything. */
export async function mxProviderProfile(args) {
    const domain = (args.domain ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!domain || !domain.includes('.'))
        return 'Provide a domain like example.com.';
    const res = await fetch(`${DOH}?name=${encodeURIComponent(domain)}&type=MX`, {
        headers: { 'User-Agent': UA, Accept: 'application/dns-json' },
        signal: AbortSignal.timeout(15000),
    });
    if (!res.ok)
        throw new Error(`DNS-over-HTTPS returned ${res.status}.`);
    const body = (await res.json());
    const answers = body.Answer ?? [];
    const rows = answers
        .filter((a) => a.type === 15)
        .map((a) => {
        const parts = String(a.data ?? '').trim().split(/\s+/);
        return { priority: Number(parts[0]), hostname: (parts[1] ?? '').replace(/\.$/, '') };
    })
        .filter((m) => m.hostname);
    if (!rows.length) {
        if (body.Status === 3)
            return `${domain} does not exist in DNS, so there is nothing to check.`;
        return [
            `${domain} publishes no MX records, so no mail server is willing to receive email for it.`,
            '',
            'If this domain is not meant to receive mail, publish a null MX of "0 ." to stop senders wasting retries on it. If it is meant to receive mail, the domain is effectively undeliverable until an MX record exists.',
        ].join('\n');
    }
    rows.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
    const nullMx = rows.some((r) => r.priority === 0 && r.hostname === '.');
    if (nullMx)
        return `${domain} publishes a null MX (0 .), which explicitly forbids delivery. Any mail sent to it will bounce.`;
    const matched = new Set();
    const findings = [];
    const host = (r) => r.hostname ?? '';
    for (const r of rows) {
        for (const p of MX_PROVIDERS) {
            if (!p.match.test(host(r)) || matched.has(p.name))
                continue;
            matched.add(p.name);
            findings.push(`  ${p.name} (via ${host(r)}, priority ${r.priority})`);
            findings.push(`    ${p.note}`);
        }
    }
    const unmatched = rows.filter((r) => !MX_PROVIDERS.some((p) => p.match.test(host(r))));
    const lines = [
        `Mail provider profile for ${domain}: ${rows.length} MX record(s)`,
        "",
        `  ${rows.map((r) => `${r.priority} ${r.hostname}`).join("\n  ")}`,
        "",
    ];
    if (findings.length) {
        lines.push("Recognised providers:", ...findings);
    }
    else {
        lines.push("No MX host matched the providers this tool knows about, so the mail is handled by a host outside the common set.");
    }
    if (unmatched.length) {
        lines.push("", `Unmatched MX host(s): ${unmatched.map((r) => r.hostname).join(", ")}. If this is your own domain, the provider is either self-hosted or one this list does not cover, which is worth knowing before you check SPF and DKIM against an assumed vendor.`);
    }
    lines.push("", "The provider decides what your sending setup has to satisfy. Cross-check this with email_auth, which reads the SPF, DKIM and DMARC records that have to match what the provider expects.");
    return lines.join('\n');
}
/** When a domain was registered, read from the registry's own RDAP record. */
export async function domainRegistration(args) {
    const domain = cleanDomain(args?.domain);
    if (!domain || !domain.includes('.'))
        return 'Provide a domain like example.com.';
    const res = await fetch(RDAP_BOOTSTRAP + encodeURIComponent(domain), {
        headers: { 'User-Agent': UA, Accept: 'application/rdap+json' },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 404) {
        return `${domain} has no RDAP record. Either the name is not registered, or its registry does not publish RDAP data (a few country-code registries do not).`;
    }
    if (!res.ok)
        throw new Error(`RDAP returned HTTP ${res.status} for ${domain}`);
    const body = (await res.json());
    const events = Array.isArray(body.events) ? body.events : [];
    const at = (action) => {
        const hit = events.find((e) => String(e?.eventAction ?? '').toLowerCase() === action);
        const raw = hit?.eventDate;
        if (!raw)
            return null;
        const when = new Date(String(raw));
        return Number.isNaN(when.getTime()) ? null : when;
    };
    const day = (d) => (d ? d.toISOString().slice(0, 10) : 'not published');
    const registered = at('registration');
    const expires = at('expiration');
    const changed = at('last changed') ?? at('last update of rdap database');
    const ageDays = registered ? Math.floor((Date.now() - registered.getTime()) / 86400000) : null;
    const entities = Array.isArray(body.entities) ? body.entities : [];
    const byRole = (role) => entities
        .filter((e) => Array.isArray(e?.roles) && e.roles.map((r) => String(r).toLowerCase()).includes(role))
        .map((e) => rdapName(e))
        .filter(Boolean);
    const registrar = byRole('registrar');
    const status = (Array.isArray(body.status) ? body.status : []).map((s) => String(s));
    const servers = (Array.isArray(body.nameservers) ? body.nameservers : [])
        .map((n) => String(n?.ldhName ?? '').toUpperCase())
        .filter(Boolean);
    const signed = body.secureDNS?.delegationSigned === true;
    const verdict = ageDays === null
        ? 'Registration date not published by this registry, so age cannot be judged here.'
        : ageDays < 30
            ? `Registered ${ageDays} day(s) ago — a brand-new domain. New domains are the single strongest signal of throwaway and phishing infrastructure.`
            : ageDays < 365
                ? `Registered ${Math.floor(ageDays / 30)} month(s) ago — still young enough to be worth a second look before trusting mail from it.`
                : `Registered ${(ageDays / 365).toFixed(1)} year(s) ago — old enough that throwaway use is unlikely.`;
    return [
        `Registration record for ${String(body.ldhName ?? domain).toLowerCase()}:`,
        `Verdict: ${verdict}`,
        `Registered: ${day(registered)}${ageDays !== null ? ` (${ageDays} day(s) ago)` : ''}`,
        `Expires: ${day(expires)}`,
        `Last changed: ${day(changed)}`,
        `Registrar: ${registrar.length ? registrar.join(', ') : 'not published'}`,
        `Status: ${status.length ? status.join(', ') : 'none published'}`,
        `Nameservers: ${servers.length ? servers.join(', ') : 'none published'}`,
        `DNSSEC delegation signed: ${signed ? 'yes' : 'no'}`,
        '',
        'Source: the registry RDAP record via rdap.org. Registrant details are redacted for most TLDs, so only the dates, registrar and status are reliable.',
    ].join('\n');
}
/** Characters that look like other characters, for spotting a fake provider domain. */
const DOMAIN_HOMOGLYPHS = [['0', 'o'], ['1', 'l'], ['3', 'e'], ['5', 's'], ['7', 't'], ['9', 'g'], ['vv', 'w'], ['rn', 'm'], ['cl', 'd']];
function foldDomain(value) {
    let out = value;
    for (const [from, to] of DOMAIN_HOMOGLYPHS)
        out = out.split(from).join(to);
    return out.replace(/[^a-z0-9.-]/g, '');
}
/** Whether one address looks like an impersonation of a real provider or a named brand. */
export async function typoCheck(args) {
    const raw = String(args?.email ?? '').trim().toLowerCase();
    const at = raw.lastIndexOf('@');
    if (at <= 0 || at === raw.length - 1)
        return 'Provide an email address like support@gmial.com.';
    const local = raw.slice(0, at);
    const domain = raw.slice(at + 1);
    if (!domain.includes('.'))
        return `"${domain}" is not a domain name.`;
    const brandArg = String(args?.brand ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const brands = [...new Set([...TARGET_BRANDS, ...(brandArg ? [brandArg] : [])])];
    const exact = brands.includes(domain);
    const ranked = brands
        .map((brand) => ({ brand, distance: editDistance(domain, brand) }))
        .sort((a, b) => a.distance - b.distance);
    const nearest = ranked[0];
    const folded = foldDomain(domain);
    const foldedHit = brands.find((brand) => brand !== domain && foldDomain(brand) === folded) ?? null;
    const localSignals = [];
    if (/\b(19|20)\d{2}$/.test(local))
        localSignals.push(`ends in a year ("${local.slice(-4)}"), the shape of throwaway signup accounts`);
    if (/[a-z]{2,}\d{2,}$/.test(local))
        localSignals.push('a word followed by digits, which is how credential-stuffing lists name the second account on a mailbox');
    if (/(.)\1{2,}/.test(local))
        localSignals.push('three or more repeated characters');
    const leetLocal = local.replace(/[0134578@$!|]/g, (ch) => LEET_UNMAP[ch] ?? ch);
    if (leetLocal !== local && /[a-z]/.test(leetLocal))
        localSignals.push(`leetspeak substitutions (reads as "${leetLocal}")`);
    if (/^[a-z]{1,2}\d{4,}$/.test(local))
        localSignals.push('one or two letters plus a long number, typical of generated addresses');
    const impersonation = !exact && (foldedHit ? 1 : nearest && nearest.distance <= 2 ? 2 : 0);
    const verdict = exact
        ? `The domain is the real ${domain} — this is not a lookalike, so judge the local part instead.`
        : impersonation === 1
            ? `The domain only looks like ${foldedHit}: swapping lookalike characters turns it into ${foldedHit}. Treat it as an impersonation of that provider.`
            : impersonation === 2
                ? `The domain is ${nearest.distance} character(s) away from ${nearest.brand}, which is the classic typosquat of that provider. No legitimate mail comes from it.`
                : 'The domain is not a close edit of any provider this server knows about, so there is no typo-squat signature here.';
    const lines = [
        `Impersonation check for ${raw}:`,
        `Verdict: ${verdict}`,
        `Domain: ${domain}${exact ? ' (exact known provider)' : ''}`,
        `Closest known domain: ${nearest ? `${nearest.brand} (edit distance ${nearest.distance})` : 'none'}`,
    ];
    if (impersonation === 1)
        lines.push(`Lookalike-normalised domain: ${folded} = ${foldedHit}`);
    lines.push('', `Local part "${local}":`, localSignals.length
        ? localSignals.map((signal) => `  - ${signal}`).join('\n')
        : '  - no generated-address pattern found; it looks like an ordinary chosen address');
    lines.push('', `Compared against ${TARGET_BRANDS.length} major providers${brandArg ? ` plus "${brandArg}"` : ''}. This judges the address you supplied; lookalike_domains searches for variants that are actually registered.`);
    return lines.join('\n');
}
