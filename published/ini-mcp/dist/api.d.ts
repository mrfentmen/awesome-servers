/**
 * INI Files — keyless public API client.
 */
export declare class SourceError extends Error {
}
export declare function section(title: string, rows: string[]): string;
export declare function parseIniFile(a: {
    text: string;
}): Promise<string>;
export declare function iniToJson(a: {
    text: string;
    mergeDuplicateSections?: boolean;
}): Promise<string>;
export declare function createIni(a: {
    json: string;
}): Promise<string>;
export declare function validateIni(a: {
    text: string;
}): Promise<string>;
