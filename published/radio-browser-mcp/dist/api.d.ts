export declare class RadioError extends Error {
}
export interface Station {
    stationuuid: string;
    name: string;
    url_resolved?: string;
    homepage?: string;
    favicon?: string;
    tags?: string;
    country?: string;
    countrycode?: string;
    language?: string;
    codec?: string;
    bitrate?: number;
    votes?: number;
    clickcount?: number;
}
export declare function searchStations(name: string, limit?: number): Promise<Station[]>;
export declare function stationsByTag(tag: string, limit?: number): Promise<Station[]>;
export declare function stationsByCountry(country: string, limit?: number): Promise<Station[]>;
export declare function topVoted(limit?: number): Promise<Station[]>;
export declare function formatStation(s: Station, index?: number): string;
