/**
 * ProPublica Nonprofit Explorer client, keyless.
 * IRS Form 990 data for every US registered nonprofit.
 */
export declare class NonprofitError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export interface OrgSummary {
    ein: number;
    strein?: string;
    name: string;
    sub_name?: string;
    city?: string;
    state?: string;
    ntee_code?: string;
    subseccd?: number;
    score?: number;
}
export interface Filing {
    formtype?: number;
    pdf_url?: string;
    updated?: string;
    tax_prd_yr?: number;
    totrevenue?: number;
    totfuncexpns?: number;
    totassetsend?: number;
    totliabend?: number;
    pdf_url_alt?: string;
}
export interface OrgDetails {
    organization: {
        ein: number;
        name: string;
        sub_name?: string;
        address?: string;
        city?: string;
        state?: string;
        zipcode?: string;
        ntee_code?: string;
        subseccd?: number;
        ruling_date?: string;
        have_filings?: boolean;
    };
    filings_with_data?: Filing[];
    filings_without_data?: Filing[];
}
export interface SearchResult {
    total_results: number;
    organizations: OrgSummary[];
}
export declare function search(query: string, pageNo?: number): Promise<SearchResult>;
export declare function searchByState(state: string, pageNo?: number): Promise<SearchResult>;
/** ProPublica filters nonprofits by the numeric NTEE major group: A=1, B=2, ... Z=26. */
export declare function majorGroupNumber(ntee: string): number;
export declare function searchByCategory(ntee: string, state?: string, pageNo?: number): Promise<SearchResult>;
export declare function details(ein: string): Promise<OrgDetails>;
export declare function cleanEin(ein: string): string;
export declare function formatSearch(result: SearchResult, title: string): string;
export declare function formatDetails(d: OrgDetails): string;
export declare function financialSummary(d: OrgDetails): string;
export declare function compare(eins: string[]): Promise<string>;
export declare function searchBySubsection(args: {
    subsection: string;
    state?: string;
    page?: number;
}): Promise<string>;
export declare function filings(args: {
    ein: string;
    limit?: number;
}): Promise<string>;
/** How a state's registered nonprofits spread across the activity codes they file under. */
export declare function stateSectorCensus(args: {
    state?: string;
    limit?: number;
    pages?: number;
}): Promise<string>;
/** How current the filings behind a set of organisations are, and what each return reported. */
export declare function filingRecencyAudit(args: {
    eins: string;
    limit?: number;
}): Promise<string>;
