export declare class WaterError extends Error {
}
export interface Series {
    sourceInfo?: {
        siteName?: string;
        siteCode?: Array<{
            value?: string;
        }>;
        geoLocation?: {
            geogLocation?: {
                latitude?: number;
                longitude?: number;
            };
        };
    };
    variable?: {
        variableCode?: Array<{
            value?: string;
        }>;
        variableDescription?: string;
        unit?: {
            unitCode?: string;
        };
    };
    values?: Array<{
        value?: Array<{
            value?: string;
            dateTime?: string;
        }>;
    }>;
}
export declare const PARAMETERS: Record<string, string>;
export declare function seriesLines(series: Series[], limit?: number): string;
export declare function instantaneous(site: string, parameter: string, days: number): Promise<Series[]>;
export declare function daily(site: string, parameter: string, days: number): Promise<Series[]>;
export interface SiteRow {
    site: string;
    name: string;
    lat?: number;
    lon?: number;
    state?: string;
    county?: string;
}
export declare function siteInfo(site: string): Promise<SiteRow[]>;
export declare function sitesInState(state: string, limit: number): Promise<SiteRow[]>;
export declare function describeSite(row: SiteRow): string;
