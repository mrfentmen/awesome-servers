export declare class OyezError extends Error {
}
export interface CaseHit {
    name: string;
    term?: string;
    docket?: string;
    href?: string;
}
export declare function searchCases(query: string, limit?: number): Promise<CaseHit[]>;
export interface CaseDetails {
    name?: string;
    docket?: string;
    parties: string[];
    facts?: string;
    question?: string;
    conclusion?: string;
    decisions: string[];
    audio: string[];
    url?: string;
}
export declare function getCase(term: string, docket: string): Promise<CaseDetails>;
export declare function formatHit(h: CaseHit, index?: number): string;
export declare function formatCase(c: CaseDetails): string;
export interface CaseCitationsArgs {
    query: string;
    limit?: number;
}
export interface CaseQuestionsArgs {
    query: string;
    limit?: number;
}
export interface CitationLookupArgs {
    volume: string;
    page: string;
    limit?: number;
}
export declare function citation_lookup(args: CitationLookupArgs): Promise<string>;
export interface CaseTimelineArgs {
    query: string;
    limit?: number;
}
