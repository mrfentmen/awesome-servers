const m0 = (() => {
    const BASE = 'https://clinicaltrials.gov/api/v2/studies';
    async function search(args) {
        const q = (args.query ?? '').trim();
        if (!q)
            return 'Provide a search query.';
        const limit = Math.max(1, Math.min(args.limit ?? 10, 30));
        const url = `${BASE}?query.term=${encodeURIComponent(q)}&pageSize=${limit}&fields=NCTId,BriefTitle,OverallStatus,LeadSponsorName,StartDate`;
        const res = await fetch(url, {
            headers: { 'User-Agent': 'mrfentmen-clinicaltrials-mcp/1.0', Accept: 'application/json' },
            signal: AbortSignal.timeout(25000),
        });
        if (!res.ok)
            throw new Error(`ClinicalTrials.gov returned ${res.status}`);
        const data = (await res.json());
        const rows = data.studies ?? [];
        if (!rows.length)
            return `No clinical trials found for "${q}".`;
        return `Clinical trials for "${q}" (${data.totalCount ?? rows.length} total, ${rows.length} shown):\n` +
            rows
                .map((s, i) => {
                const protocol = (s.protocolSection ?? {});
                const idModule = (protocol.identificationModule ?? {});
                const statusModule = (protocol.statusModule ?? {});
                const sponsor = (protocol.sponsorCollaboratorsModule ?? {});
                const leadOrg = (sponsor.leadSponsor ?? {});
                return `${i + 1}. ${idModule.briefTitle ?? 'untitled'} | ${statusModule.overallStatus ?? ''} | ${leadOrg?.name ?? ''} | ${idModule.nctId ?? ''}`;
            })
                .join('\n');
    }
    return { search };
})();
const m1 = (() => {
    const UA = "mrfentmen-clinical-trials-mcp/1.0 (https://github.com/mrfentmen)";
    class TrialsError extends Error {
    }
    async function get(url, headers = {}) {
        const res = await fetch(url, { headers: { "User-Agent": UA, ...headers }, signal: AbortSignal.timeout(25000) });
        if (!res.ok)
            throw new TrialsError(`API error ${res.status}`);
        return (await res.json());
    }
    async function clinicalTrials(args) {
        const q = encodeURIComponent(args.query ?? "");
        const limit = Math.min(args.limit ?? 10, 25);
        const d = await get(`https://clinicaltrials.gov/api/v2/studies?query.term=${q}&pageSize=${limit}`);
        const rows = d.studies ?? [];
        return rows.map((s) => {
            const p = s.protocolSection;
            const id = p?.identificationModule?.nctId ?? "";
            const title = p?.identificationModule?.briefTitle ?? "";
            const status = p?.statusModule?.overallStatus ?? "";
            const conds = (p?.conditionsModule?.conditions ?? []).join(", ");
            return `${id} | ${status}\n  ${title}\n  ${conds}`;
        }).join("\n\n") || "No trials found";
    }
    async function trial(args) {
        const id = args.nct_id ?? "";
        if (!id)
            throw new TrialsError("Provide an NCT id");
        const d = await get(`https://clinicaltrials.gov/api/v2/studies/${id}`);
        const p = d.protocolSection;
        return [
            `${p?.identificationModule?.nctId} | ${p?.statusModule?.overallStatus}`,
            p?.identificationModule?.briefTitle ?? "",
            p?.descriptionModule?.briefSummary ?? "",
            `Conditions: ${(p?.conditionsModule?.conditions ?? []).join(", ")}`,
            `Sponsor: ${p?.sponsorCollaboratorsModule?.leadSponsor?.name ?? ""}`,
            `Phase: ${(p?.designModule?.phases ?? []).join(", ")}`,
        ].filter(Boolean).join("\n");
    }
    async function pubmed(args) {
        const q = encodeURIComponent(args.query ?? "");
        const limit = Math.min(args.limit ?? 10, 25);
        const esearch = await get(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${q}&retmax=${limit}&retmode=json`);
        const ids = esearch.esearchresult?.idlist ?? [];
        if (!ids.length)
            return "No PubMed articles found";
        const esummary = await get(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`);
        const docs = esummary.result ?? {};
        return ids.map((id) => {
            const doc = docs[id] ?? {};
            const authors = (doc.authors ?? []).slice(0, 3).map((a) => a.name).join(", ");
            return `${doc.title ?? ""}\n  ${authors} | ${doc.fulljournalname ?? ""} (${doc.pubdate ?? ""}) | PMID ${id}`;
        }).join("\n\n");
    }
    return { TrialsError, clinicalTrials, pubmed, trial };
})();
export const TrialsError = m1.TrialsError;
export const clinicalTrials = m1.clinicalTrials;
export const pubmed = m1.pubmed;
export const search = m0.search;
export const trial = m1.trial;
export const m0_search = m0.search;
export const m1_clinicalTrials = m1.clinicalTrials;
export const m1_TrialsError = m1.TrialsError;
export const m1_pubmed = m1.pubmed;
export const m1_trial = m1.trial;
const m2 = (() => {
    const BASE2 = 'https://clinicaltrials.gov/api/v2/studies';
    const UA2 = 'mrfentmen-clinicaltrials-mcp/1.0';
    async function query(q, limit, fields) {
        const url = `${BASE2}?${q}&pageSize=${limit}&fields=${fields}`;
        const res = await fetch(url, {
            headers: { 'User-Agent': UA2, Accept: 'application/json' },
            signal: AbortSignal.timeout(25000),
        });
        if (!res.ok)
            throw new Error(`ClinicalTrials.gov returned ${res.status}`);
        const data = (await res.json());
        const rows = data.studies ?? [];
        if (!rows.length)
            return 'No trials found.';
        return `Clinical trials (${data.totalCount ?? rows.length} total, ${rows.length} shown):\n` +
            rows.map((s, i) => {
                const p = (s.protocolSection ?? {});
                const id = (p.identificationModule ?? {});
                const st = (p.statusModule ?? {});
                return `${i + 1}. ${id.briefTitle ?? 'untitled'} | ${st.overallStatus ?? ''} | ${id.nctId ?? ''}`;
            }).join('\n');
    }
    const F = 'NCTId,BriefTitle,OverallStatus,LeadSponsorName,StartDate';
    async function recruiting(args) {
        const q = (args.query ?? '').trim();
        const limit = Math.max(1, Math.min(args.limit ?? 10, 30));
        const term = q ? `query.term=${encodeURIComponent(q)}&` : '';
        return query(`${term}filter.advanced=AREA%5BOverallStatus%5DRECRUITING`, limit, F);
    }
    async function byPhase(args) {
        const phase = (args.phase ?? 'PHASE2').trim().toUpperCase().replace(/^PHASE/, '');
        const limit = Math.max(1, Math.min(args.limit ?? 10, 30));
        return query(`filter.advanced=AREA%5BPhase%5DPHASE${phase}`, limit, F);
    }
    async function bySponsor(args) {
        const sponsor = (args.sponsor ?? '').trim();
        if (!sponsor)
            return 'Provide a sponsor name.';
        const limit = Math.max(1, Math.min(args.limit ?? 10, 30));
        return query(`query.spons=${encodeURIComponent(sponsor)}`, limit, F);
    }
    async function byIntervention(args) {
        const intr = (args.intervention ?? '').trim();
        if (!intr)
            return 'Provide a drug or intervention name.';
        const limit = Math.max(1, Math.min(args.limit ?? 10, 30));
        return query(`query.intr=${encodeURIComponent(intr)}`, limit, F);
    }
    async function trialLocations(args) {
        const id = (args.nct_id ?? '').trim().toUpperCase();
        if (!id)
            throw new Error('Provide an NCT id.');
        const res = await fetch(`${BASE2}/${encodeURIComponent(id)}`, {
            headers: { 'User-Agent': UA2, Accept: 'application/json' },
            signal: AbortSignal.timeout(25000),
        });
        if (!res.ok)
            throw new Error(`ClinicalTrials.gov returned ${res.status}`);
        const d = (await res.json());
        const locs = d?.protocolSection?.contactsLocationsModule?.locations ?? [];
        if (!locs.length)
            return `No locations listed for ${id}.`;
        return locs.slice(0, 20).map((l, i) => `${i + 1}. ${l.facility ?? '?'} | ${l.city ?? ''}, ${l.state ?? ''} ${l.country ?? ''} (${l.status ?? ''})`).join('\n');
    }
    return { byIntervention, byPhase, bySponsor, recruiting, trialLocations };
})();
export const byIntervention = m2.byIntervention;
export const byPhase = m2.byPhase;
export const bySponsor = m2.bySponsor;
export const recruiting = m2.recruiting;
export const trialLocations = m2.trialLocations;
export const m2_byIntervention = m2.byIntervention;
export const m2_byPhase = m2.byPhase;
export const m2_bySponsor = m2.bySponsor;
export const m2_recruiting = m2.recruiting;
export const m2_trialLocations = m2.trialLocations;
