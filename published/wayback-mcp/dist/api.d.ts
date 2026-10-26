export declare class WaybackError extends Error {
}
export interface Snapshot {
    timestamp: string;
    original: string;
    statusCode: string;
    mimeType: string;
    length: string;
    url: string;
}
export declare function getSnapshots(url: string, args?: {
    limit?: number;
    from?: string;
    to?: string;
}): Promise<Snapshot[]>;
/** Widest view: every host under a domain, not just the exact URL. */
export declare function domainSnapshots(domain: string, limit?: number): Promise<Snapshot[]>;
export interface SiteHistory {
    first: string;
    last: string;
    total: number;
    byYear: Array<{
        year: string;
        count: number;
    }>;
}
/**
 * First/last capture plus a per-year breakdown.
 *
 * Three cheap CDX calls rather than one exhaustive scan: collapsing the whole
 * capture history takes tens of seconds and sometimes times out, while
 * limit=1 / limit=-1 / collapse=timestamp:4 all come back in a few seconds.
 */
export declare function siteHistory(url: string, years?: number): Promise<SiteHistory>;
export declare function getAvailability(url: string): Promise<Snapshot | null>;
export declare function getSnapshotText(timestamp: string, originalUrl: string, maxChars?: number): Promise<string>;
export declare function fmtTimestamp(ts: string): string;
export declare function formatSnapshot(s: Snapshot, index?: number): string;
/**
 * One row per archived month with the status code recorded then. A page that
 * started redirecting or returning 404 keeps its old 200 captures, so the month
 * list is the only place that change is visible.
 */
export declare function statusHistory(url: string, limit?: number): Promise<string>;
/**
 * Coverage of the archive for one URL: which months inside the captured span
 * have no capture at all, and the longest run of them. This is how a research
 * or compliance question gets answered honestly: not "is it archived" but
 * "how much of the period is actually missing".
 */
export declare function captureGaps(url: string, since?: string): Promise<string>;
/**
 * What actually changed between the same page in two different years: the
 * wording that appeared and the wording that vanished. compare_years prints the
 * two pages; this reports the difference between them.
 */
export declare function snapshotDiff(args: {
    url: string;
    yearA: string;
    yearB: string;
    maxChars?: number;
}): Promise<string>;
/**
 * Captures that came back as something other than 200 across a whole domain:
 * redirects and dead pages. Link-rot checks and site audits start here.
 */
export declare function brokenPages(url: string, limit?: number): Promise<string>;
/**
 * What lives under a path: for a domain and a prefix, the archived URLs beneath
 * it, how many there are, when the oldest and newest were captured, and the shape
 * of the path tree one level down. The inventory question behind "what did this
 * part of the site actually contain".
 */
export declare function prefixInventory(args: {
    domain: string;
    prefix?: string;
    limit?: number;
}): Promise<string>;
